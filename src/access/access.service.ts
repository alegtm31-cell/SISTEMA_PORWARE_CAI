import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async registerAccess(
    targetId: string,
    isGuest: boolean,
    tipo: 'ENTRADA' | 'SALIDA',
    observacion?: string,
  ) {
    const cleanId = targetId.trim();

    if (isGuest) {
      // Buscar invitado por ID o por Cédula
      const guest = await this.prisma.invitado.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { cedula: { equals: cleanId, mode: 'insensitive' } },
          ],
        },
      });

      if (!guest) {
        throw new NotFoundException(`Invitado con identificación '${cleanId}' no encontrado`);
      }

      return this.prisma.historial.create({
        data: {
          invitadoId: guest.id,
          tipo,
          observacion: observacion || null,
        },
        include: {
          invitado: {
            include: {
              empleado: {
                select: {
                  nombre: true,
                  apellido: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Buscar usuario/empleado por ID o por Cédula
      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { cedula: { equals: cleanId, mode: 'insensitive' } },
          ],
        },
      });

      if (!user) {
        throw new NotFoundException(`Usuario/Empleado con identificación '${cleanId}' no encontrado`);
      }

      return this.prisma.historial.create({
        data: {
          usuarioId: user.id,
          tipo,
          observacion: observacion || null,
        },
        include: {
          usuario: {
            select: {
              id: true,
              cedula: true,
              nombre: true,
              apellido: true,
              rol: true,
            },
          },
        },
      });
    }
  }

  async lookupPersona(identificacion: string) {
    const cleanId = identificacion.trim();
    if (!cleanId) {
      throw new NotFoundException('Identificación vacía');
    }

    // Normalización de cédula con o sin prefijo V-, E-, etc.
    const rawNumber = cleanId.replace(/^[VEJGPvejgp]-?/, '');
    const variants = [
      cleanId,
      rawNumber,
      `V-${rawNumber}`,
      `E-${rawNumber}`,
      `J-${rawNumber}`,
    ];

    // 1. Buscar en Usuario (Personal interno)
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { cedula: { in: variants, mode: 'insensitive' } },
        ],
      },
    });

    if (user) {
      const lastMove = await this.prisma.historial.findFirst({
        where: { usuarioId: user.id },
        orderBy: { timestamp: 'desc' },
      });
      const estaDentro = lastMove?.tipo === 'ENTRADA';

      return {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        isGuest: false,
        empresa: 'Personal Interno',
        estadoSeguridad: 'AUTORIZADO',
        estaDentro,
      };
    }

    // 2. Buscar en Invitado (Visitantes)
    const guest = await this.prisma.invitado.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { cedula: { in: variants, mode: 'insensitive' } },
        ],
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (guest) {
      const lastMove = await this.prisma.historial.findFirst({
        where: { invitadoId: guest.id },
        orderBy: { timestamp: 'desc' },
      });
      const estaDentro = lastMove?.tipo === 'ENTRADA';

      return {
        id: guest.id,
        cedula: guest.cedula,
        nombre: guest.nombre,
        apellido: guest.apellido,
        rol: 'VISITANTE',
        isGuest: true,
        empresa: guest.empresa || 'Particular',
        empleadoAnfitrion: guest.empleado ? `${guest.empleado.nombre} ${guest.empleado.apellido}` : undefined,
        estadoSeguridad: 'AUTORIZADO',
        estaDentro,
      };
    }

    throw new NotFoundException(`No se encontró ningún empleado ni visitante registrado con la cédula o ID '${cleanId}'`);
  }
}
