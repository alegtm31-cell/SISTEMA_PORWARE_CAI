# 📋 Informe de Auditoría y Estado de Certificación Técnica
**Sistema de Control de Acceso e Identificación (CAI v2)**  
*Trazabilidad Exhaustiva contra los Hallazgos de Auditoría (Octubre 2026)*

---

## 1. Resumen Ejecutivo y Veredicto Técnico

Tras la remediación exhaustiva de las Fases 0 a 5 y la subsanación de las observaciones de la segunda revisión sobre el commit `8d0151c`, el sistema cuenta con todas las salvaguardas de seguridad, atomicidad y persistencia requeridas para su operación.

### Veredicto: **APTO PARA PRODUCCIÓN (Con Guía de Despliegue Operativo)**
Las vulnerabilidades críticas de código y diseño han sido resueltas en su totalidad. Para el despliegue en entornos productivos, se debe seguir el procedimiento operativo estándar de inyección de certificados TLS y variables de entorno secretas detallado en este documento.

---

## 2. Matriz de Remediación de Hallazgos y Vulnerabilidades

| # | Vulnerabilidad / Hallazgo Reportado | Estado | Implementación Técnica y Verificación |
| :--- | :--- | :---: | :--- |
| **1** | **Clave privada TLS versionada en el repositorio** | **RESUELTO** | `nginx/ssl/server.key` y `server.crt` fueron purgados del control de versiones (`git rm --cached`). Se agregaron reglas a `.gitignore` (`nginx/ssl/`, `*.key`, `*.crt`, `*.pem`). Se incluyeron scripts de generación local (`scripts/generate-ssl-certs.sh` y `.bat`) para desarrollo/homologación, y se documenta el uso de certificados emitidos por CA válida (Let's Encrypt / Vault) en producción. |
| **2** | **Heurística de `yaRegistrado` y contraseñas por defecto** | **RESUELTO** | Se crearon los campos booleanos nativos `registroCompletado` y `debeCambiarClave` en `schema.prisma`. En `usuarios.csv`, `seed.ts` y `migrate-legacy-mysql.ts` se eliminaron contraseñas en texto plano y el valor `123456`. Los empleados pre-registrados tienen hash temporal inaccesible y `registroCompletado: false`, requiriendo completar su cuenta en `/auth/complete-registro`. |
| **3** | **Anti-Passback vulnerable a condiciones de carrera** | **RESUELTO** | `AccessService.registerAccess` ejecuta la verificación de último movimiento y la inserción del historial dentro de `this.prisma.$transaction` con nivel de aislamiento estricto `Serializable` (`Prisma.TransactionIsolationLevel.Serializable`), bloqueando escaneos concurrentes simultáneos en PostgreSQL. |
| **4** | **Límite de peticiones genérico en Login** | **RESUELTO** | Se configuró `@Throttle({ default: { limit: 5, ttl: 60000 } })` específicamente en el endpoint `POST /api/v1/auth/login`, limitando intentos de inicio de sesión a 5 por minuto por IP, protegiendo contra ataques de fuerza bruta dirigidos. |
| **5** | **Suplantación de cuentas y pre-registro no autenticado** | **RESUELTO** | `complete-registro` rechaza cuentas no-EMPLEADO, cuentas con `registroCompletado: true` y cuentas con `bloqueado: true`. `check-preregistro` responde de forma estricta (`disponibleParaRegistro`, `yaRegistrado`, `nombre`) sin filtrar correos ni roles. |
| **6** | **Persistencia de usuarios bloqueados / vetados** | **RESUELTO** | Usuarios con `bloqueado: true` son rechazados en el login (`validateUser`), en la validación continua del JWT (`JwtStrategy.validate`), y en garita al intentar ingresar (`AccessService`). |
| **7** | **Inyección de fórmulas en exportación CSV** | **RESUELTO** | `HistorialService.exportCsv` neutraliza caracteres ejecutables de hojas de cálculo (`=`, `+`, `-`, `@`) prefijándolos con comilla simple (`'`) y delimitando celdas con comillas dobles. |
| **8** | **Aforo discordante en garita** | **RESUELTO** | `HistorialService.getStats` computa aforo en vivo sincronizado mediante `getPersonasDentro()` con consulta SQL de último movimiento (`DISTINCT ON`), unificando `dentroEstimado` con el conteo físico real. |
| **9** | **Modo demo y botones de prueba en frontend** | **RESUELTO** | Se erradicó el modo demo. `api.ts` valida `res.ok`. Se eliminaron botones de simulación o credenciales quemadas en `LoginModal` y `GaritaView`. |

---

## 3. Arquitectura de Red y Configuración de Producción

### Red y Servicios (`docker-compose.prod.yml`)
* **Aislamiento de Base de Datos**: PostgreSQL no expone puertos al host (`ports` omitido). Solo es accesible internamente en la red de Docker por el servicio `api`.
* **Proxy Inverso Nginx**:
  * Redirección HTTP (puerto 80) hacia HTTPS (puerto 443) con código de estado `301 Moved Permanently`.
  * Cabecera HSTS activada (`max-age=31536000; includeSubDomains`).
  * Proxying a la API de NestJS (`http://api:3000`) respetando `X-Forwarded-For` y `X-Forwarded-Proto`.
  * Cabeceras de seguridad estrictas: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`.
* **Variables Obligatorias en Producción**:
  * `JWT_SECRET`: Sin valor por defecto. La API aborta el arranque si no está definida.
  * `POSTGRES_PASSWORD`: Obligatoria tanto en `postgres` como en `api`.
  * `CORS_ORIGINS`: Lista blanca de orígenes HTTPS permitidos.
  * `INITIAL_ADMIN_PASSWORD`: Contraseña inicial del superadministrador (si no se especifica en seed, se genera una aleatoria de 32 caracteres y se imprime en consola).

---

## 4. Procedimiento de Despliegue Seguro

1. **Generación o Instalación de Certificados TLS**:
   * En servidores productivos con dominio público: Utilizar Certbot / Let's Encrypt para ubicar `fullchain.pem` y `privkey.pem` en `/etc/ssl/cai/` (montados como solo lectura en Nginx).
   * En servidores locales / intranet sin conexión exterior:
     ```bash
     bash scripts/generate-ssl-certs.sh
     # o en Windows:
     scripts\generate-ssl-certs.bat
     ```
2. **Configuración del Entorno**:
   Copiar `.env.example` a `.env` y definir valores robustos:
   ```bash
   POSTGRES_PASSWORD=<clave_aleatoria_32_caracteres>
   JWT_SECRET=<secreto_aleatorio_64_caracteres>
   INITIAL_ADMIN_PASSWORD=<clave_inicial_admin>
   CORS_ORIGINS=https://cai.empresa.local
   ```
3. **Inicio de Contenedores**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

---

## 5. Validación Automatizada

La suite de pruebas automatizadas en `test/test-suite.ts` valida los servicios reales (`AuthService`, `AccessService`, `HistorialService`) contra escenarios de seguridad:
* **Anti-Passback**: Rechazo de doble entrada consecutiva y salida sin entrada.
* **Bloqueo Persistido**: Rechazo de usuarios y visitantes vetados.
* **Pre-registro**: Prohibición de registro a no-empleados o cuentas previamente registradas.
* **Sanitización CSV**: Neutralización de comandos `=cmd` y macros.
* **Aforo**: Verificación de conteo matemático exacto.

Resultado de la suite: **100% Satisfactorio**.
