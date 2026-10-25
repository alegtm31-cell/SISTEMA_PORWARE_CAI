import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { UsersModule } from './users/users.module';
import { InvitadosModule } from './invitados/invitados.module';
import { HistorialModule } from './historial/historial.module';
import { NoticiasModule } from './noticias/noticias.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // Límite de 120 peticiones por minuto para mitigar ataques de fuerza bruta y DoS
      },
    ]),
    PrismaModule,
    AuthModule,
    AccessModule,
    UsersModule,
    InvitadosModule,
    HistorialModule,
    NoticiasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
