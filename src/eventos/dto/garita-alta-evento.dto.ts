import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GaritaAltaEventoDto {
  @ApiProperty({ description: 'Cédula del visitante en puerta', example: 'V-24555666' })
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @MaxLength(30)
  cedula: string;

  @ApiProperty({ description: 'Nombre del visitante', example: 'Luis' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ description: 'Apellido del visitante', example: 'Rojas' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(80)
  apellido: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ description: 'Placa del vehículo' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  placa?: string;

  @ApiPropertyOptional({ description: 'Empresa o nota de garita' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  empresa?: string;
}
