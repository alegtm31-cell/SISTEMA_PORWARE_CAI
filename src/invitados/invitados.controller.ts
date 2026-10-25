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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @Roles('ADMINISTRADOR', 'EMPLEADO', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Registrar nuevo invitado o visita',
    description: 'Registra un visitante en el sistema. Si el empleado no especifica empleadoId, se asocia automáticamente a su propio usuario.',
  })
  @ApiResponse({ status: 201, description: 'Invitado registrado o actualizado satisfactoriamente.' })
  @ApiResponse({ status: 400, description: 'Empleado anfitrión no encontrado o datos incompletos.' })
  async create(
    @Body() createInvitadoDto: CreateInvitadoDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.invitadosService.create(createInvitadoDto, currentUserId);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Listar todos los invitados',
    description: 'Permite buscar visitantes por cédula, nombre o empresa, y filtrar por empleado anfitrión con paginación.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por cédula, nombre o empresa' })
  @ApiQuery({ name: 'empleadoId', required: false, description: 'Filtrar por ID del empleado anfitrión' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Registros a omitir' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Cantidad de registros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de visitantes.' })
  async findAll(
    @Query('search') search?: string,
    @Query('empleadoId') empleadoId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.invitadosService.findAll({ search, empleadoId, skip, take });
  }

  @Get('mis-invitados')
  @ApiOperation({
    summary: 'Obtener mis invitados registrados',
    description: 'Permite a un empleado consultar los visitantes registrados bajo su autoría.',
  })
  @ApiResponse({ status: 200, description: 'Lista de invitados creados por el usuario actual.' })
  async findMyInvitations(@CurrentUser('id') currentUserId: string) {
    return this.invitadosService.findByEmpleado(currentUserId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un invitado',
    description: 'Devuelve información del visitante, su empleado anfitrión y su historial de entradas y salidas.',
  })
  @ApiResponse({ status: 200, description: 'Detalle del visitante.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  async findOne(@Param('id') id: string) {
    return this.invitadosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'EMPLEADO', 'SEGURIDAD')
  @ApiOperation({
    summary: 'Actualizar datos de una visita/invitado',
    description: 'Modifica datos de la visita, empresa o transfiere a otro empleado anfitrión.',
  })
  @ApiResponse({ status: 200, description: 'Invitado actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  async update(@Param('id') id: string, @Body() updateInvitadoDto: UpdateInvitadoDto) {
    return this.invitadosService.update(id, updateInvitadoDto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Eliminar invitado',
    description: 'Elimina el registro del visitante del sistema. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Invitado eliminado con éxito.' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado.' })
  async remove(@Param('id') id: string) {
    return this.invitadosService.remove(id);
  }
}

