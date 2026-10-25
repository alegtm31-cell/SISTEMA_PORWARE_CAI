import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad de cabeceras HTTP con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Habilita la ejecución limpia de Swagger UI
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Configuración de CORS segura
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema CAI - API de Control de Acceso e Identificación')
    .setDescription(
      'Documentación interactiva de la API REST migrada a NestJS y Prisma para control de acceso, empleados, visitantes, auditoría en garita y cartelera institucional.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce el token JWT obtenido en /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Autenticación', 'Endpoints de inicio de sesión y perfil de usuario')
    .addTag('Control de Acceso', 'Registro de check-in (entrada) y check-out (salida) de personal y visitantes')
    .addTag('Usuarios y Personal', 'Administración de usuarios, roles y credenciales')
    .addTag('Visitantes / Invitados', 'Gestión de visitas y registro de invitados programados')
    .addTag('Historial y Auditoría', 'Consulta de bitácora de accesos, métricas en tiempo real y aforo')
    .addTag('Noticias y Cartelera', 'Publicación y lectura de avisos institucionales')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Documentación API CAI (NestJS)',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor CAI Backend corriendo en: http://0.0.0.0:${port}`);
  console.log(`📚 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
  console.log(`🔐 Autenticación JWT activa en: http://localhost:${port}/api/v1/auth/login`);
}

bootstrap();
