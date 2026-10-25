import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterHistorialDto } from './dto/filter-historial.dto';

@Injectable()
export class HistorialService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterHistorialDto) {
    const { startDate, endDate, tipo, search, targetType, skip, take } = filter;
    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (targetType === 'USUARIO') {
      where.usuarioId = { not: null };
    } else if (targetType === 'INVITADO') {
      where.invitadoId = { not: null };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { observacion: { contains: term, mode: 'insensitive' } },
        {
          usuario: {
            OR: [
              { cedula: { contains: term, mode: 'insensitive' } },
              { nombre: { contains: term, mode: 'insensitive' } },
              { apellido: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
        {
          invitado: {
            OR: [
              { cedula: { contains: term, mode: 'insensitive' } },
              { nombre: { contains: term, mode: 'insensitive' } },
              { apellido: { contains: term, mode: 'insensitive' } },
              { empresa: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.historial.count({ where }),
      this.prisma.historial.findMany({
        where,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : 50,
        orderBy: { timestamp: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              cedula: true,
              nombre: true,
              apellido: true,
              email: true,
              rol: true,
            },
          },
          invitado: {
            include: {
              empleado: {
                select: {
                  id: true,
                  cedula: true,
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return { total, data };
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [entradasHoy, salidasHoy, totalHoy, ultimosMovimientos] = await Promise.all([
      this.prisma.historial.count({
        where: {
          tipo: 'ENTRADA',
          timestamp: { gte: startOfToday },
        },
      }),
      this.prisma.historial.count({
        where: {
          tipo: 'SALIDA',
          timestamp: { gte: startOfToday },
        },
      }),
      this.prisma.historial.count({
        where: {
          timestamp: { gte: startOfToday },
        },
      }),
      this.prisma.historial.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          usuario: { select: { nombre: true, apellido: true, cedula: true } },
          invitado: { select: { nombre: true, apellido: true, cedula: true } },
        },
      }),
    ]);

    return {
      fecha: new Date().toISOString(),
      entradasHoy,
      salidasHoy,
      totalHoy,
      dentroEstimado: Math.max(0, entradasHoy - salidasHoy),
      ultimosMovimientos,
    };
  }

  async getPersonaHistorial(idOrCedula: string) {
    const clean = idOrCedula.trim();

    // Buscar si es un usuario o un invitado
    const [user, guest] = await Promise.all([
      this.prisma.usuario.findFirst({
        where: {
          OR: [{ id: clean }, { cedula: { equals: clean, mode: 'insensitive' } }],
        },
      }),
      this.prisma.invitado.findFirst({
        where: {
          OR: [{ id: clean }, { cedula: { equals: clean, mode: 'insensitive' } }],
        },
      }),
    ]);

    if (!user && !guest) {
      throw new NotFoundException(`No se encontró persona con ID o cédula '${idOrCedula}'`);
    }

    const where: any = {};
    if (user) where.usuarioId = user.id;
    if (guest) where.invitadoId = guest.id;

    const historial = await this.prisma.historial.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return {
      tipoPersona: user ? 'EMPLEADO_USUARIO' : 'INVITADO',
      persona: user
        ? { id: user.id, cedula: user.cedula, nombre: `${user.nombre} ${user.apellido}`, rol: user.rol }
        : { id: guest!.id, cedula: guest!.cedula, nombre: `${guest!.nombre} ${guest!.apellido}`, empresa: guest!.empresa },
      totalMovimientos: historial.length,
      historial,
    };
  }

  async updateObservacion(id: string, observacion: string) {
    const record = await this.prisma.historial.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Registro de historial con ID '${id}' no encontrado`);
    }

    return this.prisma.historial.update({
      where: { id },
      data: { observacion },
    });
  }
}
