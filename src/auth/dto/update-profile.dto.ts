import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nombre', example: 'Carlos' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Apellido', example: 'Rodríguez' })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'carlos@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Cargo laboral', example: 'Coordinador de Garita' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional({ description: 'Departamento', example: 'Seguridad Integral' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ description: 'Teléfono móvil', example: '04121234567' })
  @IsOptional()
  @IsString()
  telefonoMovil?: string;

  @ApiPropertyOptional({ description: 'Teléfono fijo', example: '02123456789' })
  @IsOptional()
  @IsString()
  telefonoFijo?: string;

  @ApiPropertyOptional({ description: 'URL de foto de perfil', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @ApiPropertyOptional({ description: 'Contraseña actual para confirmar cambio de clave' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña', example: 'NuevaClave2026*' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword?: string;
}
