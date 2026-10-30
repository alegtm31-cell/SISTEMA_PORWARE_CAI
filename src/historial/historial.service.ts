import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { FilterHistorialDto } from './dto/filter-historial.dto';

function getStartOfTodayCaracas(): Date {
  // Caracas está en UTC-4 continuo (sin horario de verano)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(now); // "YYYY-MM-DD"
  return new Date(`${dateStr}T00:00:00.000-04:00`);
}

@Injectable()
export class HistorialService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditoriaService?: AuditoriaService,
  ) {}

  async findAll(filter: FilterHistorialDto) {
    const { tipo, targetType, startDate, endDate, search, skip, take } = filter;
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
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { observacion: { contains: term, mode: 'insensitive' } },
        { usuario: { cedula: { contains: term, mode: 'insensitive' } } },
        { usuario: { nombre: { contains: term, mode: 'insensitive' } } },
        { usuario: { apellido: { contains: term, mode: 'insensitive' } } },
        { invitado: { cedula: { contains: term, mode: 'insensitive' } } },
        { invitado: { nombre: { contains: term, mode: 'insensitive' } } },
        { invitado: { apellido: { contains: term, mode: 'insensitive' } } },
        { invitado: { empresa: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const sanitizedTake = Math.min(Math.max(Number(take) || 50, 1), 100);
    const sanitizedSkip = Math.max(Number(skip) || 0, 0);

    const [total, data] = await Promise.all([
      this.prisma.historial.count({ where }),
      this.prisma.historial.findMany({
        where,
        skip: sanitizedSkip,
        take: sanitizedTake,
        orderBy: { timestamp: 'desc' },
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
    const startOfToday = getStartOfTodayCaracas();

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
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: {
          registradoPor: {
            select: {
              nombre: true,
              apellido: true,
              rol: true,
            },
          },
          usuario: { select: { nombre: true, apellido: true, cedula: true } },
          invitado: { select: { nombre: true, apellido: true, cedula: true } },
        },
      }),
    ]);

    const personasDentro = await this.getPersonasDentro();
    const dentroReal = personasDentro.length;

    return {
      fecha: new Date().toISOString(),
      entradasHoy,
      salidasHoy,
      totalHoy,
      dentroEstimado: dentroReal,
      personasDentroAproximado: dentroReal,
      ultimosMovimientos,
    };
  }

  async getPersonasDentro() {
    const insideUsers: any[] = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (h."usuarioId")
        h.id as "historialId",
        h.tipo,
        h.timestamp as "horaIngreso",
        u.id,
        u.nombre,
        u.apellido,
        u.cedula,
        u.rol,
        'PERSONAL' as "categoria",
        'Personal Interno' as "empresa"
      FROM "Historial" h
      JOIN "Usuario" u ON h."usuarioId" = u.id
      WHERE h."usuarioId" IS NOT NULL
      ORDER BY h."usuarioId", h.timestamp DESC;
    `;

    const insideGuests: any[] = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (h."invitadoId")
        h.id as "historialId",
        h.tipo,
        h.timestamp as "horaIngreso",
        g.id,
        g.nombre,
        g.apellido,
        g.cedula,
        'VISITANTE' as rol,
        'VISITANTE' as "categoria",
        COALESCE(g.empresa, 'Particular') as "empresa"
      FROM "Historial" h
      JOIN "Invitado" g ON h."invitadoId" = g.id
      WHERE h."invitadoId" IS NOT NULL
      ORDER BY h."invitadoId", h.timestamp DESC;
    `;

    const active = [
      ...insideUsers.filter((r) => r.tipo === 'ENTRADA'),
      ...insideGuests.filter((r) => r.tipo === 'ENTRADA'),
    ];

    return active.map((item) => ({
      id: item.id,
      nombre: `${item.nombre} ${item.apellido}`,
      cedula: item.cedula,
      tipo: item.rol === 'ADMINISTRADOR' ? 'PERSONAL (ADMIN)' : item.rol === 'SEGURIDAD' ? 'PERSONAL (SEGURIDAD)' : item.categoria,
      empresa: item.empresa,
      horaIngreso: item.horaIngreso,
    }));
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
        include: {
          empleado: { select: { nombre: true, apellido: true } },
        },
      }),
    ]);

    if (!user && !guest) {
      throw new NotFoundException(`No se encontró registro para la persona con identificación '${clean}'`);
    }

    const where: any = {};
    if (user) where.usuarioId = user.id;
    if (guest) where.invitadoId = guest.id;

    const historial = await this.prisma.historial.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        registradoPor: {
          select: {
            nombre: true,
            apellido: true,
            rol: true,
          },
        },
      },
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

  // Observaciones de solo adición con trazabilidad de autor y hora (Hallazgo 8 + Producción 7)
  async updateObservacion(id: string, observacion: string, user?: any) {
    const record = await this.prisma.historial.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Registro de historial con ID '${id}' no encontrado`);
    }

    const timeStr = new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date());

    const autor = user ? `${user.nombre} ${user.apellido} (${user.rol})` : 'Operador';
    const nuevaEntrada = `[${timeStr} - ${autor}]: ${observacion.trim()}`;
    const observacionFinal = record.observacion ? `${record.observacion}\n${nuevaEntrada}` : nuevaEntrada;

    const updated = await this.prisma.historial.update({
      where: { id },
      data: { observacion: observacionFinal },
    });

    if (this.auditoriaService) {
      await this.auditoriaService.registrar({
        usuarioId: user?.id,
        accion: 'NOTA_BITACORA',
        entidad: 'Historial',
        entidadId: id,
        detalles: { nota: observacion.trim(), autor },
      });
    }

    return updated;
  }

  /**
   * Exporta la bitácora de accesos a formato CSV estándar con soporte UTF-8 para Excel
   */
  async exportCsv(filter: FilterHistorialDto): Promise<string> {
    const { tipo, targetType, startDate, endDate, search } = filter;
    const where: any = {};

    if (tipo) where.tipo = tipo;
    if (targetType === 'USUARIO') where.usuarioId = { not: null };
    else if (targetType === 'INVITADO') where.invitadoId = { not: null };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { observacion: { contains: term, mode: 'insensitive' } },
        { usuario: { cedula: { contains: term, mode: 'insensitive' } } },
        { usuario: { nombre: { contains: term, mode: 'insensitive' } } },
        { usuario: { apellido: { contains: term, mode: 'insensitive' } } },
        { invitado: { cedula: { contains: term, mode: 'insensitive' } } },
        { invitado: { nombre: { contains: term, mode: 'insensitive' } } },
        { invitado: { apellido: { contains: term, mode: 'insensitive' } } },
        { invitado: { empresa: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const records = await this.prisma.historial.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
      include: {
        usuario: { select: { cedula: true, nombre: true, apellido: true, rol: true, departamento: true } },
        invitado: { select: { cedula: true, nombre: true, apellido: true, empresa: true, placa: true } },
        registradoPor: { select: { nombre: true, apellido: true, rol: true } },
      },
    });

    const header = ['ID', 'Fecha', 'Hora', 'Tipo', 'Persona', 'Cédula', 'Categoría', 'Empresa / Dpto', 'Vehículo / Placa', 'Operador de Garita', 'Observaciones'];
    const rows = records.map((r) => {
      const d = new Date(r.timestamp);
      const fecha = d.toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });
      const hora = d.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' });
      const persona = r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : r.invitado ? `${r.invitado.nombre} ${r.invitado.apellido}` : 'Desconocido';
      const cedula = r.usuario ? r.usuario.cedula : r.invitado ? r.invitado.cedula : '-';
      const categoria = r.usuario ? `EMPLEADO (${r.usuario.rol})` : 'VISITANTE';
      const empresaDpto = r.usuario ? (r.usuario.departamento || 'Personal Interno') : (r.invitado?.empresa || 'Particular');
      const placa = r.invitado?.placa || '-';
      const operador = r.registradoPor ? `${r.registradoPor.nombre} ${r.registradoPor.apellido}` : 'Sistema / Auto';
      const obs = (r.observacion || '').replace(/[\r\n]+/g, ' | ');

      return [
        r.id,
        fecha,
        hora,
        r.tipo,
        persona,
        cedula,
        categoria,
        empresaDpto,
        placa,
        operador,
        obs,
      ].map((val) => {
        let str = String(val).replace(/"/g, '""');
        // Seguridad: Neutralizar inyección de fórmulas CSV para Excel (=, +, -, @)
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }
        return `"${str}"`;
      }).join(',');
    });

    return '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  }

  /**
   * Genera el Acta Oficial de Evacuación / Roll Call con los datos reales en tiempo real
   */
  async getActaEvacuacion() {
    const personas = await this.getPersonasDentro();
    const now = new Date();
    const fechaStr = new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', dateStyle: 'full' }).format(now);
    const horaStr = new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', timeStyle: 'medium' }).format(now);
    const codigoActa = `ACTA-EVAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const personal = personas.filter((p) => p.tipo.startsWith('PERSONAL'));
    const visitantes = personas.filter((p) => !p.tipo.startsWith('PERSONAL'));

    return {
      codigoActa,
      sede: 'Sede Principal - Control de Acceso CAI',
      fechaEmision: fechaStr,
      horaEmision: horaStr,
      timestamp: now.toISOString(),
      resumen: {
        totalPresentes: personas.length,
        totalPersonal: personal.length,
        totalVisitantes: visitantes.length,
      },
      personas,
      firmas: [
        { cargo: 'Oficial de Seguridad en Garita', nombre: '', cedula: '' },
        { cargo: 'Coordinador de Brigada de Emergencia', nombre: '', cedula: '' },
        { cargo: 'Supervisor / Gerente de Planta', nombre: '', cedula: '' },
      ],
    };
  }
}

