import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoIngreso } from '@prisma/client';

export class FilterHistorialDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial para filtrar registros (formato ISO 8601 o YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de inicio debe ser una cadena ISO' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final para filtrar registros (formato ISO 8601 o YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de fin debe ser una cadena ISO' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Tipo de movimiento (ENTRADA o SALIDA)',
    enum: TipoIngreso,
  })
  @IsOptional()
  @IsEnum(TipoIngreso, { message: 'El tipo debe ser ENTRADA o SALIDA' })
  tipo?: TipoIngreso;

  @ApiPropertyOptional({
    description: 'Búsqueda por cédula, nombre, empresa u observación',
    example: 'Rodriguez',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de persona',
    enum: ['USUARIO', 'INVITADO'],
  })
  @IsOptional()
  @IsString()
  targetType?: 'USUARIO' | 'INVITADO';

  @ApiPropertyOptional({
    description: 'Cantidad de registros a omitir para paginación',
    example: 0,
  })
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de registros a retornar',
    example: 50,
  })
  @IsOptional()
  take?: number;
}

