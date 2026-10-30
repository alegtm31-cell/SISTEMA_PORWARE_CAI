import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { InvitadosService } from './invitados.service';
import { CreateInvitadoDto } from './dto/create-invitado.dto';
import { UpdateInvitadoDto } from './dto/update-invitado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Visitantes / Invitados')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/invitados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitadosController {
  constructor(private readonly invitadosService: InvitadosService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Registrar nuevo invitado o visita con pase QR firmado por el servidor',
    description: 'Registra un visitante y su visita autorizada con firma HMAC-SHA256. Los empleados quedan fijados obligatoriamente como anfitriones de sus propios invitados.',
  })
  @ApiResponse({ status: 201, description: 'Invitado y visita registrados satisfactoriamente.' })
  @ApiResponse({ status: 400, description: 'Empleado anfitrión no encontrado o datos incompletos.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  async create(
    @Body() createInvitadoDto: CreateInvitadoDto,
    @Req() req: any,
  ) {
    return this.invitadosService.create(createInvitadoDto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Listar todos los invitados (Solo Administrador)',
    description: 'Permite buscar visitantes por cédula, nombre o empresa, y filtrar por empleado anfitrión con paginación.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por cédula, nombre o empresa' })
  @ApiQuery({ name: 'empleadoId', required: false, description: 'Filtrar por ID del empleado anfitrión' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Registros a omitir' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Cantidad de registros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de visitantes.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async findAll(
    @Query('search') search?: string,
    @Query('empleadoId') empleadoId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.invitadosService.findAll({ search, empleadoId, skip, take });
  }

  @Get('mis-invitados')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Obtener mis invitados registrados',
    description: 'Permite a un propietario/empleado consultar únicamente los visitantes registrados bajo su autoría.',
  })
  @ApiResponse({ status: 200, description: 'Lista de invitados creados por el usuario actual.' })
  async findMyInvitations(@CurrentUser('id') currentUserId: string) {
    return this.invitadosService.findByEmpleado(currentUserId);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Obtener detalle de un invitado',
    description: 'Devuelve información del visitante y su historial de entradas y salidas con validación de pertenencia si es empleado.',
  })
  @ApiResponse({ status: 200, description: 'Detalle del visitante.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a invitados de otros empleados.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.invitadosService.findOne(id, req.user);
  }

  @Post(':id/pase')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Emitir o renovar pase QR firmado con HMAC-SHA256 para un invitado',
    description: 'Crea o actualiza una Visita autorizada con fecha de expiración y devuelve el token QR firmado en el servidor.',
  })
  @ApiResponse({ status: 201, description: 'Pase QR emitido.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  async emitirPase(
    @Param('id') id: string,
    @Body('vigenciaDias') vigenciaDias: number | undefined,
    @Req() req: any,
  ) {
    return this.invitadosService.emitirPaseQr(id, req.user, vigenciaDias);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Actualizar datos de una visita/invitado',
    description: 'Modifica datos de la visita. Los empleados solo pueden editar sus propios invitados.',
  })
  @ApiResponse({ status: 200, description: 'Invitado actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a invitados ajenos.' })
  async update(
    @Param('id') id: string,
    @Body() updateInvitadoDto: UpdateInvitadoDto,
    @Req() req: any,
  ) {
    return this.invitadosService.update(id, updateInvitadoDto, req.user);
  }

  @Patch(':id/bloquear')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Bloquear o desbloquear ingreso de un visitante (Solo Administrador)',
    description: 'Permite a los administradores activar o revocar la restricción de acceso en la base de datos con auditoría de autor.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bloqueado: { type: 'boolean', example: true },
        motivoBloqueo: { type: 'string', example: 'Conducta inapropiada en instalaciones' },
      },
      required: ['bloqueado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado de bloqueo actualizado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async setBloqueo(
    @Param('id') id: string,
    @Body('bloqueado') bloqueado: boolean,
    @Body('motivoBloqueo') motivoBloqueo?: string,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.invitadosService.setBloqueo(id, bloqueado, motivoBloqueo, autorId);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Eliminar o dar de baja lógica a visita de invitado',
    description: 'Permite cancelar visitas. Si el invitado posee historial de accesos, realiza baja lógica para preservar evidencia.',
  })
  @ApiResponse({ status: 200, description: 'Invitado eliminado o dado de baja lógica con éxito.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.invitadosService.remove(id, req.user);
  }
}
