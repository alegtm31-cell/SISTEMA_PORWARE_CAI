import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAccessDto {
  @ApiProperty({
    description: 'ID (UUID) o Cédula de la persona (empleado o visitante)',
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
}

