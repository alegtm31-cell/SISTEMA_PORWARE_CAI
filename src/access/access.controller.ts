import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccessService } from './access.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterAccessDto } from './dto/register-access.dto';

@ApiTags('Control de Acceso')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('check-in')
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Registrar entrada (Check-in)',
    description: 'Registra el ingreso de un empleado o visitante admitiendo UUID o Cédula y observación opcional.',
  })
  @ApiResponse({ status: 201, description: 'Entrada registrada con éxito en el historial.' })
  @ApiResponse({ status: 404, description: 'Persona o invitado no encontrado por la identificación provista.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol SEGURIDAD o ADMINISTRADOR.' })
  async registerEntry(@Body() dto: RegisterAccessDto) {
    return await this.accessService.registerAccess(dto.targetId, dto.isGuest, 'ENTRADA', dto.observacion);
  }

  @Post('check-out')
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Registrar salida (Check-out)',
    description: 'Registra la salida de un empleado o visitante admitiendo UUID o Cédula y observación opcional.',
  })
  @ApiResponse({ status: 201, description: 'Salida registrada con éxito en el historial.' })
  @ApiResponse({ status: 404, description: 'Persona o invitado no encontrado por la identificación provista.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol SEGURIDAD o ADMINISTRADOR.' })
  async registerExit(@Body() dto: RegisterAccessDto) {
    return await this.accessService.registerAccess(dto.targetId, dto.isGuest, 'SALIDA', dto.observacion);
  }
}

