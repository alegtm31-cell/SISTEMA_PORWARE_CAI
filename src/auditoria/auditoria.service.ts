import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistrarAuditoriaDto {
  usuarioId?: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalles?: any;
  ip?: string;
  userAgent?: string;
}

export interface FilterAuditoriaDto {
  entidad?: string;
  accion?: string;
  usuarioId?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría de forma segura (append-only).
   * Nunca lanza excepciones para no interrumpir el flujo operacional principal.
   */
  async registrar(dto: RegistrarAuditoriaDto) {
    try {
      const detallesStr =
        dto.detalles !== undefined
          ? typeof dto.detalles === 'string'
            ? dto.detalles
            : JSON.stringify(dto.detalles)
          : null;

      const registro = await this.prisma.auditoria.create({
        data: {
          usuarioId: dto.usuarioId || null,
          accion: dto.accion.toUpperCase(),
          entidad: dto.entidad,
          entidadId: dto.entidadId || null,
          detalles: detallesStr,
          ip: dto.ip || null,
          userAgent: dto.userAgent ? dto.userAgent.substring(0, 255) : null,
        },
      });

      return registro;
    } catch (err: any) {
      this.logger.error(`Error al persistir auditoría [${dto.accion} - ${dto.entidad}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Consulta la bitácora inmutable de auditoría con filtros y paginación.
   */
  async findAll(filter: FilterAuditoriaDto) {
    const where: any = {};

    if (filter.entidad) {
      where.entidad = { equals: filter.entidad, mode: 'insensitive' };
    }

    if (filter.accion) {
      where.accion = { contains: filter.accion.toUpperCase() };
    }

    if (filter.usuarioId) {
      where.usuarioId = filter.usuarioId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skipNum = Math.max(0, Number(filter.skip) || 0);
    const takeNum = Math.min(100, Math.max(1, Number(filter.take) || 25));

    const [total, registros] = await Promise.all([
      this.prisma.auditoria.count({ where }),
      this.prisma.auditoria.findMany({
        where,
        skip: skipNum,
        take: takeNum,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
    ]);

    return {
      total,
      skip: skipNum,
      take: takeNum,
      registros,
    };
  }
}
