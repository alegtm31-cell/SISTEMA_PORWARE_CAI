import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual o temporal del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'Debe ingresar su contraseña actual' })
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña personal (mínimo 6 caracteres)', example: 'ClaveSegura2026*' })
  @IsString()
  @IsNotEmpty({ message: 'Debe ingresar la nueva contraseña' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword: string;
}
