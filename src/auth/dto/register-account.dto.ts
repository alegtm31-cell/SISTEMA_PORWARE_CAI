import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAccountDto {
  @ApiProperty({ description: 'Cédula de identidad', example: 'V-12345678' })
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula: string;

  @ApiProperty({ description: 'Nombre', example: 'Alejandro' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({ description: 'Apellido', example: 'García' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @ApiProperty({ description: 'Correo electrónico para iniciar sesión', example: 'empleado@empresa.com' })
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', example: 'ClaveSegura2026*' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}


