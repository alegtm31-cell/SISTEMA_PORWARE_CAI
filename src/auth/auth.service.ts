import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { CompleteRegistroDto } from './dto/complete-registro.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, rawPass: string) {
    const cleanId = identifier.trim();

    // Permite login por cédula o correo electrónico
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { cedula: { equals: cleanId, mode: 'insensitive' } },
          { email: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
    });

    // Seguridad: Unificar mensaje de error para evitar enumeración de usuarios
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
    }

    const isMatch = await bcrypt.compare(rawPass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
    }

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.identifier, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      cedula: user.cedula,
      email: user.email,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
      user,
    };
  }

  // Paridad con original: Verificar si la cédula está pre-registrada por el Administrador
  async checkPreRegistro(cedula: string) {
    const clean = cedula.trim();
    const rawNumber = clean.replace(/^[VEJGPvejgp]-?/, '');
    const variants = [clean, rawNumber, `V-${rawNumber}`, `E-${rawNumber}`, `J-${rawNumber}`];

    const user = await this.prisma.usuario.findFirst({
      where: { cedula: { in: variants, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException(
        'Esta cédula no está pre-registrada en el sistema. Por favor contacte al departamento de Recursos Humanos o Administrador.',
      );
    }

    // Comprobar si ya tiene perfil completado con contraseña propia
    const yaRegistrado = user.cargo !== null || user.telefonoMovil !== null;

    return {
      preRegistrado: true,
      yaRegistrado,
      id: user.id,
      cedula: user.cedula,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      cargo: user.cargo,
      departamento: user.departamento,
      telefonoMovil: user.telefonoMovil,
      telefonoFijo: user.telefonoFijo,
      rol: user.rol,
    };
  }

  // Paridad con original: Completar auto-registro del empleado
  async completeRegistro(dto: CompleteRegistroDto) {
    const { id } = await this.checkPreRegistro(dto.cedula);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const data: any = {
      password: hashedPassword,
    };
    if (dto.email) data.email = dto.email.trim().toLowerCase();
    if (dto.cargo !== undefined) data.cargo = dto.cargo ? dto.cargo.trim() : null;
    if (dto.departamento !== undefined) data.departamento = dto.departamento ? dto.departamento.trim() : null;
    if (dto.telefonoMovil !== undefined) data.telefonoMovil = dto.telefonoMovil ? dto.telefonoMovil.trim() : null;
    if (dto.telefonoFijo !== undefined) data.telefonoFijo = dto.telefonoFijo ? dto.telefonoFijo.trim() : null;

    const updated = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        cargo: true,
        departamento: true,
        telefonoMovil: true,
        telefonoFijo: true,
        fotoUrl: true,
      },
    });

    const payload: JwtPayload = {
      sub: updated.id,
      cedula: updated.cedula,
      email: updated.email,
      rol: updated.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Registro completado exitosamente. Bienvenido al sistema CAI.',
      accessToken,
      user: updated,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        cargo: true,
        departamento: true,
        telefonoMovil: true,
        telefonoFijo: true,
        fotoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  // Paridad con original: Modificar perfil propio
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido) data.apellido = dto.apellido.trim();
    if (dto.cargo !== undefined) data.cargo = dto.cargo ? dto.cargo.trim() : null;
    if (dto.departamento !== undefined) data.departamento = dto.departamento ? dto.departamento.trim() : null;
    if (dto.telefonoMovil !== undefined) data.telefonoMovil = dto.telefonoMovil ? dto.telefonoMovil.trim() : null;
    if (dto.telefonoFijo !== undefined) data.telefonoFijo = dto.telefonoFijo ? dto.telefonoFijo.trim() : null;
    if (dto.fotoUrl !== undefined) data.fotoUrl = dto.fotoUrl ? dto.fotoUrl.trim() : null;

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Debe ingresar su contraseña actual para confirmar el cambio de clave');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('La contraseña actual ingresada es incorrecta');
      }
      data.password = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.usuario.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        cargo: true,
        departamento: true,
        telefonoMovil: true,
        telefonoFijo: true,
        fotoUrl: true,
        updatedAt: true,
      },
    });
  }
}
