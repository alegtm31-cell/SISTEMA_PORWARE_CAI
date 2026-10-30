import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
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
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Consultar bitácora general de accesos (Solo Administrador)',
    description: 'Permite filtrar el historial de entradas y salidas por rango de fechas, tipo de movimiento, tipo de persona (USUARIO/INVITADO) y término de búsqueda.',
  })
  @ApiResponse({ status: 200, description: 'Listado de accesos ordenados cronológicamente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async findAll(@Query() filter: FilterHistorialDto) {
    return this.historialService.findAll(filter);
  }

  @Get('stats')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Métricas de aforo y estadísticas del día (Solo Administrador)',
    description: 'Calcula en tiempo real el total de entradas hoy, salidas hoy, estimación de personas actualmente dentro y los últimos movimientos.',
  })
  @ApiResponse({ status: 200, description: 'Métricas calculadas exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async getStats() {
    return this.historialService.getStats();
  }

  @Get('dentro')
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Censo en tiempo real de personas dentro de la sede (Garita / Roll Call)',
    description: 'Devuelve la lista real de todas las personas (empleados y visitantes) cuyo último movimiento registrado fue ENTRADA.',
  })
  @ApiResponse({ status: 200, description: 'Listado oficial de personas dentro de las instalaciones.' })
  async getPersonasDentro() {
    return this.historialService.getPersonasDentro();
  }

  @Get('export/csv')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Exportar historial a archivo CSV (Solo Administrador)',
    description: 'Genera y descarga un archivo CSV con el historial de accesos filtrado, codificado en UTF-8 con BOM para apertura transparente en Excel.',
  })
  @ApiResponse({ status: 200, description: 'Archivo CSV descargado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async exportCsv(@Query() filter: FilterHistorialDto, @Res() res: Response) {
    const csv = await this.historialService.exportCsv(filter);
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="historial_cai_${dateStr}.csv"`);
    return res.send(csv);
  }

  @Get('evacuacion/acta')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Acta Oficial de Evacuación y Conteo de Emergencia (Solo Administrador)',
    description: 'Genera el informe formal de personas presentes dentro de las instalaciones con sello de tiempo oficial y secciones para firmas de brigadistas.',
  })
  @ApiResponse({ status: 200, description: 'Acta de evacuación generada.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async getActaEvacuacion() {
    return this.historialService.getActaEvacuacion();
  }

  @Get('persona/:idOrCedula')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Bitácora de accesos de una persona (Solo Administrador)',
    description: 'Obtiene todos los registros de entrada y salida históricos de una persona específica por su Cédula o ID.',
  })
  @ApiResponse({ status: 200, description: 'Historial individual de accesos.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Persona no encontrada.' })
  async getPersonaHistorial(@Param('idOrCedula') idOrCedula: string) {
    return this.historialService.getPersonaHistorial(idOrCedula);
  }

  @Patch(':id/observacion')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Añadir nota de auditoría a un registro de acceso (Solo Administrador)',
    description: 'Permite a los administradores añadir notas de auditoría fechadas y firmadas por el usuario autenticado.',
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
  @ApiResponse({ status: 200, description: 'Observación agregada.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Registro de historial no encontrado.' })
  async updateObservacion(
    @Param('id') id: string,
    @Body('observacion') observacion: string,
    @Req() req: any,
  ) {
    return this.historialService.updateObservacion(id, observacion, req.user);
  }
}
