import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { search?: string; rol?: Role; skip?: number; take?: number }) {
    const { search, rol, skip, take } = params || {};

    const where: any = {};

    if (rol) {
      where.rol = rol;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { cedula: { contains: term, mode: 'insensitive' } },
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sanitizedTake = Math.min(Math.max(Number(take) || 50, 1), 100);
    const sanitizedSkip = Math.max(Number(skip) || 0, 0);

    const [total, users] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip: sanitizedSkip,
        take: sanitizedTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          bloqueado: true,
          motivoBloqueo: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              invitaciones: true,
              registros: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      data: users,
    };
  }

  async findOne(idOrCedula: string) {
    const clean = idOrCedula.trim();
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { id: clean },
          { cedula: { equals: clean, mode: 'insensitive' } },
          { email: { equals: clean, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
        invitaciones: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        registros: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario '${idOrCedula}' no encontrado`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const cleanCedula = dto.cedula.trim();
    const cleanEmail = dto.email.trim().toLowerCase();

    // Validar duplicados
    const existing = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { cedula: cleanCedula },
          { email: cleanEmail },
        ],
      },
    });

    if (existing) {
      if (existing.cedula === cleanCedula) {
        throw new ConflictException(`Ya existe un usuario registrado con la cédula ${cleanCedula}`);
      }
      throw new ConflictException(`Ya existe un usuario registrado con el correo ${cleanEmail}`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        cedula: cleanCedula,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: cleanEmail,
        password: hashedPassword,
        rol: dto.rol || Role.EMPLEADO,
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existingUser = await this.prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    const data: any = {};

    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido) data.apellido = dto.apellido.trim();
    if (dto.rol) data.rol = dto.rol;

    if (dto.cedula && dto.cedula !== existingUser.cedula) {
      const conflict = await this.prisma.usuario.findUnique({ where: { cedula: dto.cedula } });
      if (conflict) {
        throw new ConflictException(`La cédula '${dto.cedula}' ya está en uso por otro usuario`);
      }
      data.cedula = dto.cedula.trim();
    }

    if (dto.email && dto.email.toLowerCase() !== existingUser.email) {
      const cleanEmail = dto.email.trim().toLowerCase();
      const conflict = await this.prisma.usuario.findUnique({ where: { email: cleanEmail } });
      if (conflict) {
        throw new ConflictException(`El correo '${cleanEmail}' ya está en uso por otro usuario`);
      }
      data.email = cleanEmail;
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        updatedAt: true,
      },
    });
  }

  async setBloqueo(id: string, bloqueado: boolean, motivoBloqueo?: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        bloqueado,
        motivoBloqueo: bloqueado ? motivoBloqueo || 'Bloqueado por Recursos Humanos' : null,
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        bloqueado: true,
        motivoBloqueo: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invitaciones: true,
            registros: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    // Hallazgo: evitar fallo por clave foránea si tiene registros de acceso históricos
    if (user._count.registros > 0) {
      // Bloqueo lógico en lugar de borrado físico destructivo para preservar evidencia histórica
      return this.prisma.usuario.update({
        where: { id },
        data: {
          bloqueado: true,
          motivoBloqueo: 'Usuario desincorporado (historial preservado para auditoría)',
        },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          apellido: true,
        },
      });
    }

    return this.prisma.usuario.delete({
      where: { id },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
      },
    });
  }
}
