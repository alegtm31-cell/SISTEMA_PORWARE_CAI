import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Cédula (ej. V-12345678) o correo electrónico del usuario',
    example: 'admin@cai.local',
  })
  @IsString({ message: 'El identificador (cédula o email) debe ser texto' })
  @IsNotEmpty({ message: 'Debe ingresar su cédula o correo electrónico' })
  identifier: string;

  @ApiProperty({
    description: 'Contraseña de acceso del usuario',
    example: 'admin123',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  password: string;
}

