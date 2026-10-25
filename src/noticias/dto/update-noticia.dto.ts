import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoticiaDto {
  @ApiPropertyOptional({
    description: 'Título actualizado de la noticia',
    example: 'Mantenimiento preventivo reprogramado',
  })
  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Contenido actualizado de la noticia',
    example: 'El mantenimiento se ejecutará el domingo en vez del sábado.',
  })
  @IsOptional()
  @IsString({ message: 'El contenido debe ser texto' })
  contenido?: string;

  @ApiPropertyOptional({
    description: 'URL o ruta de imagen adjunta al comunicado',
    example: '/uploads/noticias/comunicado1.png',
  })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser texto' })
  imagenUrl?: string;
}

