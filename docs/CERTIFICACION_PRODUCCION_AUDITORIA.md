# Certificación Técnica de Producción y Auditoría — Sistema PORWARE CAI

**Repositorio**: `https://github.com/alegtm31-cell/SISTEMA_PORWARE_CAI.git`  
**Stack Verificado**: NestJS 10 + Prisma 5.22.0 + PostgreSQL 16 + Node 22 LTS | React 19 + Vite + TypeScript + Capacitor Android

---

## 1. Matriz de Permisos por Rol (Verificada en 3 Capas)

Las reglas de acceso por rol están aplicadas de forma uniforme en **Menú (`Sidebar.tsx` / `MobileNav.tsx`)**, **Enrutado en memoria (`App.tsx`)** y **Guardias del Backend (`@Roles` + `RolesGuard` + verificación de propiedad en servicios)**:

| Rol | Pantallas Permitidas (Frontend) | Endpoints Permitidos (Backend `/api/v1`) | Endpoints Expresamente Prohibidos (`403 Forbidden`) |
| :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** (`ADMINISTRADOR`) | Dashboard, Control Garita, Visitas/Invitados, Bitácora de Accesos, Usuarios & Personal, Cartelera Informativa (lectura y edición), Ajustes | Todos los endpoints de `/auth/*`, `/access/*`, `/historial/*`, `/invitados/*`, `/users/*`, `/noticias/*` (incluyendo `POST`, `PATCH`, `DELETE`), `/auditoria`. | Bloqueado en todos los endpoints (salvo `/auth/change-password` y `/auth/logout`) mientras `debeCambiarClave === true`. |
| **VIGILANTE** (`SEGURIDAD`) | Control Garita (escáner QR/cédula + lista de personas dentro), Ajustes mínimos (tema visual y cerrar sesión) | `POST /auth/login`, `POST /auth/change-password`, `POST /auth/logout`, `GET /auth/profile`, `GET /access/lookup/:cedula`, `POST /access/check-in`, `POST /access/check-out`, `GET /historial/dentro`. | `GET /historial`, `GET /historial/stats`, `GET /historial/export/csv`, `GET /historial/evacuacion/acta`, `GET /historial/persona/:idOrCedula`, `PATCH /historial/:id/observacion`, `/invitados/*`, `/users/*`, `/noticias/*`, `/auditoria`. |
| **PROPIETARIO** (`EMPLEADO`) | Visitas/Invitados (solo sus propios invitados), Cartelera Informativa (solo lectura), Ajustes (tema, perfil propio y cerrar sesión) | `POST /auth/login`, `POST /auth/change-password`, `POST /auth/logout`, `GET /auth/profile`, `PATCH /auth/profile`, `POST /invitados`, `GET /invitados/mis-invitados`, `GET /invitados/:id` (propio), `POST /invitados/:id/pase` (propio), `PATCH /invitados/:id` (propio), `DELETE /invitados/:id` (propio), `GET /noticias`, `GET /noticias/:id`. | `/access/*`, `/historial/*` (incluyendo `/dentro`, `/stats`, `/export/csv`, `/evacuacion/acta`), `/users/*`, `GET /invitados` (listado general), `PATCH /invitados/:id/bloquear`, `POST/PATCH/DELETE /noticias`, `/auditoria`, e invitados de otros propietarios (`403`). |

---

## 2. Hallazgos Críticos Corregidos y Estado Real en Código

### A) Autenticación Real sin Atajos ni Modo Demo (`LoginView.tsx`)
- Eliminados `handleQuickAdminLogin`, el botón de acceso rápido de administrador y cualquier bypass local por identificador (`admin`, `admin@cai.local`, `V-00000000`) o por caída del backend.
- El único flujo de inicio de sesión es `POST /api/v1/auth/login` con validación de credenciales contra PostgreSQL y emisión de JWT firmado.

### B) Cliente API sin Datos Falsos ni Fallbacks Locales (`frontend/src/services/api.ts`)
- Eliminados `DEFAULT_USERS`, `DEFAULT_GUESTS`, `DEFAULT_NOTICIAS`, todas las claves `cai_local_*` y todos los bloques `catch` que simulaban respuestas exitosas (`{ success: true, localMode: true }`).
- Todas las peticiones validan `res.ok` y propagan el mensaje real devuelto por el servidor (`403` acceso vetado/no autorizado, `400` violación anti-passback, `404` no encontrado, o error de red).
- Ante respuestas `401 Unauthorized`, el cliente limpia la sesión y dispara el evento global `cai:unauthorized`, cerrando la sesión y redirigiendo inmediatamente a `LoginView`.
- `registerAccess` **jamás** reproduce sonido de confirmación ni muestra mensaje de éxito si el servidor no respondió con confirmación HTTP `200`/`201`.

### C) Cola Offline Real en IndexedDB (`frontend/src/services/offlineQueue.ts`)
- Cuando ocurre un fallo de red real durante el registro en garita, el movimiento se almacena en la base de datos local **IndexedDB** (`cai_offline_db`, almacén `pending_movements`) con estado `PENDING`.
- La interfaz muestra una alerta prominente: **"PENDIENTE DE SINCRONIZAR — Los movimientos en esta cola NO están confirmados hasta que el servidor los valide"**.
- Al restablecerse la red (evento `online` o botón **"Sincronizar Ahora"**), `api.syncOfflineQueue()` envía cada movimiento al backend. Si el servidor lo rechaza (`400` anti-passback o `403` vetado/expirado), el ítem pasa a estado `REJECTED` mostrando el motivo exacto del servidor para que el operador lo revise o descarte.

### D) Cambio Obligatorio de Contraseña (`debeCambiarClave`)
- En el backend, `JwtStrategy` incluye `debeCambiarClave` en `req.user`, y tanto `JwtAuthGuard` como `RolesGuard` rechazan con `403 Forbidden` (`code: 'CAMBIO_CLAVE_REQUERIDO'`) cualquier petición a endpoints que no tengan el decorador `@AllowPasswordChange()` (`POST /api/v1/auth/change-password` y `POST /api/v1/auth/logout`).
- En el frontend (`App.tsx`), si `user.debeCambiarClave === true`, se bloquea toda navegación y se muestra únicamente el formulario de cambio obligatorio de contraseña.

### E) Dashboard Real y Exclusivo para Administrador (`DashboardView.tsx`)
- Oculto y bloqueado para `SEGURIDAD` y `EMPLEADO`.
- Eliminados todos los widgets estáticos de demostración (puertos LED ficticios, porcentajes fijos de CPU/RAM/Storage, seriales de ejemplo y archivos `dashboard-fortinet.html`).
- Muestra métricas reales de `GET /api/v1/historial/stats`, `GET /api/v1/historial`, `GET /api/v1/historial/dentro` y telemetría real del proceso backend y PostgreSQL desde `GET /api/v1/health`.

### F) Pases QR Firmados con HMAC-SHA256 en el Backend (`src/common/utils/qr-pass.util.ts`)
- Ningún secreto criptográfico reside en el bundle del frontend (`frontend/src/utils/qrPass.ts` solo renderiza la imagen QR a partir del token devuelto por el servidor).
- La firma `CAI2:<payload_base64url>.<hmac_sha256>` se genera y verifica con comparación en tiempo constante (`crypto.timingSafeEqual`) en el backend, vinculada a un registro en la tabla `Visita` con `fechaExpiracion` y `estado` (`AUTORIZADA`, `COMPLETADA`, `CANCELADA`).

### G) Trazabilidad de Autor en Auditoría y Baja Lógica de Invitados
- Todas las operaciones sensibles (bloqueo/desbloqueo de usuarios e invitados, eliminación de usuarios, emisión de pases QR, cambio obligatorio de clave y edición de notas en bitácora) registran el `usuarioId` del autor en la tabla `Auditoria`.
- `DELETE /api/v1/invitados/:id` verifica si el visitante posee registros en `Historial`: si tiene movimientos previos, aplica **baja lógica** (`eliminado: true`) y cancela sus visitas pendientes sin borrar físicamente la evidencia histórica.

### H) Endurecimiento de Producción, Migraciones, Android y CI
- **Node 22 LTS** configurado en `Dockerfile`, `frontend/Dockerfile.prod` y `.github/workflows/ci.yml`.
- **Prisma `5.22.0`** fijado en `package.json` y `Dockerfile`.
- **Migraciones versionadas**: creada migración inicial `prisma/migrations/20261029000000_init/migration.sql` y reemplazado `prisma db push` por `npx prisma migrate deploy` (con procedimiento documentado de adopción vía `npx prisma migrate resolve --applied 20261029000000_init` y verificación con `npx prisma migrate status`).
- **Seed compilado a JS e idempotente**: `npm run build` compila `prisma/seed.ts` a `dist/prisma/seed.js`, ejecutado en producción con `node dist/prisma/seed.js` sin requerir `ts-node` ni `usuarios.csv`. Crea siempre el administrador inicial (`INITIAL_ADMIN_CEDULA` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`, por defecto `V-10000001` / `admin@porware.com`) y, si se define `INITIAL_SECURITY_PASSWORD`, el vigilante inicial (`INITIAL_SECURITY_CEDULA` / `INITIAL_SECURITY_EMAIL`, por defecto `V-20000002` / `garita@porware.com`), ambos con `debeCambiarClave: true` y `registroCompletado: true`, sin sobrescribir contraseñas existentes.
- **Rechazo de secretos de plantilla al arrancar**: el backend (`src/main.ts`) y el seed verifican que `JWT_SECRET`, `QR_HMAC_SECRET`, `POSTGRES_PASSWORD` e `INITIAL_ADMIN_PASSWORD` no contengan textos de ejemplo (`reemplazar`, `CambiarClave`, `changeme`) y cumplan longitudes mínimas (`JWT_SECRET >= 32`, `INITIAL_ADMIN_PASSWORD >= 12`).
- **Healthchecks separados (`@Public()`)**: `GET /api/v1/health/live` responde `200 OK` sin consultar la base de datos (usado en `HEALTHCHECK` de Docker) y `GET /api/v1/health` comprueba PostgreSQL devolviendo `503 Service Unavailable` si la base de datos no responde.
- **Certificados TLS unificados con SAN**: `scripts/generate-ssl-certs.sh` y `scripts/generate-ssl-certs.bat` generan `nginx/certs/cai.crt` y `nginx/certs/cai.key` aceptando el dominio como argumento e incluyendo `subjectAltName` para el dominio indicado y `localhost`.
- **Android HTTPS estricto**: eliminado `cleartext: true` en `frontend/capacitor.config.ts` y configurado `android:usesCleartextTraffic="false"` en `frontend/android/app/src/main/AndroidManifest.xml`.

---

## 3. Verificaciones Pendientes del Entorno de Despliegue

Por transparencia técnica, se deja constancia de los puntos que dependen del servidor físico/host de despliegue:
1. **Ejecución en vivo de contenedores Docker y `pg_dump` / `psql`**: En la estación donde se realizó la preparación del código no se encontraba activo el demonio de Docker ni una instancia local de PostgreSQL en el puerto `5432`. La compilación de backend (`npm run build`), compilación de frontend (`npm --prefix frontend run build`), linter (`npm run lint` y `npm --prefix frontend run lint`) y la suite de 13 pruebas automáticas (`npm test`) fueron ejecutadas y verificadas localmente con éxito. El levantamiento de `docker-compose.prod.yml` y la prueba en vivo de `scripts/backup.sh` + `scripts/restore.sh` deben ejecutarse en el host Docker de destino siguiendo el Runbook.
