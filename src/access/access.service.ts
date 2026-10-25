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
}
