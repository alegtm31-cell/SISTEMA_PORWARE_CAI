import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateInvitadoDto } from './dto/create-invitado.dto';
import { UpdateInvitadoDto } from './dto/update-invitado.dto';

@Injectable()
export class InvitadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}


  async create(dto: CreateInvitadoDto, currentUser: any) {
    // Hallazgo 7: Si es EMPLEADO, forzar que el anfitrión sea él mismo
    let hostId = currentUser.id;
    if (currentUser.rol === 'ADMINISTRADOR' || currentUser.rol === 'SEGURIDAD') {
      hostId = dto.empleadoId || currentUser.id;
    }

    // Verificar que el empleado anfitrión exista
    const host = await this.prisma.usuario.findUnique({ where: { id: hostId } });
    if (!host) {
      throw new BadRequestException(`El empleado anfitrión especificado (ID: ${hostId}) no existe`);
    }

    const cleanCedula = dto.cedula.trim();

    // Upsert: si el visitante ya existe en el sistema, actualiza sus datos y vincula la visita
    const result = await this.prisma.invitado.upsert({
      where: { cedula: cleanCedula },
      update: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        empresa: dto.empresa ? dto.empresa.trim() : null,
        placa: dto.placa ? dto.placa.trim().toUpperCase() : undefined,
        telefono: dto.telefono ? dto.telefono.trim() : undefined,
        motivo: dto.motivo ? dto.motivo.trim() : undefined,
        empleadoId: hostId,
      },
      create: {
        cedula: cleanCedula,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        empresa: dto.empresa ? dto.empresa.trim() : null,
        placa: dto.placa ? dto.placa.trim().toUpperCase() : null,
        telefono: dto.telefono ? dto.telefono.trim() : null,
        motivo: dto.motivo ? dto.motivo.trim() : null,
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

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'CREAR_INVITADO',
      entidad: 'Invitado',
      entidadId: result.id,
      detalles: { cedula: result.cedula, nombre: `${result.nombre} ${result.apellido}`, placa: result.placa, anfitrionId: hostId },
    });

    return result;
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

    const sanitizedTake = Math.min(Math.max(Number(take) || 50, 1), 100);
    const sanitizedSkip = Math.max(Number(skip) || 0, 0);

    const [total, data] = await Promise.all([
      this.prisma.invitado.count({ where }),
      this.prisma.invitado.findMany({
        where,
        skip: sanitizedSkip,
        take: sanitizedTake,
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

  async findOne(idOrCedula: string, currentUser?: any) {
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

    // Hallazgo 7: Si es EMPLEADO, solo puede ver sus propios invitados
    if (currentUser && currentUser.rol === 'EMPLEADO' && guest.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para ver detalles de invitados registrados por otros empleados');
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

  async update(id: string, dto: UpdateInvitadoDto, currentUser?: any) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    // Hallazgo 7: Validar que el empleado sea dueño del registro
    if (currentUser && currentUser.rol === 'EMPLEADO' && existing.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para modificar visitantes creados por otro empleado');
    }

    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido) data.apellido = dto.apellido.trim();
    if (dto.empresa !== undefined) data.empresa = dto.empresa ? dto.empresa.trim() : null;
    if (dto.cedula) data.cedula = dto.cedula.trim();
    if (dto.placa !== undefined) data.placa = dto.placa ? dto.placa.trim().toUpperCase() : null;
    if (dto.telefono !== undefined) data.telefono = dto.telefono ? dto.telefono.trim() : null;
    if (dto.motivo !== undefined) data.motivo = dto.motivo ? dto.motivo.trim() : null;

    // Solo admin puede transferir anfitrión
    if (dto.empleadoId && currentUser?.rol === 'ADMINISTRADOR') {
      const host = await this.prisma.usuario.findUnique({ where: { id: dto.empleadoId } });
      if (!host) {
        throw new BadRequestException(`El empleado anfitrión (ID: ${dto.empleadoId}) no existe`);
      }
      data.empleadoId = dto.empleadoId;
    }

    const updated = await this.prisma.invitado.update({
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

    await this.auditoriaService.registrar({
      usuarioId: currentUser?.id,
      accion: 'ACTUALIZAR_INVITADO',
      entidad: 'Invitado',
      entidadId: id,
      detalles: { cambios: Object.keys(data), cedula: updated.cedula },
    });

    return updated;
  }

  async setBloqueo(id: string, bloqueado: boolean, motivoBloqueo?: string) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    const updated = await this.prisma.invitado.update({
      where: { id },
      data: {
        bloqueado,
        motivoBloqueo: bloqueado ? motivoBloqueo || 'Bloqueado por seguridad' : null,
      },
    });

    await this.auditoriaService.registrar({
      accion: bloqueado ? 'BLOQUEO_INVITADO' : 'DESBLOQUEO_INVITADO',
      entidad: 'Invitado',
      entidadId: id,
      detalles: { motivo: motivoBloqueo, cedula: existing.cedula },
    });

    return updated;
  }

  async remove(id: string, currentUser?: any) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    if (currentUser && currentUser.rol === 'EMPLEADO' && existing.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para cancelar visitas de otros empleados');
    }

    const deleted = await this.prisma.invitado.delete({
      where: { id },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser?.id,
      accion: 'CANCELAR_INVITADO',
      entidad: 'Invitado',
      entidadId: id,
      detalles: { cedula: deleted.cedula, nombre: `${deleted.nombre} ${deleted.apellido}` },
    });

    return deleted;
  }
}

