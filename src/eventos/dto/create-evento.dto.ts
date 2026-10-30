import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventoDto {
  @ApiProperty({ description: 'Nombre del evento', example: 'Reunión Anual de Junta Directiva' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del evento es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción o instrucciones del evento' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'Fecha y hora de inicio en formato ISO 8601' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha ISO 8601 válida' })
  inicio: string;

  @ApiProperty({ description: 'Fecha y hora de fin en formato ISO 8601' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha ISO 8601 válida' })
  fin: string;

  @ApiProperty({ description: 'Cupo máximo de invitados (aforo)', example: 25 })
  @IsInt({ message: 'El aforo debe ser un número entero' })
  @Min(1, { message: 'El aforo mínimo es 1 invitado' })
  @Max(500, { message: 'El aforo máximo permitido es 500 invitados' })
  aforo: number;

  @ApiPropertyOptional({
    description: 'Si es true, los invitados que se unen por enlace entran en estado PENDIENTE hasta que el anfitrión los apruebe',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @ApiPropertyOptional({
    description: 'Estado inicial del evento',
    enum: ['BORRADOR', 'ACTIVO'],
    default: 'ACTIVO',
  })
  @IsOptional()
  @IsIn(['BORRADOR', 'ACTIVO'])
  estado?: 'BORRADOR' | 'ACTIVO';

  @ApiPropertyOptional({
    description: 'ID del anfitrión (solo permitido cuando el creador es ADMINISTRADOR)',
  })
  @IsOptional()
  @IsString()
  anfitrionId?: string;
}
