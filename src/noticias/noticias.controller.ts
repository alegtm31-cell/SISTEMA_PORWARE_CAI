import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Noticias y Cartelera')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/noticias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Listar todas las noticias',
    description: 'Devuelve todas las publicaciones y avisos institucionales ordenados por fecha descendente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de noticias.' })
  async findAll() {
    return this.noticiasService.findAll();
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'EMPLEADO')
  @ApiOperation({
    summary: 'Obtener detalle de una noticia',
    description: 'Devuelve el contenido completo de una noticia por su ID.',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la noticia.' })
  @ApiResponse({ status: 404, description: 'Noticia no encontrada.' })
  async findOne(@Param('id') id: string) {
    return this.noticiasService.findOne(id);
  }

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Publicar una noticia',
    description: 'Crea un nuevo aviso en la cartelera institucional. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 201, description: 'Noticia publicada con éxito.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Requiere rol ADMINISTRADOR.' })
  async create(
    @Body() createNoticiaDto: CreateNoticiaDto,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.noticiasService.create(createNoticiaDto, autorId);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Actualizar una noticia',
    description: 'Modifica el título o contenido de una publicación existente. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Noticia actualizada.' })
  @ApiResponse({ status: 404, description: 'Noticia no encontrada.' })
  async update(
    @Param('id') id: string,
    @Body() updateNoticiaDto: UpdateNoticiaDto,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.noticiasService.update(id, updateNoticiaDto, autorId);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({
    summary: 'Eliminar una noticia',
    description: 'Remueve permanentemente una publicación de la cartelera. Requiere rol ADMINISTRADOR.',
  })
  @ApiResponse({ status: 200, description: 'Noticia eliminada con éxito.' })
  @ApiResponse({ status: 404, description: 'Noticia no encontrada.' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') autorId?: string,
  ) {
    return this.noticiasService.remove(id, autorId);
  }
}
