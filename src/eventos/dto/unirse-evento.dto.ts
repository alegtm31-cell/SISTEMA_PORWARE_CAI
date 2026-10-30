import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnirseEventoDto {
  @ApiProperty({ description: 'Token firmado del evento (CAI-EVT:<payloadB64>.<hmac>)' })
  @IsString()
  @IsNotEmpty({ message: 'El código de evento es obligatorio' })
  token: string;

  @ApiProperty({ description: 'Cédula o documento de identidad del visitante', example: 'V-19888777' })
  @IsString()
  @IsNotEmpty({ message: 'La cédula de identidad es obligatoria' })
  @MaxLength(30)
  cedula: string;

  @ApiProperty({ description: 'Nombre del visitante', example: 'Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ description: 'Apellido del visitante', example: 'Mendoza' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(80)
  apellido: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '0414-1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ description: 'Empresa o institución (opcional)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  empresa?: string;

  @ApiPropertyOptional({ description: 'Placa del vehículo (opcional)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  placa?: string;
}
