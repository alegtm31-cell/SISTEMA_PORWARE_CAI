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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Usuarios y Personal')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Listar usuarios del sistema',
    description: 'Permite buscar y paginar usuarios con filtros por nombre, cédula, correo o rol. Requiere rol ADMINISTRADOR.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda (cédula, nombre o correo)' })
  @ApiQuery({ name: 'rol', required: false, enum: Role, description: 'Filtrar por rol' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Número de registros a omitir para paginación' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Cantidad de registros a obtener' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios y total de registros.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async findAll(
    @Query('search') search?: string,
    @Query('rol') rol?: Role,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.usersService.findAll({ search, rol, skip, take });
  }

  @Get(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Obtener detalle de un usuario',
    description: 'Devuelve información completa del usuario incluyendo historial reciente e invitaciones creadas. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Detalle del usuario encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description: 'Crea un usuario con contraseña cifrada en Bcrypt y rol asignado. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Conflicto: ya existe un usuario con la misma cédula o correo.' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.usersService.create(createUserDto, autorId);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Modifica datos de perfil, rol o contraseña de un usuario existente. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de cédula o correo duplicado.' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.usersService.update(id, updateUserDto, autorId);
  }

  @Patch(':id/bloquear')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Bloquear o desbloquear acceso de un usuario',
    description: 'Permite revocar permisos de ingreso por Recursos Humanos persistiendo el motivo en base de datos. Requiere rol ADMINISTRADOR.',
  })
  async setBloqueo(
    @Param('id') id: string,
    @Body('bloqueado') bloqueado: boolean,
    @Body('motivoBloqueo') motivoBloqueo?: string,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.usersService.setBloqueo(id, bloqueado, motivoBloqueo, autorId);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina lógicamente/físicamente el registro del usuario del sistema. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.usersService.remove(id, autorId);
  }
}
