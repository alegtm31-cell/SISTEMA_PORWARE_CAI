import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { ALLOW_PASSWORD_CHANGE_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

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

    const requiredRoles = this.reflector.getAllAndOverride<(Role | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !user.rol) {
      throw new ForbiddenException('No tiene permisos para acceder a este recurso');
    }

    const hasRole = requiredRoles.includes(user.rol);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
