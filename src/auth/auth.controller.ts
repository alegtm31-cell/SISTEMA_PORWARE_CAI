import { Controller, Post, Get, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CompleteRegistroDto } from './dto/complete-registro.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Autenticación y Registro')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Permite autenticarse mediante cédula o correo electrónico junto con la contraseña. Devuelve token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso con token JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('check-preregistro/:cedula')
  @ApiOperation({
    summary: 'Verificar pre-registro por cédula (Paridad con sistema original)',
    description: 'Comprueba si la cédula fue pre-registrada por el Administrador y si está lista para que el empleado complete sus datos.',
  })
  @ApiResponse({ status: 200, description: 'Información de pre-registro disponible.' })
  @ApiResponse({ status: 404, description: 'Cédula no pre-registrada.' })
  async checkPreRegistro(@Param('cedula') cedula: string) {
    return this.authService.checkPreRegistro(cedula);
  }

  @Public()
  @Post('complete-registro')
  @ApiOperation({
    summary: 'Auto-registro del empleado (Paridad con sistema original)',
    description: 'Permite al empleado completar sus datos personales (correo, cargo, departamento, teléfono y clave). Devuelve sesión activa.',
  })
  @ApiResponse({ status: 201, description: 'Auto-registro completado con éxito.' })
  @ApiResponse({ status: 404, description: 'Cédula no pre-registrada.' })
  async completeRegistro(@Body() dto: CompleteRegistroDto) {
    return this.authService.completeRegistro(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario actual',
    description: 'Devuelve la información del usuario autenticado que realiza la petición.',
  })
  @ApiResponse({ status: 200, description: 'Datos del perfil del usuario autenticado.' })
  @ApiResponse({ status: 401, description: 'No autorizado / Token ausente o inválido.' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Modificar mi perfil (Paridad con sistema original)',
    description: 'Permite a cualquier usuario actualizar sus datos personales, teléfonos y cambiar su contraseña.',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta o datos inválidos.' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }
}
