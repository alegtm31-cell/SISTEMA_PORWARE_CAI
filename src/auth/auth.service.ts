import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { CompleteRegistroDto } from './dto/complete-registro.dto';
import { RegisterAccountDto } from './dto/register-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
  ) { }

  async validateUser(identifier: string, rawPass: string, ip?: string, userAgent?: string) {
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
      await this.auditoriaService.registrar({
        accion: 'LOGIN_FALLIDO',
        entidad: 'Auth',
        detalles: { identificador: cleanId, motivo: 'Usuario no encontrado' },
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
    }

    // Seguridad: Bloquear inicio de sesión si el usuario está vetado/deshabilitado
    if (user.bloqueado) {
      await this.auditoriaService.registrar({
        usuarioId: user.id,
        accion: 'LOGIN_BLOQUEADO',
        entidad: 'Auth',
        detalles: { identificador: cleanId, motivo: user.motivoBloqueo || 'Usuario bloqueado por administración' },
        ip,
        userAgent,
      });
      throw new UnauthorizedException(`Acceso denegado: Usuario bloqueado por administración (${user.motivoBloqueo || 'Consulte a Recursos Humanos'}).`);
    }

    const isMatch = await bcrypt.compare(rawPass, user.password);
    if (!isMatch) {
      await this.auditoriaService.registrar({
        usuarioId: user.id,
        accion: 'LOGIN_FALLIDO',
        entidad: 'Auth',
        detalles: { identificador: cleanId, motivo: 'Contraseña incorrecta' },
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
    }

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.identifier, loginDto.password, ip, userAgent);

    const payload: JwtPayload = {
      sub: user.id,
      cedula: user.cedula,
      email: user.email,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditoriaService.registrar({
      usuarioId: user.id,
      accion: 'LOGIN_EXITOSO',
      entidad: 'Auth',
      detalles: { email: user.email, rol: user.rol, cedula: user.cedula, debeCambiarClave: user.debeCambiarClave },
      ip,
      userAgent,
    });

    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
      access_token: accessToken,
      user,
    };
  }

  async registerAccount(dto: RegisterAccountDto, ip?: string, userAgent?: string) {
    const cleanCedula = dto.cedula.trim().toUpperCase();
    const cleanEmail = dto.email.trim().toLowerCase();

    // Verificación preventiva contra usurpación de cuenta
    const existingByCedula = await this.prisma.usuario.findFirst({
      where: { cedula: { equals: cleanCedula, mode: 'insensitive' } },
    });
    if (existingByCedula) {
      throw new ConflictException('La cédula de identidad ya se encuentra registrada en el sistema.');
    }

    const existingByEmail = await this.prisma.usuario.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });
    if (existingByEmail) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado en el sistema.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Registro público siempre crea cuentas con rol EMPLEADO (Propietario/Residente/Personal).
    // Las cuentas ADMINISTRADOR y SEGURIDAD son aprovisionadas exclusivamente por un Administrador autenticado.
    const savedUser = await this.prisma.usuario.create({
      data: {
        cedula: cleanCedula,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: cleanEmail,
        password: hashedPassword,
        rol: 'EMPLEADO',
        registroCompletado: true,
        debeCambiarClave: false,
      },
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
        registroCompletado: true,
        debeCambiarClave: true,
      },
    });

    const payload: JwtPayload = {
      sub: savedUser.id,
      cedula: savedUser.cedula,
      email: savedUser.email,
      rol: savedUser.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditoriaService.registrar({
      usuarioId: savedUser.id,
      accion: 'REGISTRO_CUENTA_EMAIL',
      entidad: 'Usuario',
      entidadId: savedUser.id,
      detalles: { cedula: savedUser.cedula, email: savedUser.email, rol: savedUser.rol },
      ip,
      userAgent,
    });

    return {
      message: 'Cuenta registrada e inicio de sesión exitoso.',
      accessToken,
      access_token: accessToken,
      user: savedUser,
    };
  }

  // Paridad con original: Verificar si la cédula está pre-registrada por el Administrador
  // Seguridad: No expone datos sensibles (correo, rol, teléfonos) a consultas anónimas
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

    if (user.bloqueado) {
      throw new BadRequestException('Esta cuenta está deshabilitada o bloqueada por la administración.');
    }

    // Solo empleados pueden auto-registrarse
    if (user.rol !== 'EMPLEADO') {
      throw new BadRequestException('El auto-registro está reservado exclusivamente para empleados pre-registrados.');
    }

    const yaRegistrado = Boolean(user.registroCompletado);

    return {
      preRegistrado: true,
      preregistrado: true,
      yaRegistrado,
      completado: yaRegistrado,
      cedula: user.cedula,
      nombre: user.nombre,
      apellido: user.apellido,
    };
  }

  // Paridad con original: Completar auto-registro del empleado
  // Seguridad: Bloquea toma de cuentas; exige rol EMPLEADO y que registroCompletado sea false
  async completeRegistro(dto: CompleteRegistroDto, ip?: string, userAgent?: string) {
    const clean = dto.cedula.trim();
    const rawNumber = clean.replace(/^[VEJGPvejgp]-?/, '');
    const variants = [clean, rawNumber, `V-${rawNumber}`, `E-${rawNumber}`, `J-${rawNumber}`];

    const user = await this.prisma.usuario.findFirst({
      where: { cedula: { in: variants, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException('Esta cédula no se encuentra pre-registrada.');
    }

    if (user.bloqueado) {
      throw new BadRequestException('Esta cuenta se encuentra bloqueada por la administración.');
    }

    if (user.rol !== 'EMPLEADO') {
      throw new BadRequestException('Operación no permitida: Solo empleados pueden completar auto-registro.');
    }

    if (user.registroCompletado) {
      throw new BadRequestException('Este usuario ya completó su registro previamente. Por favor inicie sesión o solicite restablecer contraseña.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const data: any = {
      password: hashedPassword,
      registroCompletado: true,
      debeCambiarClave: false,
    };
    if (dto.email) data.email = dto.email.trim().toLowerCase();
    if (dto.cargo !== undefined) data.cargo = dto.cargo ? dto.cargo.trim() : null;
    if (dto.departamento !== undefined) data.departamento = dto.departamento ? dto.departamento.trim() : null;
    if (dto.telefonoMovil !== undefined) data.telefonoMovil = dto.telefonoMovil ? dto.telefonoMovil.trim() : null;
    if (dto.telefonoFijo !== undefined) data.telefonoFijo = dto.telefonoFijo ? dto.telefonoFijo.trim() : null;

    const updated = await this.prisma.usuario.update({
      where: { id: user.id },
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
        registroCompletado: true,
        debeCambiarClave: true,
      },
    });

    const payload: JwtPayload = {
      sub: updated.id,
      cedula: updated.cedula,
      email: updated.email,
      rol: updated.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditoriaService.registrar({
      usuarioId: updated.id,
      accion: 'REGISTRO_COMPLETADO',
      entidad: 'Usuario',
      entidadId: updated.id,
      detalles: { cedula: updated.cedula, email: updated.email, rol: updated.rol },
      ip,
      userAgent,
    });

    return {
      message: 'Registro completado exitosamente. Bienvenido al sistema CAI.',
      accessToken,
      access_token: accessToken,
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
        bloqueado: true,
        registroCompletado: true,
        debeCambiarClave: true,
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
    if (dto.email) data.email = dto.email.trim().toLowerCase();
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
      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException('La nueva contraseña debe ser diferente a la contraseña actual');
      }
      data.password = await bcrypt.hash(dto.newPassword, 10);
      data.debeCambiarClave = false;
    }

    const updated = await this.prisma.usuario.update({
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
        registroCompletado: true,
        debeCambiarClave: true,
        updatedAt: true,
      },
    });

    if (dto.newPassword) {
      await this.auditoriaService.registrar({
        usuarioId: userId,
        accion: 'CAMBIO_CLAVE',
        entidad: 'Usuario',
        entidadId: userId,
        detalles: { cedula: updated.cedula },
      });
    }

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual ingresada es incorrecta');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la contraseña temporal o actual');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        debeCambiarClave: false,
        registroCompletado: true,
      },
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
        registroCompletado: true,
        debeCambiarClave: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'CAMBIO_CLAVE_OBLIGATORIO',
      entidad: 'Usuario',
      entidadId: userId,
      detalles: { cedula: updated.cedula, rol: updated.rol },
      ip,
      userAgent,
    });

    return {
      message: 'Contraseña actualizada exitosamente.',
      user: updated,
    };
  }

  async logout(userId: string, ip?: string, userAgent?: string) {
    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'LOGOUT',
      entidad: 'Auth',
      entidadId: userId,
      ip,
      userAgent,
    });
    return { message: 'Sesión cerrada exitosamente' };
  }
}
