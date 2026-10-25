# Sistema CAI - Backend Migrado a NestJS + Prisma

Backend modular desarrollado con **NestJS**, **Prisma ORM**, **PostgreSQL** y **JWT** para el control de acceso, gestión de personal, visitantes, auditoría y cartelera informativa.

---

### 🐳 Opción A: Despliegue con Docker (Recomendado)
Levanta tanto PostgreSQL como la API con un único comando:
```bash
docker compose up --build
```
> El contenedor se encarga automáticamente de inicializar las tablas de la base de datos con Prisma y correr el seed de usuarios desde `prisma/data/usuarios.csv`.

### 💻 Opción B: Ejecución Local
1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Variables de Entorno (`.env`)**:
   Copia `.env.example` a `.env` y configura tus variables:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cai_db?schema=public"
   PORT=3000
   JWT_SECRET="cai_jwt_secret_key_porware_migration_2026"
   JWT_EXPIRATION="24h"
   ```

3. **Migración de Base de Datos**:
   ```bash
   npx prisma db push
   ```

4. **Semilla / Migración de Usuarios desde CSV**:
   Ejecuta el script de seed para importar usuarios automáticamente desde `prisma/data/usuarios.csv` con claves hasheadas mediante Bcrypt:
   ```bash
   npm run seed
   ```

5. **Iniciar la API Backend en modo desarrollo**:
   ```bash
   npm run start:dev
   ```

6. **Iniciar la Aplicación Web Frontend (Dashboard & Garita)**:
   ```bash
   npm run frontend:dev
   ```
   > Abre tu navegador en **`http://localhost:5173`** para acceder a la terminal de garita, métricas de aforo en vivo, directorio de personal y gestión de visitas.


---

## 📖 Documentación Interactiva Swagger (OpenAPI)
Al iniciar la aplicación, puedes acceder a la interfaz interactiva de Swagger para probar todos los endpoints y autenticarte en tiempo real:
* **URL:** `http://localhost:3000/api/docs`
* **Autenticación en Swagger:** Haz clic en el botón `Authorize`, e ingresa el token JWT generado por `/api/v1/auth/login`.

---

## 📚 Arquitectura y Endpoints


### 🔐 1. Autenticación (`/api/v1/auth`)
* `POST /api/v1/auth/login` (Público): Inicia sesión por cédula o correo electrónico. Retorna token JWT y rol.
* `GET /api/v1/auth/profile` (Autenticado): Obtiene el perfil del usuario actualmente autenticado.

### 🛡️ 2. Control de Acceso (`/api/v1/access`)
* `POST /api/v1/access/check-in` (`ADMINISTRADOR`, `SEGURIDAD`): Registra entrada admitiendo tanto **UUID** como **Cédula** (identificación de empleado o visitante) y observación opcional.
* `POST /api/v1/access/check-out` (`ADMINISTRADOR`, `SEGURIDAD`): Registra salida admitiendo **UUID** o **Cédula** con observación opcional.

### 👥 3. Gestión de Usuarios y Personal (`/api/v1/users`)
* `GET /api/v1/users` (`ADMINISTRADOR`): Lista usuarios con filtros por nombre/cédula/correo y rol con conteo de registros.
* `GET /api/v1/users/:id` (`ADMINISTRADOR`, `SEGURIDAD`): Detalle del usuario, historial de accesos y visitas creadas.
* `POST /api/v1/users` (`ADMINISTRADOR`): Crea un nuevo usuario con clave cifrada.
* `PATCH /api/v1/users/:id` (`ADMINISTRADOR`): Modifica datos, rol o contraseña de un usuario.
* `DELETE /api/v1/users/:id` (`ADMINISTRADOR`): Elimina un usuario.

### 🎫 4. Gestión de Invitados y Visitas (`/api/v1/invitados`)
* `POST /api/v1/invitados` (`EMPLEADO`, `SEGURIDAD`, `ADMINISTRADOR`): Registra una visita. Si es empleado, se asocia automáticamente a su usuario.
* `GET /api/v1/invitados` (`ADMINISTRADOR`, `SEGURIDAD`): Lista todos los visitantes con búsqueda por cédula, nombre o empresa.
* `GET /api/v1/invitados/mis-invitados` (`EMPLEADO`): Permite al empleado consultar sus propias visitas programadas.
* `GET /api/v1/invitados/:id`: Detalle del invitado y su empleado anfitrión.
* `PATCH /api/v1/invitados/:id`: Actualiza datos de la visita.
* `DELETE /api/v1/invitados/:id` (`ADMINISTRADOR`): Elimina el registro del invitado.

### 📊 5. Historial y Reportes de Auditoría (`/api/v1/historial`)
* `GET /api/v1/historial` (`ADMINISTRADOR`, `SEGURIDAD`): Consulta registros con filtros por rango de fechas (`startDate`, `endDate`), tipo (`ENTRADA`/`SALIDA`), término de búsqueda y tipo de persona.
* `GET /api/v1/historial/stats` (`ADMINISTRADOR`, `SEGURIDAD`): Métricas en tiempo real: total de entradas hoy, salidas hoy, estimación de personas actualmente dentro de las instalaciones y últimos movimientos.
* `GET /api/v1/historial/persona/:idOrCedula` (`ADMINISTRADOR`, `SEGURIDAD`): Consulta la bitácora completa de accesos de una persona en particular.
* `PATCH /api/v1/historial/:id/observacion`: Añade o edita una nota/observación sobre un acceso.

### 📢 6. Cartelera y Noticias (`/api/v1/noticias`)
* `GET /api/v1/noticias` (Autenticado): Lista comunicados y avisos institucionales.
* `GET /api/v1/noticias/:id`: Detalle de una noticia.
* `POST /api/v1/noticias` (`ADMINISTRADOR`): Publica una noticia.
* `PATCH /api/v1/noticias/:id` (`ADMINISTRADOR`): Edita una noticia.
* `DELETE /api/v1/noticias/:id` (`ADMINISTRADOR`): Elimina una noticia.

---

## 🔒 Roles y Seguridad
* **ADMINISTRADOR**: Acceso total al sistema, auditoría, gestión de usuarios, visitas y publicaciones.
* **SEGURIDAD**: Acceso a garita para check-in, check-out, búsqueda rápida de personas por cédula, consulta de estadísticas de aforo e historial.
* **EMPLEADO**: Acceso a su perfil, registro y consulta de sus propios invitados, lectura de noticias institucionales.

---

## 📚 Documentación Operativa y Manuales de Producción (Fase 5)
El sistema cuenta con manuales operativos completos en el directorio [`docs/`](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs):

1. **[Runbook de Despliegue, Actualización y Rollback](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs/RUNBOOK_DESPLIEGUE_Y_ROLLBACK.md)**: Guía paso a paso para despliegue en servidor de garita con Docker Compose de producción, Nginx TLS y procedimientos de contingencia.
2. **[Manual Operativo de Garita](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs/MANUAL_OPERATIVO_GARITA.md)**: Manual para guardias de seguridad sobre el uso de la pistola láser USB, lectura de carnet, pases QR firmados `CAI2:...`, detección de pases vencidos o vetados y protocolo de evacuación.
3. **[Política de Respaldos y Recuperación ante Desastres (DRP)](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs/POLITICA_RESPALDOS_Y_RECUPERACION.md)**: Plan de continuidad operativa, automatización con cron / programador de tareas y recuperación probada.
4. **[Guía de Migración de Datos Legados](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs/GUIA_MIGRACION_DATOS_PHP_MYSQL.md)**: Procedimiento de importación desde el sistema PHP 5.6 / MySQL (`cai.sql`) con normalización de cédulas y actualización de contraseñas.
5. **[Certificación de Producción y Matriz de Auditoría](file:///c:/Users/Indatech/Downloads/porware_cai_migration/docs/CERTIFICACION_PRODUCCION_AUDITORIA.md)**: Matriz de verificación exhaustiva que subsana los hallazgos de la auditoría técnica de Alexander Torrealba.

---

## 🧪 Pruebas Automatizadas y Compilación de APK
* **Ejecutar Suite de Pruebas (13/13 Pruebas Automatizadas)**:
  ```bash
  npm test
  ```
* **Compilar APK Móvil para Garita / PDAs**:
  ```bash
  npm run apk:build
  # O en Linux: bash scripts/build-apk.sh
  ```

