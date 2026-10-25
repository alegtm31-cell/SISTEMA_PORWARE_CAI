import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Cédula de identidad del usuario',
    example: 'V-20123456',
  })
  @IsString({ message: 'La cédula debe ser texto' })
  @IsNotEmpty({ message: 'La cédula es requerida' })
  cedula: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Alejandro',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  apellido: string;

  @ApiProperty({
    description: 'Correo electrónico corporativo o personal',
    example: 'aperez@cai.local',
  })
  @IsEmail({}, { message: 'El formato de correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña de acceso inicial (mínimo 6 caracteres)',
    example: 'ClaveSegura2026',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el sistema',
    enum: Role,
    default: Role.EMPLEADO,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser ADMINISTRADOR, EMPLEADO o SEGURIDAD' })
  rol?: Role;

  @ApiPropertyOptional({
    description: 'Cargo o posición en la empresa',
    example: 'Supervisor de Planta',
  })
  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  cargo?: string;

  @ApiPropertyOptional({
    description: 'Departamento o área operativa',
    example: 'Mantenimiento y Garitas',
  })
  @IsOptional()
  @IsString({ message: 'El departamento debe ser texto' })
  departamento?: string;

  @ApiPropertyOptional({
    description: 'Teléfono celular o móvil de contacto',
    example: '0414-1234567',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono móvil debe ser texto' })
  telefonoMovil?: string;

  @ApiPropertyOptional({
    description: 'Teléfono fijo u oficina',
    example: '0241-7654321',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono fijo debe ser texto' })
  telefonoFijo?: string;
}

