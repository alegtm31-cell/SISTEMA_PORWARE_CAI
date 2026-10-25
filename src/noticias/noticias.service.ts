import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';

@Injectable()
export class NoticiasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

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
    const created = await this.prisma.noticia.create({
      data: {
        titulo: dto.titulo.trim(),
        contenido: dto.contenido.trim(),
        imagenUrl: dto.imagenUrl ? dto.imagenUrl.trim() : null,
      },
    });

    await this.auditoriaService.registrar({
      accion: 'CREAR_NOTICIA',
      entidad: 'Noticia',
      entidadId: created.id,
      detalles: { titulo: created.titulo },
    });

    return created;
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

    const updated = await this.prisma.noticia.update({
      where: { id },
      data,
    });

    await this.auditoriaService.registrar({
      accion: 'ACTUALIZAR_NOTICIA',
      entidad: 'Noticia',
      entidadId: id,
      detalles: { cambios: Object.keys(data), titulo: updated.titulo },
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.noticia.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Noticia con ID '${id}' no encontrada`);
    }

    const deleted = await this.prisma.noticia.delete({
      where: { id },
    });

    await this.auditoriaService.registrar({
      accion: 'ELIMINAR_NOTICIA',
      entidad: 'Noticia',
      entidadId: id,
      detalles: { titulo: existing.titulo },
    });

    return deleted;
  }
}

