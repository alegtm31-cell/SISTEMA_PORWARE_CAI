import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión exitosa con PostgreSQL');
    } catch (error: any) {
      this.logger.warn(
        `⚠️ No se pudo conectar a PostgreSQL en localhost:5432 (${error.message}).\n` +
        `   💡 Si usas Docker, abre Docker Desktop y ejecuta:\n` +
        `      docker compose up -d postgres\n` +
        `   El servidor continuará activo para Swagger UI y reintentará la conexión en la primera consulta.`,
      );
    }
  }
}

