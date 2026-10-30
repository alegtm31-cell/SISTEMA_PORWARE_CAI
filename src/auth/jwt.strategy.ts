import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  cedula: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('FATAL: La variable de entorno JWT_SECRET es estrictamente obligatoria para arrancar la API.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        bloqueado: true,
        motivoBloqueo: true,
        registroCompletado: true,
        debeCambiarClave: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o sesión no válida');
    }

    if (user.bloqueado) {
      throw new UnauthorizedException(`Acceso restringido: Cuenta de usuario bloqueada por administración (${user.motivoBloqueo || 'Consulte a RRHH'}).`);
    }

    return user;
  }
}
