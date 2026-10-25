import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitadoDto } from './dto/create-invitado.dto';
import { UpdateInvitadoDto } from './dto/update-invitado.dto';

@Injectable()
export class InvitadosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvitadoDto, defaultEmpleadoId: string) {
    const hostId = dto.empleadoId || defaultEmpleadoId;

    // Verificar que el empleado anfitrión exista
    const host = await this.prisma.usuario.findUnique({ where: { id: hostId } });
    if (!host) {
      throw new BadRequestException(`El empleado anfitrión especificado (ID: ${hostId}) no existe`);
    }

    const cleanCedula = dto.cedula.trim();

    // Upsert: si el visitante ya existe en el sistema, actualiza sus datos y asigna la nueva visita
    return this.prisma.invitado.upsert({
      where: { cedula: cleanCedula },
      update: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        empresa: dto.empresa ? dto.empresa.trim() : null,
        empleadoId: hostId,
      },
      create: {
        cedula: cleanCedula,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        empresa: dto.empresa ? dto.empresa.trim() : null,
        empleadoId: hostId,
      },
      include: {
        empleado: {
          select: {
            id: true,
            cedula: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(params?: { search?: string; empleadoId?: string; skip?: number; take?: number }) {
    const { search, empleadoId, skip, take } = params || {};
    const where: any = {};

    if (empleadoId) {
      where.empleadoId = empleadoId;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { cedula: { contains: term, mode: 'insensitive' } },
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { empresa: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.invitado.count({ where }),
      this.prisma.invitado.findMany({
        where,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          empleado: {
            select: {
              id: true,
              cedula: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          _count: {
            select: { historial: true },
          },
        },
      }),
    ]);

    return { total, data };
  }

  async findOne(idOrCedula: string) {
    const clean = idOrCedula.trim();
    const guest = await this.prisma.invitado.findFirst({
      where: {
        OR: [
          { id: clean },
          { cedula: { equals: clean, mode: 'insensitive' } },
        ],
      },
      include: {
        empleado: {
          select: {
            id: true,
            cedula: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        historial: {
          take: 20,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException(`Invitado '${idOrCedula}' no encontrado`);
    }

    return guest;
  }

  async findByEmpleado(empleadoId: string) {
    return this.prisma.invitado.findMany({
      where: { empleadoId },
      orderBy: { createdAt: 'desc' },
      include: {
        historial: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateInvitadoDto) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido) data.apellido = dto.apellido.trim();
    if (dto.empresa !== undefined) data.empresa = dto.empresa ? dto.empresa.trim() : null;
    if (dto.cedula) data.cedula = dto.cedula.trim();

    if (dto.empleadoId) {
      const host = await this.prisma.usuario.findUnique({ where: { id: dto.empleadoId } });
      if (!host) {
        throw new BadRequestException(`El empleado anfitrión (ID: ${dto.empleadoId}) no existe`);
      }
      data.empleadoId = dto.empleadoId;
    }

    return this.prisma.invitado.update({
      where: { id },
      data,
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
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    return this.prisma.invitado.delete({
      where: { id },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
      },
    });
  }
}
