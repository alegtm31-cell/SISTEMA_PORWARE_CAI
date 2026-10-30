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
   - `JWT_SECRET=<cadena_hex_64_caracteres>` (generar con `openssl rand -hex 32`)
   - `QR_HMAC_SECRET=<cadena_hex_64_caracteres>` (generar con `openssl rand -hex 32`)
   - `CORS_ORIGINS="https://cai.empresa.local,https://localhost"`
   - `INITIAL_ADMIN_PASSWORD=<clave_inicial_admin>`
   - `INITIAL_SECURITY_PASSWORD=<clave_inicial_garita>`

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
   - `node dist/prisma/seed.js` (crea el usuario `ADMINISTRADOR` inicial con `INITIAL_ADMIN_PASSWORD` y `debeCambiarClave: true` si la base de datos aún no tiene administrador).
   - `node dist/main` (levanta la API NestJS en el puerto interno `3000`).
3. Verificar el estado de salud del sistema:
   ```bash
   curl -k https://localhost/api/v1/health
   ```
   Debe responder `"status": "ok"` y `"database": "conectado"`.
4. Primer ingreso:
   - Abra `https://localhost` (o el dominio configurado).
   - Inicie sesión con `V-10000001` (o `admin@porware.com`) y la contraseña definida en `INITIAL_ADMIN_PASSWORD`.
   - El sistema mostrará la pantalla obligatoria de **Cambio de Contraseña** antes de habilitar cualquier módulo.

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
