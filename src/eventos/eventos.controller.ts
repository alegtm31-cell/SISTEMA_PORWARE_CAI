import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { UnirseEventoDto } from './dto/unirse-evento.dto';
import { GaritaAltaEventoDto } from './dto/garita-alta-evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('Eventos y Cupos')
@Controller('eventos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // =========================================================================
  // 1. ENDPOINTS PÚBLICOS DE UNIÓN POR ENLACE / QR COMPARTIDO (@Public)
  // =========================================================================

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('publico/info')
  @ApiOperation({ summary: 'Obtener información pública básica de un evento a partir de su token CAI-EVT' })
  async getPublicEventInfo(@Query('token') token: string) {
    return this.eventosService.obtenerInfoPublicaPorToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('unirse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar unirse a un evento mediante su código compartido CAI-EVT (máx 10 req/min por IP)' })
  async unirsePublico(@Body() dto: UnirseEventoDto, @Request() req: any) {
    const forwarded = req?.headers?.['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      req?.ip ||
      'unknown';
    return this.eventosService.unirsePublico(dto, clientIp);
  }

  // =========================================================================
  // 2. ENDPOINTS DE GARITA (SEGURIDAD Y ADMINISTRADOR)
  // =========================================================================

  @ApiBearerAuth()
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @Get('garita/hoy')
  @ApiOperation({ summary: 'Listar eventos activos del día e invitados APROBADOS para control en garita' })
  async getEventosGaritaHoy(@Query('search') search?: string) {
    return this.eventosService.obtenerEventosGaritaHoy(search);
  }

  @ApiBearerAuth()
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @Post('garita/:eventoId/alta')
  @ApiOperation({ summary: 'Alta rápida en puerta de un visitante para un evento activo (origen: GARITA, estado: PENDIENTE)' })
  async altaEnGarita(
    @Param('eventoId') eventoId: string,
    @Body() dto: GaritaAltaEventoDto,
    @Request() req: any,
  ) {
    return this.eventosService.altaEnGarita(eventoId, dto, req.user);
  }

  // =========================================================================
  // 3. ENDPOINTS DE GESTIÓN DE EVENTOS (EMPLEADO PROPIETARIO Y ADMINISTRADOR)
  // =========================================================================

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo evento con cupo máximo (aforo) y código compartido HMAC' })
  async create(@Body() dto: CreateEventoDto, @Request() req: any) {
    return this.eventosService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Get()
  @ApiOperation({ summary: 'Listar eventos (ADMINISTRADOR ve todos; EMPLEADO ve solo los suyos)' })
  async findAll(@Request() req: any) {
    return this.eventosService.findAll(req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un evento con su lista de invitados y estado de aforo' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.eventosService.findOne(id, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Patch(':id')
  @ApiOperation({ summary: 'Editar datos, horario o aforo de un evento' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventoDto,
    @Request() req: any,
  ) {
    return this.eventosService.update(id, dto, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/cerrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar el evento y expirar sus visitas activas' })
  async cerrar(@Param('id') id: string, @Request() req: any) {
    return this.eventosService.cambiarEstadoEvento(id, 'CERRADO', req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar el evento y anular todas las visitas asociadas' })
  async cancelar(@Param('id') id: string, @Request() req: any) {
    return this.eventosService.cambiarEstadoEvento(id, 'CANCELADO', req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Patch(':id/codigo')
  @ApiOperation({ summary: 'Activar o desactivar el enlace/código compartido del evento' })
  async toggleCodigo(
    @Param('id') id: string,
    @Body() body: { codigoActivo: boolean },
    @Request() req: any,
  ) {
    return this.eventosService.toggleCodigo(id, Boolean(body.codigoActivo), req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/regenerar-codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerar el nonce del código compartido (invalida enlaces anteriores)' })
  async regenerarCodigo(@Param('id') id: string, @Request() req: any) {
    return this.eventosService.regenerarCodigo(id, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/invitados')
  @ApiOperation({ summary: 'Agregar invitado directamente por el anfitrión (origen: ANFITRION, estado: APROBADO)' })
  async agregarInvitadoAnfitrion(
    @Param('id') id: string,
    @Body() dto: GaritaAltaEventoDto,
    @Request() req: any,
  ) {
    return this.eventosService.agregarInvitadoAnfitrion(id, dto, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/invitados/:eventoInvitadoId/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar solicitud de invitado y generar Visita AUTORIZADA hasta el fin del evento' })
  async aprobarInvitado(
    @Param('id') id: string,
    @Param('eventoInvitadoId') eventoInvitadoId: string,
    @Request() req: any,
  ) {
    return this.eventosService.aprobarInvitado(id, eventoInvitadoId, req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/invitados/:eventoInvitadoId/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar solicitud de invitado en el evento' })
  async rechazarInvitado(
    @Param('id') id: string,
    @Param('eventoInvitadoId') eventoInvitadoId: string,
    @Request() req: any,
  ) {
    return this.eventosService.cambiarEstadoInvitadoEvento(id, eventoInvitadoId, 'RECHAZADO', req.user);
  }

  @ApiBearerAuth()
  @Roles('EMPLEADO', 'ADMINISTRADOR')
  @Post(':id/invitados/:eventoInvitadoId/revocar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar invitado previamente aprobado y cancelar su Visita' })
  async revocarInvitado(
    @Param('id') id: string,
    @Param('eventoInvitadoId') eventoInvitadoId: string,
    @Request() req: any,
  ) {
    return this.eventosService.cambiarEstadoInvitadoEvento(id, eventoInvitadoId, 'REVOCADO', req.user);
  }
}
