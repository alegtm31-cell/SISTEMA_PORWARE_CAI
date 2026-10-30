import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateInvitadoDto } from './dto/create-invitado.dto';
import { UpdateInvitadoDto } from './dto/update-invitado.dto';
import { signQrPassPayload } from '../common/utils/qr-pass.util';

@Injectable()
export class InvitadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private buildPassForVisita(guest: any, visita: any) {
    if (!visita) return null;
    const expDate = visita.fechaExpiracion
      ? new Date(visita.fechaExpiracion)
      : new Date(new Date(visita.fecha || Date.now()).getTime() + 24 * 60 * 60 * 1000);

    try {
      const token = signQrPassPayload({
        visitaId: visita.id,
        invitadoId: guest.id,
        c: guest.cedula,
        n: `${guest.nombre} ${guest.apellido}`,
        v: expDate.toISOString(),
        p: visita.placa || guest.placa || undefined,
      });

      return {
        visitaId: visita.id,
        token,
        vigenciaHasta: expDate.toISOString(),
        estado: visita.estado,
      };
    } catch {
      return null;
    }
  }

  private enrichGuestWithPass(guest: any) {
    if (!guest) return guest;
    const activeVisita = Array.isArray(guest.visitas) ? guest.visitas[0] : undefined;
    const paseQr = activeVisita ? this.buildPassForVisita(guest, activeVisita) : null;
    return {
      ...guest,
      paseQr,
    };
  }

  async create(dto: CreateInvitadoDto, currentUser: any) {
    // Si es EMPLEADO, forzar que el anfitrión sea él mismo
    let hostId = currentUser.id;
    if (currentUser.rol === 'ADMINISTRADOR') {
      hostId = dto.empleadoId || currentUser.id;
    }

    // Verificar que el empleado anfitrión exista
    const host = await this.prisma.usuario.findUnique({ where: { id: hostId } });
    if (!host) {
      throw new BadRequestException(`El empleado anfitrión especificado (ID: ${hostId}) no existe`);
    }

    const cleanCedula = dto.cedula.trim();
    const dias = Math.min(Math.max(Number(dto.vigenciaDias) || 1, 1), 30);
    const fechaExpiracion = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    // Upsert: si el visitante ya existe en el sistema, actualiza sus datos, reactiva si tenía baja lógica y vincula la visita
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
        eliminado: false,
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
        eliminado: false,
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

    // Crear registro formal de Visita con vigencia en la tabla Visita
    let visitaCreated: any = null;
    if ((this.prisma as any).visita?.create) {
      visitaCreated = await this.prisma.visita.create({
        data: {
          invitadoId: result.id,
          empleadoId: hostId,
          fecha: new Date(),
          fechaExpiracion,
          motivo: result.motivo,
          placa: result.placa,
          estado: 'AUTORIZADA',
        },
      });
    }

    const paseQr = visitaCreated ? this.buildPassForVisita(result, visitaCreated) : null;

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'CREAR_INVITADO',
      entidad: 'Invitado',
      entidadId: result.id,
      detalles: {
        cedula: result.cedula,
        nombre: `${result.nombre} ${result.apellido}`,
        placa: result.placa,
        anfitrionId: hostId,
        visitaId: visitaCreated?.id,
        vigenciaHasta: fechaExpiracion.toISOString(),
      },
    });

    return {
      ...result,
      paseQr,
    };
  }

  async emitirPaseQr(id: string, currentUser: any, vigenciaDias?: number) {
    const guest = await this.prisma.invitado.findUnique({
      where: { id },
      include: {
        empleado: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!guest || guest.eliminado) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    if (currentUser.rol === 'EMPLEADO' && guest.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para emitir pases para invitados de otros empleados');
    }

    if (guest.bloqueado) {
      throw new ForbiddenException('No se puede emitir pase QR a un visitante bloqueado por seguridad');
    }

    const dias = Math.min(Math.max(Number(vigenciaDias) || 1, 1), 30);
    const fechaExpiracion = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    const visita = await this.prisma.visita.create({
      data: {
        invitadoId: guest.id,
        empleadoId: guest.empleadoId,
        fecha: new Date(),
        fechaExpiracion,
        motivo: guest.motivo,
        placa: guest.placa,
        estado: 'AUTORIZADA',
      },
    });

    const paseQr = this.buildPassForVisita(guest, visita);

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'EMITIR_PASE_QR',
      entidad: 'Visita',
      entidadId: visita.id,
      detalles: { invitadoId: guest.id, cedula: guest.cedula, vigenciaHasta: fechaExpiracion.toISOString() },
    });

    return {
      ...guest,
      paseQr,
    };
  }

  async findAll(params?: { search?: string; empleadoId?: string; skip?: number; take?: number }) {
    const { search, empleadoId, skip, take } = params || {};
    const where: any = { eliminado: false };

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

    const [total, rawData] = await Promise.all([
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
          visitas: {
            where: { estado: 'AUTORIZADA' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { historial: true },
          },
        },
      }),
    ]);

    const data = rawData.map((g) => this.enrichGuestWithPass(g));
    return { total, data };
  }

  async findOne(idOrCedula: string, currentUser?: any) {
    const clean = idOrCedula.trim();
    const guest = await this.prisma.invitado.findFirst({
      where: {
        eliminado: false,
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
        visitas: {
          where: { estado: 'AUTORIZADA' },
          orderBy: { createdAt: 'desc' },
          take: 1,
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

    // Si es EMPLEADO, solo puede ver sus propios invitados
    if (currentUser && currentUser.rol === 'EMPLEADO' && guest.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para ver detalles de invitados registrados por otros empleados');
    }

    return this.enrichGuestWithPass(guest);
  }

  async findByEmpleado(empleadoId: string) {
    const list = await this.prisma.invitado.findMany({
      where: { empleadoId, eliminado: false },
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
        visitas: {
          where: { estado: 'AUTORIZADA' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        historial: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return list.map((g) => this.enrichGuestWithPass(g));
  }

  async update(id: string, dto: UpdateInvitadoDto, currentUser?: any) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing || existing.eliminado) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    // Validar que el empleado sea dueño del registro
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
            email: true,
          },
        },
        visitas: {
          where: { estado: 'AUTORIZADA' },
          orderBy: { createdAt: 'desc' },
          take: 1,
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

    return this.enrichGuestWithPass(updated);
  }

  async setBloqueo(id: string, bloqueado: boolean, motivoBloqueo?: string, autorId?: string) {
    const existing = await this.prisma.invitado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    const updated = await this.prisma.invitado.update({
      where: { id },
      data: {
        bloqueado,
        motivoBloqueo: bloqueado ? motivoBloqueo || 'Bloqueado por administración' : null,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: autorId,
      accion: bloqueado ? 'BLOQUEO_INVITADO' : 'DESBLOQUEO_INVITADO',
      entidad: 'Invitado',
      entidadId: id,
      detalles: { motivo: motivoBloqueo, cedula: existing.cedula },
    });

    return updated;
  }

  async remove(id: string, currentUser?: any) {
    const existing = await this.prisma.invitado.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            historial: true,
            visitas: true,
          },
        },
      },
    });

    if (!existing || existing.eliminado) {
      throw new NotFoundException(`Invitado con ID '${id}' no encontrado`);
    }

    if (currentUser && currentUser.rol === 'EMPLEADO' && existing.empleadoId !== currentUser.id) {
      throw new ForbiddenException('No tiene permisos para cancelar visitas de otros empleados');
    }

    // Cancelar visitas activas asociadas
    if ((this.prisma as any).visita?.updateMany) {
      await this.prisma.visita.updateMany({
        where: { invitadoId: id, estado: { in: ['PENDIENTE', 'AUTORIZADA'] } },
        data: { estado: 'CANCELADA' },
      });
    }

    // Producción 7: Evitar borrado físico de invitados con historial (usar baja lógica)
    const historialCount = existing._count?.historial ?? 0;
    if (historialCount > 0) {
      const deactivated = await this.prisma.invitado.update({
        where: { id },
        data: {
          eliminado: true,
        },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          apellido: true,
          eliminado: true,
        },
      });

      await this.auditoriaService.registrar({
        usuarioId: currentUser?.id,
        accion: 'BAJA_LOGICA_INVITADO',
        entidad: 'Invitado',
        entidadId: id,
        detalles: {
          cedula: deactivated.cedula,
          nombre: `${deactivated.nombre} ${deactivated.apellido}`,
          motivo: 'Invitado con historial de accesos; se aplica baja lógica para preservar evidencia.',
          registrosPreservados: historialCount,
        },
      });

      return deactivated;
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
