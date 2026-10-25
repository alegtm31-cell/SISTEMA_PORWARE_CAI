import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoticiaDto {
  @ApiProperty({
    description: 'Título o encabezado del comunicado institucional',
    example: 'Mantenimiento programado de servidores y garitas',
  })
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título de la noticia es obligatorio' })
  titulo: string;

  @ApiProperty({
    description: 'Cuerpo o contenido detallado de la noticia',
    example: 'Se informa al personal que este sábado se realizarán labores de mantenimiento entre las 08:00 y las 14:00.',
  })
  @IsString({ message: 'El contenido debe ser texto' })
  @IsNotEmpty({ message: 'El contenido de la noticia es obligatorio' })
  contenido: string;

  @ApiPropertyOptional({
    description: 'URL o ruta de imagen adjunta al comunicado',
    example: '/uploads/noticias/comunicado1.png',
  })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser texto' })
  imagenUrl?: string;
}

