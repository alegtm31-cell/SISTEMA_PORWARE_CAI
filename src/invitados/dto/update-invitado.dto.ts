import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInvitadoDto {
  @ApiPropertyOptional({
    description: 'Cédula o número de documento de identidad del visitante',
    example: 'V-19876543',
  })
  @IsOptional()
  @IsString({ message: 'La cédula debe ser texto' })
  cedula?: string;

  @ApiPropertyOptional({
    description: 'Nombre del visitante',
    example: 'Mariana',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Apellido del visitante',
    example: 'Gómez',
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  apellido?: string;

  @ApiPropertyOptional({
    description: 'Empresa o institución a la que representa',
    example: 'Servicios Integrales C.A.',
  })
  @IsOptional()
  @IsString({ message: 'El nombre de empresa debe ser texto' })
  empresa?: string;

  @ApiPropertyOptional({
    description: 'ID (UUID) del nuevo empleado anfitrión',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString({ message: 'El ID del empleado anfitrión debe ser texto' })
  empleadoId?: string;
}

