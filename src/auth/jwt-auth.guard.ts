import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ALLOW_PASSWORD_CHANGE_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (user?.debeCambiarClave) {
      const allowPasswordChange = this.reflector.getAllAndOverride<boolean>(
        ALLOW_PASSWORD_CHANGE_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!allowPasswordChange) {
        throw new ForbiddenException(
          'CAMBIO_CLAVE_REQUERIDO: Debe cambiar su contraseña temporal antes de utilizar el sistema.',
        );
      }
    }

    return true;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token de autenticación inválido o ausente');
    }
    return user;
  }
}
