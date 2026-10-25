import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditoriaService, FilterAuditoriaDto } from './auditoria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Historial y Auditoría')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Consultar bitácora integral de auditoría del sistema (Solo Administrador)',
    description: 'Devuelve el registro inmutable de eventos de seguridad, inicios de sesión, cambios de rol, altas, modificaciones y eliminaciones.',
  })
  @ApiQuery({ name: 'entidad', required: false, description: 'Entidad afectada (Usuario, Invitado, Visita, Noticia, Auth)' })
  @ApiQuery({ name: 'accion', required: false, description: 'Acción ejecutada (LOGIN_EXITOSO, LOGIN_FALLIDO, CREAR, ACTUALIZAR, etc.)' })
  @ApiQuery({ name: 'usuarioId', required: false, description: 'UUID del usuario autor' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Offset de paginación' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Límite de registros (máx 100)' })
  @ApiResponse({ status: 200, description: 'Listado de eventos de auditoría.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async findAll(@Query() filter: FilterAuditoriaDto) {
    return this.auditoriaService.findAll(filter);
  }
}
