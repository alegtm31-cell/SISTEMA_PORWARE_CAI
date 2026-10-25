import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitadoDto {
  @ApiProperty({
    description: 'Cédula o número de documento de identidad del visitante',
    example: 'V-19876543',
  })
  @IsString({ message: 'La cédula debe ser texto' })
  @IsNotEmpty({ message: 'La cédula del invitado es obligatoria' })
  cedula: string;

  @ApiProperty({
    description: 'Nombre del visitante',
    example: 'Mariana',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del invitado es obligatorio' })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del visitante',
    example: 'Gómez',
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido del invitado es obligatorio' })
  apellido: string;

  @ApiPropertyOptional({
    description: 'Empresa o institución a la que representa el visitante',
    example: 'Servicios Tecnológicos C.A.',
  })
  @IsOptional()
  @IsString({ message: 'El nombre de empresa debe ser texto' })
  empresa?: string;

  @ApiPropertyOptional({
    description: 'ID (UUID) del empleado anfitrión (opcional; si se omite, se asigna al usuario autenticado)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString({ message: 'El ID del empleado anfitrión debe ser texto' })
  empleadoId?: string;
}

