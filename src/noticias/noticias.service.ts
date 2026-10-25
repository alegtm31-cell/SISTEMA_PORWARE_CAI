import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.noticia.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const noticia = await this.prisma.noticia.findUnique({
      where: { id },
    });

    if (!noticia) {
      throw new NotFoundException(`Noticia con ID '${id}' no encontrada`);
    }

    return noticia;
  }

  async create(dto: CreateNoticiaDto) {
    return this.prisma.noticia.create({
      data: {
        titulo: dto.titulo.trim(),
        contenido: dto.contenido.trim(),
        imagenUrl: dto.imagenUrl ? dto.imagenUrl.trim() : null,
      },
    });
  }

  async update(id: string, dto: UpdateNoticiaDto) {
    const existing = await this.prisma.noticia.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Noticia con ID '${id}' no encontrada`);
    }

    const data: any = {};
    if (dto.titulo) data.titulo = dto.titulo.trim();
    if (dto.contenido) data.contenido = dto.contenido.trim();
    if (dto.imagenUrl !== undefined) data.imagenUrl = dto.imagenUrl ? dto.imagenUrl.trim() : null;

    return this.prisma.noticia.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.noticia.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Noticia con ID '${id}' no encontrada`);
    }

    return this.prisma.noticia.delete({
      where: { id },
    });
  }
}
