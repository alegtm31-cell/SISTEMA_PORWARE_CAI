import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { UnirseEventoDto } from './dto/unirse-evento.dto';
import { GaritaAltaEventoDto } from './dto/garita-alta-evento.dto';
import {
  signEventJoinToken,
  verifyEventJoinToken,
  signQrPassPayload,
} from '../common/utils/qr-pass.util';

@Injectable()
export class EventosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private assertOwnershipOrAdmin(evento: { anfitrionId: string }, currentUser: { id: string; rol: string }) {
    if (currentUser.rol === 'ADMINISTRADOR') {
      return;
    }
    if (currentUser.rol === 'EMPLEADO' && evento.anfitrionId === currentUser.id) {
      return;
    }
    throw new ForbiddenException('No tiene permisos para ver ni gestionar eventos de otro anfitrión.');
  }

  private buildJoinToken(evento: { id: string; nonceCodigo: string; fin: Date | string }): string {
    return signEventJoinToken({
      eventoId: evento.id,
      nonce: evento.nonceCodigo,
      v: new Date(evento.fin).toISOString(),
    });
  }

  private buildPassForVisita(guest: any, visita: any) {
    if (!guest || !visita) return null;
    const expDate = visita.fechaExpiracion
      ? new Date(visita.fechaExpiracion)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

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

  private enrichEvento(evento: any) {
    if (!evento) return evento;
    const now = Date.now();
    const finTime = new Date(evento.fin).getTime();
    const effectiveEstado =
      evento.estado === 'ACTIVO' && finTime < now ? 'CERRADO' : evento.estado;

    const invitadosRaw: any[] = Array.isArray(evento.invitados) ? evento.invitados : [];
    const invitados = invitadosRaw.map((item) => ({
      ...item,
      paseQr:
        item.estado === 'APROBADO' && item.invitado && item.visita
          ? this.buildPassForVisita(item.invitado, item.visita)
          : null,
    }));

    const aprobadosCount = invitadosRaw.filter((i) => i.estado === 'APROBADO').length;
    const pendientesCount = invitadosRaw.filter((i) => i.estado === 'PENDIENTE').length;
    const rechazadosCount = invitadosRaw.filter(
      (i) => i.estado === 'RECHAZADO' || i.estado === 'REVOCADO',
    ).length;

    const tokenUnion =
      effectiveEstado === 'ACTIVO' && evento.codigoActivo
        ? this.buildJoinToken(evento)
        : null;

    return {
      ...evento,
      estado: effectiveEstado,
      tokenUnion,
      resumenCupo: {
        aforo: evento.aforo,
        aprobados: aprobadosCount,
        pendientes: pendientesCount,
        rechazados: rechazadosCount,
        disponibles: Math.max(evento.aforo - (aprobadosCount + pendientesCount), 0),
      },
      invitados,
    };
  }

  /**
   * Cierre automático de eventos cuya fecha/hora de fin ya pasó,
   * expirando también las visitas asociadas que sigan abiertas.
   */
  async sincronizarEventosVencidos() {
    if (!this.prisma.evento?.findMany) {
      return;
    }
    const now = new Date();
    const vencidos = await this.prisma.evento.findMany({
      where: {
        estado: 'ACTIVO',
        fin: { lt: now },
      },
      include: {
        invitados: {
          where: { visitaId: { not: null } },
          select: { visitaId: true },
        },
      },
    });

    if (vencidos.length === 0) {
      return;
    }

    const eventoIds = vencidos.map((e) => e.id);
    const visitaIds = vencidos
      .flatMap((e) => e.invitados.map((inv) => inv.visitaId))
      .filter((id): id is string => Boolean(id));

    await this.prisma.evento.updateMany({
      where: { id: { in: eventoIds } },
      data: { estado: 'CERRADO', codigoActivo: false },
    });

    if (visitaIds.length > 0 && this.prisma.visita?.updateMany) {
      await this.prisma.visita.updateMany({
        where: {
          id: { in: visitaIds },
          estado: { in: ['PENDIENTE', 'AUTORIZADA'] },
        },
        data: { estado: 'FINALIZADA' },
      });
    }
  }

  async create(dto: CreateEventoDto, currentUser: { id: string; rol: string }) {
    const inicioDate = new Date(dto.inicio);
    const finDate = new Date(dto.fin);

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      throw new BadRequestException('Las fechas de inicio y fin del evento son inválidas.');
    }
    if (finDate.getTime() <= inicioDate.getTime()) {
      throw new BadRequestException('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.');
    }
    if (finDate.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha/hora de fin del evento debe estar en el futuro.');
    }

    const anfitrionId =
      currentUser.rol === 'ADMINISTRADOR' && dto.anfitrionId
        ? dto.anfitrionId
        : currentUser.id;

    const host = await this.prisma.usuario.findUnique({ where: { id: anfitrionId } });
    if (!host) {
      throw new BadRequestException(`El anfitrión especificado (${anfitrionId}) no existe.`);
    }

    const evento = await this.prisma.evento.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion ? dto.descripcion.trim() : null,
        anfitrionId,
        inicio: inicioDate,
        fin: finDate,
        aforo: Number(dto.aforo),
        requiereAprobacion: dto.requiereAprobacion !== undefined ? Boolean(dto.requiereAprobacion) : true,
        estado: dto.estado || 'ACTIVO',
        codigoActivo: true,
        nonceCodigo: crypto.randomUUID(),
      },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          include: {
            invitado: true,
            visita: true,
          },
        },
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'CREAR_EVENTO',
      entidad: 'Evento',
      entidadId: evento.id,
      detalles: {
        nombre: evento.nombre,
        anfitrionId,
        inicio: inicioDate.toISOString(),
        fin: finDate.toISOString(),
        aforo: evento.aforo,
        requiereAprobacion: evento.requiereAprobacion,
      },
    });

    return this.enrichEvento(evento);
  }

  async findAll(currentUser: { id: string; rol: string }) {
    await this.sincronizarEventosVencidos();

    const where =
      currentUser.rol === 'ADMINISTRADOR'
        ? {}
        : { anfitrionId: currentUser.id };

    const list = await this.prisma.evento.findMany({
      where,
      orderBy: { inicio: 'desc' },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: {
            invitado: true,
            visita: true,
          },
        },
      },
    });

    return list.map((ev) => this.enrichEvento(ev));
  }

  async findOne(id: string, currentUser: { id: string; rol: string }) {
    await this.sincronizarEventosVencidos();

    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: {
            invitado: true,
            visita: true,
          },
        },
      },
    });

    if (!evento) {
      throw new NotFoundException(`Evento con ID '${id}' no encontrado.`);
    }

    this.assertOwnershipOrAdmin(evento, currentUser);
    return this.enrichEvento(evento);
  }

  async update(id: string, dto: UpdateEventoDto, currentUser: { id: string; rol: string }) {
    const existing = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        invitados: {
          where: { estado: 'APROBADO' },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Evento con ID '${id}' no encontrado.`);
    }

    this.assertOwnershipOrAdmin(existing, currentUser);

    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion ? dto.descripcion.trim() : null;

    const newInicio = dto.inicio ? new Date(dto.inicio) : new Date(existing.inicio);
    const newFin = dto.fin ? new Date(dto.fin) : new Date(existing.fin);

    if (newFin.getTime() <= newInicio.getTime()) {
      throw new BadRequestException('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.');
    }
    if (dto.inicio !== undefined) data.inicio = newInicio;
    if (dto.fin !== undefined) data.fin = newFin;

    if (dto.aforo !== undefined) {
      const aprobadosActuales = existing.invitados.length;
      if (dto.aforo < aprobadosActuales) {
        throw new BadRequestException(
          `No puede reducir el aforo a ${dto.aforo} porque ya existen ${aprobadosActuales} invitados aprobados.`,
        );
      }
      data.aforo = Number(dto.aforo);
    }

    if (dto.requiereAprobacion !== undefined) {
      data.requiereAprobacion = Boolean(dto.requiereAprobacion);
    }
    if (dto.estado !== undefined) {
      data.estado = dto.estado;
    }
    if (dto.codigoActivo !== undefined) {
      data.codigoActivo = Boolean(dto.codigoActivo);
    }

    const updated = await this.prisma.evento.update({
      where: { id },
      data,
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: {
            invitado: true,
            visita: true,
          },
        },
      },
    });

    // Si cambió la fecha de fin, actualizar también la vigencia de las Visitas activas del evento
    if (dto.fin !== undefined) {
      const visitaIds = updated.invitados
        .filter((i) => i.estado === 'APROBADO' && i.visitaId)
        .map((i) => i.visitaId as string);
      if (visitaIds.length > 0) {
        await this.prisma.visita.updateMany({
          where: { id: { in: visitaIds }, estado: 'AUTORIZADA' },
          data: { fechaExpiracion: newFin },
        });
      }
    }

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'EDITAR_EVENTO',
      entidad: 'Evento',
      entidadId: id,
      detalles: { cambios: Object.keys(data), nombre: updated.nombre },
    });

    return this.enrichEvento(updated);
  }

  async cambiarEstadoEvento(
    id: string,
    nuevoEstado: 'CERRADO' | 'CANCELADO' | 'ACTIVO',
    currentUser: { id: string; rol: string },
  ) {
    const existing = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        invitados: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Evento con ID '${id}' no encontrado.`);
    }

    this.assertOwnershipOrAdmin(existing, currentUser);

    const updated = await this.prisma.evento.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        codigoActivo: nuevoEstado === 'ACTIVO' ? existing.codigoActivo : false,
      },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: {
            invitado: true,
            visita: true,
          },
        },
      },
    });

    if (nuevoEstado === 'CERRADO' || nuevoEstado === 'CANCELADO') {
      const visitaIds = existing.invitados
        .map((i) => i.visitaId)
        .filter((vId): vId is string => Boolean(vId));

      if (visitaIds.length > 0) {
        await this.prisma.visita.updateMany({
          where: {
            id: { in: visitaIds },
            estado: { in: ['PENDIENTE', 'AUTORIZADA'] },
          },
          data: {
            estado: nuevoEstado === 'CANCELADO' ? 'CANCELADA' : 'FINALIZADA',
            fechaExpiracion: new Date(),
          },
        });
      }
    }

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: nuevoEstado === 'CANCELADO' ? 'CANCELAR_EVENTO' : nuevoEstado === 'CERRADO' ? 'CERRAR_EVENTO' : 'ACTIVAR_EVENTO',
      entidad: 'Evento',
      entidadId: id,
      detalles: { nombre: existing.nombre, estadoAnterior: existing.estado, estadoNuevo: nuevoEstado },
    });

    return this.enrichEvento(updated);
  }

  async toggleCodigo(id: string, codigoActivo: boolean, currentUser: { id: string; rol: string }) {
    const existing = await this.prisma.evento.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evento con ID '${id}' no encontrado.`);
    }
    this.assertOwnershipOrAdmin(existing, currentUser);

    const updated = await this.prisma.evento.update({
      where: { id },
      data: { codigoActivo: Boolean(codigoActivo) },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: { invitado: true, visita: true },
        },
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: codigoActivo ? 'ACTIVAR_CODIGO_EVENTO' : 'DESACTIVAR_CODIGO_EVENTO',
      entidad: 'Evento',
      entidadId: id,
      detalles: { nombre: existing.nombre, codigoActivo: Boolean(codigoActivo) },
    });

    return this.enrichEvento(updated);
  }

  async regenerarCodigo(id: string, currentUser: { id: string; rol: string }) {
    const existing = await this.prisma.evento.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evento con ID '${id}' no encontrado.`);
    }
    this.assertOwnershipOrAdmin(existing, currentUser);

    const nuevoNonce = crypto.randomUUID();
    const updated = await this.prisma.evento.update({
      where: { id },
      data: {
        nonceCodigo: nuevoNonce,
        codigoActivo: true,
      },
      include: {
        anfitrion: {
          select: { id: true, cedula: true, nombre: true, apellido: true, email: true },
        },
        invitados: {
          orderBy: { createdAt: 'desc' },
          include: { invitado: true, visita: true },
        },
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'REGENERAR_CODIGO_EVENTO',
      entidad: 'Evento',
      entidadId: id,
      detalles: { nombre: existing.nombre },
    });

    return this.enrichEvento(updated);
  }

  /**
   * Valida criptográficamente el token CAI-EVT y comprueba el estado del evento en BD.
   */
  private async resolveValidEventFromJoinToken(rawToken: string) {
    await this.sincronizarEventosVencidos();

    const verification = verifyEventJoinToken(rawToken);
    if (!verification.isValidSignature || !verification.payload) {
      throw new ForbiddenException(`⛔ ${verification.error || 'Código de evento inválido.'}`);
    }
    if (verification.isExpired) {
      throw new ForbiddenException('⛔ El enlace de invitación a este evento ha expirado.');
    }

    const evento = await this.prisma.evento.findUnique({
      where: { id: verification.payload.eventoId },
      include: {
        anfitrion: {
          select: { id: true, nombre: true, apellido: true },
        },
        invitados: true,
      },
    });

    if (!evento) {
      throw new NotFoundException('El evento asociado a este código no existe.');
    }

    if (evento.nonceCodigo !== verification.payload.nonce) {
      throw new ForbiddenException(
        '⛔ Este enlace de invitación fue revocado o regenerado por el organizador.',
      );
    }

    if (!evento.codigoActivo) {
      throw new ForbiddenException(
        '⛔ El registro por enlace para este evento se encuentra desactivado por el anfitrión.',
      );
    }

    if (evento.estado !== 'ACTIVO') {
      throw new ForbiddenException(
        `⛔ El evento no admite registros porque se encuentra en estado ${evento.estado.toLowerCase()}.`,
      );
    }

    if (new Date(evento.fin).getTime() < Date.now()) {
      throw new ForbiddenException('⛔ El horario de vigencia del evento ya finalizó.');
    }

    return evento;
  }

  /**
   * Información pública mínima del evento para mostrar en la pantalla pública de unión (/unirse).
   * No expone lista de invitados ni datos privados.
   */
  async obtenerInfoPublicaPorToken(rawToken: string) {
    const evento = await this.resolveValidEventFromJoinToken(rawToken);
    const ocupados = evento.invitados.filter(
      (i) => i.estado === 'APROBADO' || i.estado === 'PENDIENTE',
    ).length;

    return {
      eventoId: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      inicio: evento.inicio,
      fin: evento.fin,
      aforo: evento.aforo,
      cuposDisponibles: Math.max(evento.aforo - ocupados, 0),
      lleno: ocupados >= evento.aforo,
      requiereAprobacion: evento.requiereAprobacion,
      anfitrion: evento.anfitrion
        ? `${evento.anfitrion.nombre} ${evento.anfitrion.apellido}`
        : 'Organizador',
    };
  }

  /**
   * POST /api/v1/eventos/unirse (@Public)
   * Registra la solicitud de un visitante mediante el enlace/QR compartido del evento.
   * No revela en la respuesta datos privados previos si la cédula ya existía en BD.
   */
  async unirsePublico(dto: UnirseEventoDto, clientIp?: string) {
    const evento = await this.resolveValidEventFromJoinToken(dto.token);
    const cleanCedula = dto.cedula.trim().toUpperCase();

    // Buscar si el visitante ya existe en la tabla Invitado
    const existingGuest = await this.prisma.invitado.findUnique({
      where: { cedula: cleanCedula },
    });

    // Regla crítica: Un invitado con bloqueado=true no puede unirse ni entrar nunca
    if (existingGuest && existingGuest.bloqueado) {
      await this.auditoriaService.registrar({
        accion: 'UNION_EVENTO_DENEGADA_BLOQUEADO',
        entidad: 'Evento',
        entidadId: evento.id,
        ip: clientIp,
        detalles: {
          invitadoId: existingGuest.id,
          cedula: cleanCedula,
          eventoNombre: evento.nombre,
        },
      });
      throw new ForbiddenException(
        '⛔ Su identificación presenta una restricción de seguridad vigente y no puede inscribirse en el evento.',
      );
    }

    // Verificar si ya estaba inscrito en este evento
    const existingRel = existingGuest
      ? evento.invitados.find((i) => i.invitadoId === existingGuest.id)
      : undefined;

    if (existingRel) {
      if (existingRel.estado === 'RECHAZADO' || existingRel.estado === 'REVOCADO') {
        throw new ForbiddenException(
          '⛔ Su solicitud para este evento fue rechazada o revocada por el anfitrión.',
        );
      }
      if (existingRel.estado === 'APROBADO' || existingRel.estado === 'PENDIENTE') {
        return {
          ok: true,
          eventoNombre: evento.nombre,
          estado: existingRel.estado,
          mensaje:
            existingRel.estado === 'APROBADO'
              ? 'Su registro ya se encuentra APROBADO para este evento. Puede presentar su cédula en garita durante el horario del evento.'
              : 'Su solicitud ya fue recibida y se encuentra PENDIENTE de aprobación por el anfitrión.',
        };
      }
    }

    // Verificar cupo duro (aforo)
    const ocupados = evento.invitados.filter(
      (i) => i.estado === 'APROBADO' || i.estado === 'PENDIENTE',
    ).length;

    if (ocupados >= evento.aforo) {
      await this.auditoriaService.registrar({
        accion: 'UNION_EVENTO_RECHAZADA_AFORO_LLENO',
        entidad: 'Evento',
        entidadId: evento.id,
        ip: clientIp,
        detalles: { cedula: cleanCedula, aforo: evento.aforo, ocupados },
      });
      throw new BadRequestException(
        `⛔ Cupo agotado: el evento "${evento.nombre}" ha alcanzado su aforo máximo de ${evento.aforo} personas.`,
      );
    }

    // Crear o mantener el Invitado sin exponer datos previos en la respuesta
    const guest = existingGuest
      ? await this.prisma.invitado.update({
          where: { id: existingGuest.id },
          data: {
            eliminado: false,
            ...(dto.placa ? { placa: dto.placa.trim().toUpperCase() } : {}),
            ...(dto.telefono ? { telefono: dto.telefono.trim() } : {}),
          },
        })
      : await this.prisma.invitado.create({
          data: {
            cedula: cleanCedula,
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            telefono: dto.telefono ? dto.telefono.trim() : null,
            empresa: dto.empresa ? dto.empresa.trim() : null,
            placa: dto.placa ? dto.placa.trim().toUpperCase() : null,
            motivo: `Evento: ${evento.nombre}`,
            empleadoId: evento.anfitrionId,
            eliminado: false,
          },
        });

    const estadoInicial = evento.requiereAprobacion ? 'PENDIENTE' : 'APROBADO';
    let visitaCreated: any = null;

    if (estadoInicial === 'APROBADO') {
      visitaCreated = await this.prisma.visita.create({
        data: {
          invitadoId: guest.id,
          empleadoId: evento.anfitrionId,
          fecha: new Date(evento.inicio),
          fechaExpiracion: new Date(evento.fin),
          motivo: `Evento: ${evento.nombre}`,
          placa: dto.placa ? dto.placa.trim().toUpperCase() : guest.placa,
          estado: 'AUTORIZADA',
        },
      });
    }

    const rel = await this.prisma.eventoInvitado.create({
      data: {
        eventoId: evento.id,
        invitadoId: guest.id,
        estado: estadoInicial,
        origen: 'ENLACE',
        visitaId: visitaCreated ? visitaCreated.id : null,
      },
    });

    await this.auditoriaService.registrar({
      accion: 'UNION_PUBLICA_EVENTO',
      entidad: 'Evento',
      entidadId: evento.id,
      ip: clientIp,
      detalles: {
        eventoInvitadoId: rel.id,
        invitadoId: guest.id,
        cedula: cleanCedula,
        estado: estadoInicial,
        origen: 'ENLACE',
      },
    });

    return {
      ok: true,
      eventoNombre: evento.nombre,
      estado: estadoInicial,
      mensaje:
        estadoInicial === 'APROBADO'
          ? '¡Inscripción aprobada! Ya cuenta con visita autorizada para el evento y puede anunciarse con su cédula en garita.'
          : 'Solicitud enviada correctamente. Su acceso quedará habilitado en garita una vez que el anfitrión apruebe su inscripción.',
    };
  }

  /**
   * Agregar invitado directamente por el anfitrión o administrador (`origen: ANFITRION`, `estado: APROBADO`).
   */
  async agregarInvitadoAnfitrion(
    eventoId: string,
    dto: GaritaAltaEventoDto,
    currentUser: { id: string; rol: string },
  ) {
    await this.sincronizarEventosVencidos();

    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: { invitados: true },
    });

    if (!evento) {
      throw new NotFoundException(`Evento con ID '${eventoId}' no encontrado.`);
    }
    this.assertOwnershipOrAdmin(evento, currentUser);

    if (evento.estado === 'CERRADO' || evento.estado === 'CANCELADO') {
      throw new BadRequestException(`No se pueden agregar invitados a un evento ${evento.estado.toLowerCase()}.`);
    }

    const cleanCedula = dto.cedula.trim().toUpperCase();
    const existingGuest = await this.prisma.invitado.findUnique({
      where: { cedula: cleanCedula },
    });

    if (existingGuest && existingGuest.bloqueado) {
      throw new ForbiddenException(
        `⛔ El visitante con cédula ${cleanCedula} se encuentra BLOQUEADO por seguridad y no puede ser agregado al evento.`,
      );
    }

    const aprobadosCount = evento.invitados.filter((i) => i.estado === 'APROBADO').length;
    if (aprobadosCount >= evento.aforo) {
      throw new BadRequestException(
        `⛔ Cupo agotado: el evento ya alcanzó su aforo máximo de ${evento.aforo} invitados aprobados.`,
      );
    }

    const guest = existingGuest
      ? await this.prisma.invitado.update({
          where: { id: existingGuest.id },
          data: {
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            telefono: dto.telefono ? dto.telefono.trim() : existingGuest.telefono,
            empresa: dto.empresa ? dto.empresa.trim() : existingGuest.empresa,
            placa: dto.placa ? dto.placa.trim().toUpperCase() : existingGuest.placa,
            eliminado: false,
          },
        })
      : await this.prisma.invitado.create({
          data: {
            cedula: cleanCedula,
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            telefono: dto.telefono ? dto.telefono.trim() : null,
            empresa: dto.empresa ? dto.empresa.trim() : null,
            placa: dto.placa ? dto.placa.trim().toUpperCase() : null,
            motivo: `Evento: ${evento.nombre}`,
            empleadoId: evento.anfitrionId,
            eliminado: false,
          },
        });

    const visita = await this.prisma.visita.create({
      data: {
        invitadoId: guest.id,
        empleadoId: evento.anfitrionId,
        fecha: new Date(evento.inicio),
        fechaExpiracion: new Date(evento.fin),
        motivo: `Evento: ${evento.nombre}`,
        placa: guest.placa,
        estado: 'AUTORIZADA',
      },
    });

    const existingRel = evento.invitados.find((i) => i.invitadoId === guest.id);
    const rel = existingRel
      ? await this.prisma.eventoInvitado.update({
          where: { id: existingRel.id },
          data: {
            estado: 'APROBADO',
            origen: 'ANFITRION',
            visitaId: visita.id,
          },
          include: { invitado: true, visita: true },
        })
      : await this.prisma.eventoInvitado.create({
          data: {
            eventoId: evento.id,
            invitadoId: guest.id,
            estado: 'APROBADO',
            origen: 'ANFITRION',
            visitaId: visita.id,
          },
          include: { invitado: true, visita: true },
        });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'AGREGAR_INVITADO_EVENTO_ANFITRION',
      entidad: 'Evento',
      entidadId: evento.id,
      detalles: {
        eventoInvitadoId: rel.id,
        invitadoId: guest.id,
        cedula: guest.cedula,
        visitaId: visita.id,
      },
    });

    return {
      ...rel,
      paseQr: this.buildPassForVisita(guest, visita),
    };
  }

  /**
   * Aprobar invitado pendiente (`PENDIENTE` -> `APROBADO`) creando su `Visita` (`AUTORIZADA`)
   * con `fechaExpiracion = evento.fin`.
   */
  async aprobarInvitado(
    eventoId: string,
    eventoInvitadoId: string,
    currentUser: { id: string; rol: string },
  ) {
    await this.sincronizarEventosVencidos();

    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: { invitados: true },
    });

    if (!evento) {
      throw new NotFoundException(`Evento con ID '${eventoId}' no encontrado.`);
    }
    this.assertOwnershipOrAdmin(evento, currentUser);

    if (evento.estado !== 'ACTIVO' && evento.estado !== 'BORRADOR') {
      throw new BadRequestException(`No se pueden aprobar invitados en un evento ${evento.estado.toLowerCase()}.`);
    }

    const rel = await this.prisma.eventoInvitado.findUnique({
      where: { id: eventoInvitadoId },
      include: { invitado: true, visita: true },
    });

    if (!rel || rel.eventoId !== eventoId) {
      throw new NotFoundException('Registro de invitado en el evento no encontrado.');
    }

    if (rel.invitado.bloqueado) {
      throw new ForbiddenException(
        `⛔ El visitante ${rel.invitado.nombre} ${rel.invitado.apellido} se encuentra BLOQUEADO por seguridad y no puede ser aprobado.`,
      );
    }

    if (rel.estado !== 'APROBADO') {
      const aprobadosCount = evento.invitados.filter((i) => i.estado === 'APROBADO').length;
      if (aprobadosCount >= evento.aforo) {
        throw new BadRequestException(
          `⛔ Cupo agotado: el evento ya alcanzó su aforo máximo de ${evento.aforo} invitados aprobados.`,
        );
      }
    }

    const visita = await this.prisma.visita.create({
      data: {
        invitadoId: rel.invitadoId,
        empleadoId: evento.anfitrionId,
        fecha: new Date(evento.inicio),
        fechaExpiracion: new Date(evento.fin),
        motivo: `Evento: ${evento.nombre}`,
        placa: rel.invitado.placa,
        estado: 'AUTORIZADA',
      },
    });

    const updatedRel = await this.prisma.eventoInvitado.update({
      where: { id: eventoInvitadoId },
      data: {
        estado: 'APROBADO',
        visitaId: visita.id,
      },
      include: { invitado: true, visita: true },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: 'APROBAR_INVITADO_EVENTO',
      entidad: 'Evento',
      entidadId: eventoId,
      detalles: {
        eventoInvitadoId,
        invitadoId: rel.invitadoId,
        cedula: rel.invitado.cedula,
        visitaId: visita.id,
        origen: rel.origen,
      },
    });

    return {
      ...updatedRel,
      paseQr: this.buildPassForVisita(updatedRel.invitado, visita),
    };
  }

  /**
   * Rechazar o revocar invitado en un evento (`RECHAZADO` o `REVOCADO`),
   * cancelando la `Visita` asociada si existía.
   */
  async cambiarEstadoInvitadoEvento(
    eventoId: string,
    eventoInvitadoId: string,
    nuevoEstado: 'RECHAZADO' | 'REVOCADO',
    currentUser: { id: string; rol: string },
  ) {
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException(`Evento con ID '${eventoId}' no encontrado.`);
    }
    this.assertOwnershipOrAdmin(evento, currentUser);

    const rel = await this.prisma.eventoInvitado.findUnique({
      where: { id: eventoInvitadoId },
      include: { invitado: true },
    });

    if (!rel || rel.eventoId !== eventoId) {
      throw new NotFoundException('Registro de invitado en el evento no encontrado.');
    }

    if (rel.visitaId) {
      await this.prisma.visita.update({
        where: { id: rel.visitaId },
        data: { estado: 'CANCELADA' },
      });
    }

    const updated = await this.prisma.eventoInvitado.update({
      where: { id: eventoInvitadoId },
      data: { estado: nuevoEstado },
      include: { invitado: true, visita: true },
    });

    await this.auditoriaService.registrar({
      usuarioId: currentUser.id,
      accion: nuevoEstado === 'REVOCADO' ? 'REVOCAR_INVITADO_EVENTO' : 'RECHAZAR_INVITADO_EVENTO',
      entidad: 'Evento',
      entidadId: eventoId,
      detalles: {
        eventoInvitadoId,
        invitadoId: rel.invitadoId,
        cedula: rel.invitado.cedula,
        estadoNuevo: nuevoEstado,
      },
    });

    return updated;
  }

  /**
   * Garita (`SEGURIDAD` y `ADMINISTRADOR`):
   * Devuelve los eventos activos del día de hoy y la lista de invitados `APROBADO`
   * (más pendientes registrados en garita para visibilidad de estado) con filtro por cédula/nombre.
   */
  async obtenerEventosGaritaHoy(search?: string) {
    await this.sincronizarEventosVencidos();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const eventosHoy = await this.prisma.evento.findMany({
      where: {
        estado: 'ACTIVO',
        inicio: { lte: endOfDay },
        fin: { gte: now },
      },
      orderBy: { inicio: 'asc' },
      include: {
        anfitrion: {
          select: { id: true, nombre: true, apellido: true, departamento: true },
        },
        invitados: {
          where: {
            estado: { in: ['APROBADO', 'PENDIENTE'] },
          },
          include: {
            invitado: {
              include: {
                historial: {
                  orderBy: { timestamp: 'desc' },
                  take: 1,
                },
              },
            },
            visita: true,
          },
        },
      },
    });

    const term = (search || '').trim().toLowerCase();

    return eventosHoy.map((ev) => {
      const aprobados = ev.invitados
        .filter((item) => item.estado === 'APROBADO' && !item.invitado.bloqueado && !item.invitado.eliminado)
        .filter((item) => {
          if (!term) return true;
          const fullName = `${item.invitado.nombre} ${item.invitado.apellido}`.toLowerCase();
          return (
            item.invitado.cedula.toLowerCase().includes(term) ||
            fullName.includes(term) ||
            (item.invitado.placa || '').toLowerCase().includes(term)
          );
        })
        .map((item) => {
          const lastMove = item.invitado.historial?.[0] || null;
          return {
            eventoInvitadoId: item.id,
            invitadoId: item.invitado.id,
            visitaId: item.visitaId,
            cedula: item.invitado.cedula,
            nombre: item.invitado.nombre,
            apellido: item.invitado.apellido,
            empresa: item.invitado.empresa,
            placa: item.visita?.placa || item.invitado.placa,
            estaDentro: lastMove?.tipo === 'ENTRADA',
            ultimoMovimiento: lastMove,
          };
        });

      const pendientesGarita = ev.invitados
        .filter((item) => item.estado === 'PENDIENTE' && item.origen === 'GARITA')
        .map((item) => ({
          eventoInvitadoId: item.id,
          invitadoId: item.invitado.id,
          cedula: item.invitado.cedula,
          nombre: item.invitado.nombre,
          apellido: item.invitado.apellido,
          estado: item.estado,
          origen: item.origen,
        }));

      const totalOcupados = ev.invitados.filter(
        (i) => i.estado === 'APROBADO' || i.estado === 'PENDIENTE',
      ).length;

      return {
        id: ev.id,
        nombre: ev.nombre,
        descripcion: ev.descripcion,
        inicio: ev.inicio,
        fin: ev.fin,
        aforo: ev.aforo,
        cuposDisponibles: Math.max(ev.aforo - totalOcupados, 0),
        anfitrion: ev.anfitrion
          ? `${ev.anfitrion.nombre} ${ev.anfitrion.apellido}`
          : 'Anfitrión',
        invitadosAprobados: aprobados,
        solicitudesGaritaPendientes: pendientesGarita,
      };
    });
  }

  /**
   * Alta rápida en puerta por Garita (`SEGURIDAD` / `ADMINISTRADOR`):
   * Registra al visitante con `origen: GARITA` y `estado: PENDIENTE` para que el anfitrión lo ratifique,
   * auditando la acción con el `usuarioId` del operador de garita.
   */
  async altaEnGarita(
    eventoId: string,
    dto: GaritaAltaEventoDto,
    operadorUser: { id: string; rol: string },
  ) {
    await this.sincronizarEventosVencidos();

    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: { invitados: true },
    });

    if (!evento) {
      throw new NotFoundException(`Evento con ID '${eventoId}' no encontrado.`);
    }

    if (evento.estado !== 'ACTIVO' || new Date(evento.fin).getTime() < Date.now()) {
      throw new BadRequestException('El evento no se encuentra activo o ya finalizó.');
    }

    const cleanCedula = dto.cedula.trim().toUpperCase();
    const existingGuest = await this.prisma.invitado.findUnique({
      where: { cedula: cleanCedula },
    });

    if (existingGuest && existingGuest.bloqueado) {
      await this.auditoriaService.registrar({
        usuarioId: operadorUser.id,
        accion: 'ALTA_GARITA_EVENTO_DENEGADA_BLOQUEADO',
        entidad: 'Evento',
        entidadId: evento.id,
        detalles: { cedula: cleanCedula, invitadoId: existingGuest.id },
      });
      throw new ForbiddenException(
        `⛔ Acceso BLOQUEADO: el visitante con cédula ${cleanCedula} tiene una restricción de seguridad vigente.`,
      );
    }

    const ocupados = evento.invitados.filter(
      (i) => i.estado === 'APROBADO' || i.estado === 'PENDIENTE',
    ).length;

    if (ocupados >= evento.aforo) {
      throw new BadRequestException(
        `⛔ Cupo agotado: el evento "${evento.nombre}" alcanzó su aforo máximo (${evento.aforo}).`,
      );
    }

    const guest = existingGuest
      ? await this.prisma.invitado.update({
          where: { id: existingGuest.id },
          data: {
            eliminado: false,
            ...(dto.placa ? { placa: dto.placa.trim().toUpperCase() } : {}),
            ...(dto.telefono ? { telefono: dto.telefono.trim() } : {}),
          },
        })
      : await this.prisma.invitado.create({
          data: {
            cedula: cleanCedula,
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            telefono: dto.telefono ? dto.telefono.trim() : null,
            empresa: dto.empresa ? dto.empresa.trim() : null,
            placa: dto.placa ? dto.placa.trim().toUpperCase() : null,
            motivo: `Alta en garita para evento: ${evento.nombre}`,
            empleadoId: evento.anfitrionId,
            eliminado: false,
          },
        });

    const existingRel = evento.invitados.find((i) => i.invitadoId === guest.id);
    if (existingRel && existingRel.estado === 'APROBADO') {
      return {
        ...existingRel,
        invitado: guest,
        mensaje: 'El visitante ya se encontraba APROBADO en el evento.',
      };
    }

    const rel = existingRel
      ? await this.prisma.eventoInvitado.update({
          where: { id: existingRel.id },
          data: {
            estado: 'PENDIENTE',
            origen: 'GARITA',
          },
          include: { invitado: true },
        })
      : await this.prisma.eventoInvitado.create({
          data: {
            eventoId: evento.id,
            invitadoId: guest.id,
            estado: 'PENDIENTE',
            origen: 'GARITA',
          },
          include: { invitado: true },
        });

    await this.auditoriaService.registrar({
      usuarioId: operadorUser.id,
      accion: 'ALTA_GARITA_EVENTO',
      entidad: 'Evento',
      entidadId: evento.id,
      detalles: {
        eventoInvitadoId: rel.id,
        invitadoId: guest.id,
        cedula: guest.cedula,
        origen: 'GARITA',
        estado: 'PENDIENTE',
      },
    });

    return {
      ...rel,
      mensaje:
        'Visitante anunciado en el evento con origen GARITA (estado PENDIENTE). Debe ser aprobado por el anfitrión antes de registrar su ENTRADA.',
    };
  }
}
