import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async registerAccess(
    targetId: string,
    isGuest: boolean,
    tipo: 'ENTRADA' | 'SALIDA',
    observacion?: string,
    registradoPorId?: string,
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

      // Regla 1: Control de Bloqueo persistido en base de datos
      if (guest.bloqueado && tipo === 'ENTRADA') {
        throw new ForbiddenException(
          `⛔ Acceso BLOQUEADO para el visitante ${guest.nombre} ${guest.apellido}. Motivo: ${guest.motivoBloqueo || 'Restricción de ingreso vigente.'}`,
        );
      }

      // Regla 2: Anti-Passback para Visitantes
      const lastMove = await this.prisma.historial.findFirst({
        where: { invitadoId: guest.id },
        orderBy: { timestamp: 'desc' },
      });

      if (lastMove) {
        if (lastMove.tipo === 'ENTRADA' && tipo === 'ENTRADA') {
          throw new BadRequestException(
            `Anti-Passback: El visitante ${guest.nombre} ${guest.apellido} ya tiene una ENTRADA registrada sin salida previa.`,
          );
        }
        if (lastMove.tipo === 'SALIDA' && tipo === 'SALIDA') {
          throw new BadRequestException(
            `Anti-Passback: El visitante ${guest.nombre} ${guest.apellido} ya se encuentra fuera de las instalaciones.`,
          );
        }
      } else if (tipo === 'SALIDA') {
        throw new BadRequestException(
          `No se puede registrar SALIDA para el visitante ${guest.nombre} ${guest.apellido} sin una ENTRADA previa registrada.`,
        );
      }

      return this.prisma.historial.create({
        data: {
          invitadoId: guest.id,
          tipo,
          observacion: observacion || null,
          registradoPorId: registradoPorId || null,
        },
        include: {
          registradoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              rol: true,
            },
          },
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

      // Regla 1: Control de Bloqueo persistido en base de datos
      if (user.bloqueado && tipo === 'ENTRADA') {
        throw new ForbiddenException(
          `⛔ Acceso BLOQUEADO para ${user.nombre} ${user.apellido}. Motivo: ${user.motivoBloqueo || 'Desincorporado o restringido por Recursos Humanos.'}`,
        );
      }

      // Regla 2: Anti-Passback para Personal Interno
      const lastMove = await this.prisma.historial.findFirst({
        where: { usuarioId: user.id },
        orderBy: { timestamp: 'desc' },
      });

      if (lastMove) {
        if (lastMove.tipo === 'ENTRADA' && tipo === 'ENTRADA') {
          throw new BadRequestException(
            `Anti-Passback: ${user.nombre} ${user.apellido} ya tiene una ENTRADA registrada sin salida previa.`,
          );
        }
        if (lastMove.tipo === 'SALIDA' && tipo === 'SALIDA') {
          throw new BadRequestException(
            `Anti-Passback: ${user.nombre} ${user.apellido} ya se encuentra fuera de las instalaciones.`,
          );
        }
      } else if (tipo === 'SALIDA') {
        throw new BadRequestException(
          `No se puede registrar SALIDA para ${user.nombre} ${user.apellido} sin una ENTRADA previa registrada.`,
        );
      }

      return this.prisma.historial.create({
        data: {
          usuarioId: user.id,
          tipo,
          observacion: observacion || null,
          registradoPorId: registradoPorId || null,
        },
        include: {
          registradoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              rol: true,
            },
          },
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
        bloqueado: user.bloqueado,
        motivoBloqueo: user.motivoBloqueo,
        estadoSeguridad: user.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
        estaDentro,
        ultimoRegistro: lastMove,
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
        bloqueado: guest.bloqueado,
        motivoBloqueo: guest.motivoBloqueo,
        estadoSeguridad: guest.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
        estaDentro,
        ultimoRegistro: lastMove,
      };
    }

    throw new NotFoundException(`No se encontró ningún empleado ni visitante registrado con la cédula o ID '${cleanId}'`);
  }
}
