import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAccessDto {
  @ApiProperty({
    description: 'ID (UUID), Cédula de la persona o Token QR firmado (CAI2:...)',
    example: 'V-12345678',
  })
  @IsString({ message: 'El identificador o cédula debe ser texto' })
  @IsNotEmpty({ message: 'Debe especificar el ID o cédula de la persona' })
  targetId: string;

  @ApiProperty({
    description: 'Indica si la persona es un visitante/invitado (true) o un empleado/usuario del sistema (false)',
    example: false,
  })
  @IsBoolean({ message: 'isGuest debe ser un valor booleano' })
  isGuest: boolean;

  @ApiPropertyOptional({
    description: 'Observación o motivo del acceso en garita (opcional)',
    example: 'Ingreso autorizado por gerencia técnica',
  })
  @IsOptional()
  @IsString({ message: 'La observación debe ser texto' })
  observacion?: string;

  @ApiPropertyOptional({
    description: 'Token QR firmado con HMAC-SHA256 escaneado en garita (opcional)',
    example: 'CAI2:eyJ2aXNpdGFJZCI6...',
  })
  @IsOptional()
  @IsString()
  qrToken?: string;
}
