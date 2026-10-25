import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteRegistroDto {
  @ApiProperty({ description: 'Cédula de identidad pre-registrada', example: 'V-23456789' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiPropertyOptional({ description: 'Correo electrónico corporativo o personal', example: 'empleado@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser una dirección válida' })
  email?: string;

  @ApiProperty({ description: 'Contraseña para inicio de sesión (mínimo 6 caracteres)', example: 'ClaveSegura2026*' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ description: 'Cargo o posición en la empresa', example: 'Analista de Operaciones' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional({ description: 'Departamento o gerencia', example: 'Logística' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ description: 'Teléfono móvil', example: '04141234567' })
  @IsOptional()
  @IsString()
  telefonoMovil?: string;

  @ApiPropertyOptional({ description: 'Teléfono de oficina o fijo', example: '02129876543' })
  @IsOptional()
  @IsString()
  telefonoFijo?: string;
}
