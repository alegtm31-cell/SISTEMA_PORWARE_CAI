import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Monitoreo y Salud')
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  @ApiOperation({
    summary: 'Comprobar liveness del proceso (sin consulta a base de datos)',
    description:
      'Endpoint ultraligero para HEALTHCHECK de contenedor Docker / liveness probe. Solo comprueba que el proceso Node.js/NestJS responde sin consultar PostgreSQL.',
  })
  @ApiResponse({ status: 200, description: 'El proceso del servidor está activo y respondiendo.' })
  checkLiveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'ok',
      service: 'porware-cai-backend',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Comprobar salud completa y disponibilidad de PostgreSQL (Readiness Check)',
    description:
      'Verifica conectividad real con PostgreSQL (SELECT 1), latencia de base de datos y consumo de memoria. Devuelve 200 si la base de datos responde o 503 si falla.',
  })
  @ApiResponse({ status: 200, description: 'Servicio y base de datos en óptimas condiciones.' })
  @ApiResponse({ status: 503, description: 'Servicio degradado o fallo de conexión a PostgreSQL.' })
  async checkHealth(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'down';
    let dbLatency = -1;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
      dbLatency = Date.now() - startTime;
    } catch {
      dbStatus = 'down';
    }

    const memory = process.memoryUsage();
    const isHealthy = dbStatus === 'up';

    const payload = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'porware-cai-backend',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatency >= 0 ? dbLatency : null,
      },
      memory: {
        rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
      },
    };

    return res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(payload);
  }
}
