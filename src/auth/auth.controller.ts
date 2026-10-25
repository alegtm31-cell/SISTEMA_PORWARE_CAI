import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Autenticación')
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
  @ApiResponse({ status: 401, description: 'Credenciales inválidas (usuario no encontrado o contraseña incorrecta).' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
}

