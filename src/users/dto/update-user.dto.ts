import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Cédula de identidad del usuario',
    example: 'V-20123456',
  })
  @IsOptional()
  @IsString({ message: 'La cédula debe ser texto' })
  cedula?: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Alejandro',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  apellido?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'aperez_nuevo@cai.local',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El formato de correo electrónico no es válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña (opcional, mínimo 6 caracteres)',
    example: 'NuevaClaveSegura2026',
    minLength: 6,
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el sistema',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser ADMINISTRADOR, EMPLEADO o SEGURIDAD' })
  rol?: Role;
}

