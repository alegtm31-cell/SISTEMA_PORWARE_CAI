import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { HistorialService } from './historial.service';
import { FilterHistorialDto } from './dto/filter-historial.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Historial y Auditoría')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/historial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Consultar bitácora general de accesos',
    description: 'Permite filtrar el historial de entradas y salidas por rango de fechas, tipo de movimiento, tipo de persona (USUARIO/INVITADO) y término de búsqueda.',
  })
  @ApiResponse({ status: 200, description: 'Listado de accesos ordenados cronológicamente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol SEGURIDAD o ADMINISTRADOR.' })
  async findAll(@Query() filter: FilterHistorialDto) {
    return this.historialService.findAll(filter);
  }

  @Get('stats')
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Métricas de aforo y estadísticas del día',
    description: 'Calcula en tiempo real el total de entradas hoy, salidas hoy, estimación de personas actualmente dentro y los últimos movimientos.',
  })
  @ApiResponse({ status: 200, description: 'Métricas calculadas exitosamente.' })
  async getStats() {
    return this.historialService.getStats();
  }

  @Get('dentro')
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Censo en tiempo real de personas dentro de la sede (Roll Call / Evacuación)',
    description: 'Devuelve la lista real de todas las personas (empleados y visitantes) cuyo último movimiento registrado fue ENTRADA.',
  })
  @ApiResponse({ status: 200, description: 'Listado oficial de personas dentro de las instalaciones.' })
  async getPersonasDentro() {
    return this.historialService.getPersonasDentro();
  }

  @Get('persona/:idOrCedula')
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Bitácora de accesos de una persona',
    description: 'Obtiene todos los registros de entrada y salida históricos de una persona específica por su Cédula o ID.',
  })
  @ApiResponse({ status: 200, description: 'Historial individual de accesos.' })
  @ApiResponse({ status: 404, description: 'Persona no encontrada.' })
  async getPersonaHistorial(@Param('idOrCedula') idOrCedula: string) {
    return this.historialService.getPersonaHistorial(idOrCedula);
  }

  @Patch(':id/observacion')
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Editar observación de un registro de acceso',
    description: 'Permite a los operadores de garita o administradores añadir o modificar notas de auditoría en un registro de acceso.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        observacion: {
          type: 'string',
          example: 'Salida autorizada con equipo portátil serial #1234',
        },
      },
      required: ['observacion'],
    },
  })
  @ApiResponse({ status: 200, description: 'Observación actualizada.' })
  @ApiResponse({ status: 404, description: 'Registro de historial no encontrado.' })
  async updateObservacion(
    @Param('id') id: string,
    @Body('observacion') observacion: string,
  ) {
    return this.historialService.updateObservacion(id, observacion);
  }
}

