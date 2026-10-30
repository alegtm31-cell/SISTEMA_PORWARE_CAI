import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventoDto {
  @ApiPropertyOptional({ description: 'Nombre del evento' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del evento' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de inicio ISO 8601' })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de fin ISO 8601' })
  @IsOptional()
  @IsDateString()
  fin?: string;

  @ApiPropertyOptional({ description: 'Cupo máximo de invitados (aforo)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  aforo?: number;

  @ApiPropertyOptional({ description: 'Requerir aprobación manual del anfitrión' })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @ApiPropertyOptional({
    description: 'Estado del evento',
    enum: ['BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO'],
  })
  @IsOptional()
  @IsIn(['BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO'])
  estado?: 'BORRADOR' | 'ACTIVO' | 'CERRADO' | 'CANCELADO';

  @ApiPropertyOptional({ description: 'Activar o desactivar el enlace/código compartido' })
  @IsOptional()
  @IsBoolean()
  codigoActivo?: boolean;
}
