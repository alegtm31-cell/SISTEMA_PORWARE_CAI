# Runbook de Despliegue en Producción y Rollback — Sistema PORWARE CAI

Este documento describe el procedimiento paso a paso para desplegar el sistema **PORWARE CAI** en producción usando `docker-compose.prod.yml`, migraciones versionadas de Prisma (`prisma migrate deploy`), certificados TLS y Node 22 LTS.

---

## 1. Requisitos Previos en el Servidor

- **Docker Engine** 24+ y **Docker Compose** v2+.
- **OpenSSL** instalado para generar certificados TLS autofirmados (o certificados corporativos emitidos por su CA interna).
- Puertos `80` (redirección HTTP -> HTTPS) y `443` (HTTPS Nginx Reverse Proxy + SPA) abiertos en el firewall local.

---

## 2. Configuración de Variables de Entorno (`.env`)

1. Copie la plantilla `.env.example` a `.env` en la raíz del proyecto:
   ```bash
   cp .env.example .env
   ```
2. Edite `.env` y defina valores seguros y únicos para producción:
   - `POSTGRES_USER=postgres`
   - `POSTGRES_PASSWORD=<clave_robusta_postgresql>`
   - `POSTGRES_DB=porware_cai`
   - `DATABASE_URL="postgresql://postgres:<clave_robusta_postgresql>@postgres:5432/porware_cai?schema=public"`
   - `JWT_SECRET=<cadena_hex_64_caracteres>` (generar con `openssl rand -hex 32`; mínimo 32 caracteres y sin palabras de plantilla como `"reemplazar"`, `"CambiarClave"` o `"changeme"`)
   - `QR_HMAC_SECRET=<cadena_hex_64_caracteres>` (generar con `openssl rand -hex 32`; sin textos de plantilla)
   - `CORS_ORIGINS="https://cai.empresa.local,https://localhost"`
   - `INITIAL_ADMIN_CEDULA="V-10000001"`
   - `INITIAL_ADMIN_EMAIL="admin@porware.com"`
   - `INITIAL_ADMIN_PASSWORD=<clave_inicial_admin>` (mínimo 12 caracteres, sin textos de plantilla)
   - `INITIAL_SECURITY_CEDULA="V-20000002"`
   - `INITIAL_SECURITY_EMAIL="garita@porware.com"`
   - `INITIAL_SECURITY_PASSWORD=<clave_inicial_garita>` (opcional; mínimo 12 caracteres si se define)

> [!IMPORTANT]
> El backend y el seed validan los secretos al arrancar y **abortan el inicio** si `JWT_SECRET`, `QR_HMAC_SECRET`, `POSTGRES_PASSWORD` o `INITIAL_ADMIN_PASSWORD` contienen textos de plantilla (`reemplazar`, `CambiarClave`, `changeme`) o si no cumplen la longitud mínima (`JWT_SECRET >= 32` caracteres, `INITIAL_ADMIN_PASSWORD >= 12` caracteres).

---

## 3. Generación de Certificados TLS (Sin Versionarlos en Git)

Los certificados se alojan en `./nginx/certs/cai.crt` y `./nginx/certs/cai.key` (excluidos por `.gitignore`).

- **En Linux / macOS**:
  ```bash
  chmod +x scripts/generate-ssl-certs.sh
  ./scripts/generate-ssl-certs.sh cai.empresa.local
  ```
- **En Windows (PowerShell / CMD)**:
  ```cmd
  scripts\generate-ssl-certs.bat cai.empresa.local
  ```

---

## 4. Despliegue de Producción (`docker-compose.prod.yml`)

1. Construir las imágenes y levantar los servicios en segundo plano:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
2. Verificar el arranque del contenedor `porware_cai_api_prod`:
   ```bash
   docker logs -f porware_cai_api_prod
   ```
   Al iniciar, el contenedor ejecuta automáticamente:
   - `npx prisma migrate deploy` (aplica las migraciones versionadas en `prisma/migrations/`).
   - `node dist/prisma/seed.js` (crea de forma idempotente el usuario `ADMINISTRADOR` inicial con `INITIAL_ADMIN_CEDULA` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` y, si está definida `INITIAL_SECURITY_PASSWORD`, el usuario `SEGURIDAD` con `INITIAL_SECURITY_CEDULA` / `INITIAL_SECURITY_EMAIL`, ambos con `debeCambiarClave: true` y `registroCompletado: true`, sin requerir `usuarios.csv` y sin sobrescribir contraseñas existentes).
   - `node dist/main` (levanta la API NestJS en el puerto interno `3000`).
3. Verificar los endpoints de salud del sistema (`@Public()`):
   - **Liveness (`GET /api/v1/health/live`)**: usado por el `HEALTHCHECK` del `Dockerfile`. Comprueba únicamente que el proceso HTTP de NestJS responde (`200 OK`), sin consultar PostgreSQL, evitando reinicios en cascada del contenedor durante mantenimientos breves de base de datos.
     ```bash
     curl -k https://localhost/api/v1/health/live
     ```
   - **Readiness / Estado Completo (`GET /api/v1/health`)**: ejecuta `SELECT 1` contra PostgreSQL y devuelve `200 OK` (`"database": "conectado"`) o `503 Service Unavailable` (`"database": "desconectado"`) si la base de datos falla.
     ```bash
     curl -k https://localhost/api/v1/health
     ```
4. Primer ingreso:
   - Abra `https://localhost` (o el dominio configurado).
   - Inicie sesión con `V-10000001` (o `admin@porware.com`, según `INITIAL_ADMIN_CEDULA` / `INITIAL_ADMIN_EMAIL`) y la contraseña definida en `INITIAL_ADMIN_PASSWORD`.
   - El sistema mostrará la pantalla obligatoria de **Cambio de Contraseña** antes de habilitar cualquier módulo.

---

## 4.1. Adopción de Migraciones en una Base de Datos Existente (Creada con `prisma db push`)

Si la base de datos de un entorno existente fue inicializada previamente con `prisma db push` y ya contiene las tablas del esquema inicial, marque la migración inicial como aplicada antes de ejecutar `prisma migrate deploy`:

```bash
# 1. Marcar la migración inicial como ya aplicada sin recrear tablas existentes
npx prisma migrate resolve --applied 20261029000000_init

# 2. Aplicar cualquier migración posterior (p. ej. módulo de Eventos)
npx prisma migrate deploy

# 3. Verificar que el estado de migraciones esté sincronizado
npx prisma migrate status
```

---

## 5. Ejecución de Pruebas y Verificación Local (Sin Docker)

Para compilar y ejecutar las pruebas automáticas de permisos RBAC, firma QR HMAC-SHA256, anti-passback y baja lógica:

```bash
# 1. Instalar dependencias de forma determinista
npm ci
npm --prefix frontend ci

# 2. Verificar tipado y linter en backend y frontend
npm run lint
npm --prefix frontend run lint

# 3. Compilar backend (NestJS + seed JS) y frontend (Vite + TypeScript)
npm run build
npm --prefix frontend run build

# 4. Ejecutar suite de pruebas automáticas (13 tests)
npm test
```

---

## 6. Procedimiento de Rollback en Producción

En caso de que una actualización presente problemas:

1. **Generar respaldo preventivo antes de cada despliegue**:
   ```bash
   ./scripts/backup.sh porware_cai_db_prod 30
   ```
2. **Revertir a la versión estable anterior del código**:
   ```bash
   git checkout <commit_estable_anterior>
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. **Restaurar base de datos (solo si la migración afectó datos)**:
   ```bash
   ./scripts/restore.sh ./backups/porware_cai_YYYYMMDD_HHMMSS.sql.gz porware_cai_db_prod
   ```
