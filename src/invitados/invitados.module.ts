import { Module } from '@nestjs/common';
import { InvitadosService } from './invitados.service';
import { InvitadosController } from './invitados.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InvitadosController],
  providers: [InvitadosService],
  exports: [InvitadosService],
})
export class InvitadosModule {}
