import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
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

  @Get('lookup/:cedula')
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Consultar identidad, pase QR HMAC-SHA256 y estado en tiempo real para Garita',
    description: 'Verifica en el servidor si la cédula o el código QR firmado (CAI2:...) pertenece a un empleado o visitante con visita vigente.',
  })
  @ApiResponse({ status: 200, description: 'Datos de la persona e información de acceso.' })
  @ApiResponse({ status: 403, description: 'Pase QR adulterado, expirado o rol sin permisos.' })
  @ApiResponse({ status: 404, description: 'Cédula no encontrada en la base de datos.' })
  async lookupPersona(@Param('cedula') cedula: string, @Req() req: any) {
    return await this.accessService.lookupPersona(cedula, req.user?.id);
  }

  @Post('check-in')
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Registrar entrada (Check-in)',
    description: 'Registra el ingreso de un empleado o visitante validando bloqueos, anti-passback y vigencia del pase QR en la tabla Visita.',
  })
  @ApiResponse({ status: 201, description: 'Entrada registrada con éxito en el historial.' })
  @ApiResponse({ status: 400, description: 'Violación de Anti-Passback.' })
  @ApiResponse({ status: 403, description: 'Persona bloqueada, pase QR inválido/vencido o rol no autorizado.' })
  @ApiResponse({ status: 404, description: 'Persona o invitado no encontrado.' })
  async registerEntry(@Body() dto: RegisterAccessDto, @Req() req: any) {
    return await this.accessService.registerAccess(
      dto.targetId,
      dto.isGuest,
      'ENTRADA',
      dto.observacion,
      req.user?.id,
      dto.qrToken,
    );
  }

  @Post('check-out')
  @Roles('SEGURIDAD', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Registrar salida (Check-out)',
    description: 'Registra la salida de un empleado o visitante admitiendo UUID, Cédula o Token QR y observación opcional.',
  })
  @ApiResponse({ status: 201, description: 'Salida registrada con éxito en el historial.' })
  @ApiResponse({ status: 400, description: 'Violación de Anti-Passback (salida sin entrada previa).' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol SEGURIDAD o ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Persona o invitado no encontrado.' })
  async registerExit(@Body() dto: RegisterAccessDto, @Req() req: any) {
    return await this.accessService.registerAccess(
      dto.targetId,
      dto.isGuest,
      'SALIDA',
      dto.observacion,
      req.user?.id,
      dto.qrToken,
    );
  }
}
