import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { UsersModule } from './users/users.module';
import { InvitadosModule } from './invitados/invitados.module';
import { HistorialModule } from './historial/historial.module';
import { NoticiasModule } from './noticias/noticias.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    UsersModule,
    InvitadosModule,
    HistorialModule,
    NoticiasModule,
  ],
})
export class AppModule {}
