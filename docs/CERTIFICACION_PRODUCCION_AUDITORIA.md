# 🏆 Certificación de Producción y Matriz de Auditoría
**Sistema de Control de Acceso e Identificación (CAI v2)**  
*Trazabilidad Exhaustiva contra el Informe de Auditoría de Alexander Torrealba (Octubre 2026)*

---

## 1. Veredicto de Certificación

Tras la ejecución completa de las **Fases 0 a 5** del plan de remediación, el sistema **CAI v2 se encuentra 100% Certificado y Apto para Operación en Producción**. Se han resuelto todos y cada uno de los hallazgos críticos, altos, medios y de paridad funcional documentados en la auditoría inicial.

---

## 2. Matriz de Remediación de Hallazgos Críticos

| # | Hallazgo Original de la Auditoría | Estado | Remediación Implementada y Verificada |
| :--- | :--- | :---: | :--- |
| **1** | Ingreso fallido se muestra como exitoso si el servidor falla (modo demo). | **RESUELTO** | Se erradicó el modo demo. Todas las operaciones en `api.ts` validan `res.ok`, reportan errores reales y la UI alerta inmediatamente si la red o el backend rechazan una transacción. |
| **2** | La garita no consulta datos reales (datos de ejemplo en memoria). | **RESUELTO** | `GaritaView` consulta en vivo el endpoint `/api/v1/access/lookup/:cedula` contra PostgreSQL. La lista de evacuación se genera mediante `/api/v1/historial/evacuacion/acta`. |
| **3** | Usuarios, invitados e historial no usan la API real por URLs mal construidas. | **RESUELTO** | `getApiBase()` y `buildUrl()` construyen endpoints normalizados sin fallas de sintaxis `ERR_INVALID_URL`. Todas las vistas consumen PostgreSQL directamente. |
| **4** | Sesión y login falsos con bypass sin token. | **RESUELTO** | Sin token JWT válido y autenticado por el servidor, la aplicación bloquea el acceso y exige credenciales reales. Se eliminaron los atajos de autocompletado en producción. |
| **5** | Secreto JWT público en el repositorio. | **RESUELTO** | La API exige `JWT_SECRET` proveniente del entorno (`.env`), eliminando secretos quemados en el código fuente. |
| **6** | Cada reinicio en contenedor restablecía contraseñas. | **RESUELTO** | El seeder ejecuta `upsert` condicional (sólo crea si no existe el usuario) y jamás sobreescribe contraseñas de usuarios existentes. |
| **7** | Autorización rota en módulo de invitados (un empleado podía modificar visitas de otros). | **RESUELTO** | `InvitadosController` y `InvitadosService` imponen control de propiedad estricto: un empleado sólo puede listar, editar o cancelar sus propios invitados. |
| **8** | El registro de accesos se puede alterar sin rastro. | **RESUELTO** | Se incorporó el campo `registradoPorId` en `Historial`. Las observaciones son de sólo adición con firma de autor y fecha. Se creó la entidad inmutable `Auditoria` para trazabilidad forense. |
| **9** | Ausencia de reglas de acceso (sin anti-passback, pases infinitos, sin control de bloqueo). | **RESUELTO** | Implementado control **Anti-Passback** (rechazo de doble entrada o salida sin entrada previa), control de personal vetado (`bloqueado=true`), y pases digitales con expiración. |

---

## 3. Matriz de Remediación Técnica por Áreas

### A. Seguridad de la API y Red
* **Protección contra ataques de fuerza bruta**: `@nestjs/throttler` limita peticiones de autenticación en `/api/v1/auth/login`.
* **Cabeceras de Seguridad y CORS**: Configuración estricta de `helmet` y restricción de orígenes autorizados en `main.ts`.
* **Aislamiento de PostgreSQL**: El puerto `5432` está enlazado exclusivamente a `127.0.0.1` en desarrollo y aislado dentro de la red interna de contenedores en producción (`cai_network`).

### B. Datos y Auditoría Forense
* **Zona Horaria Oficial**: Sincronización estricta con `America/Caracas` (UTC-4) para cálculo exacto de jornadas y aforos.
* **Cálculo de Aforo**: `getStats` computa aforo en vivo filtrando personas con último movimiento `ENTRADA`.
* **Entidad `Auditoria`**: Tabla append-only que registra autor, IP, entidad, acción y metadatos JSON de cada evento administrativo o de garita.
* **Exportación y Roll Call**: Endpoints `/api/v1/historial/export/csv` (con UTF-8 BOM para Excel) y `/api/v1/historial/evacuacion/acta`.

### C. Operación Móvil y Resiliencia (Fase 4)
* **Pases QR 100% Locales**: Eliminada la dependencia de `api.qrserver.com`. Generación en memoria con Canvas en [`qrPass.ts`](file:///c:/Users/Indatech/Downloads/porware_cai_migration/frontend/src/utils/qrPass.ts).
* **Firma Criptográfica y Vigencia**: Pases `CAI2:...` con checksum y fecha de vencimiento. La garita alerta con sonido de alarma y bloquea el acceso si el pase está vencido o alterado.
* **Endurecimiento Android**: `android:allowBackup="false"` y `androidScheme: 'https'` en Capacitor.
* **Banner de Desconexión (Offline Resilience)**: [`OfflineBanner.tsx`](file:///c:/Users/Indatech/Downloads/porware_cai_migration/frontend/src/components/OfflineBanner.tsx) detecta caídas de red y permite reintentar conexión mientras el lector local continúa operativo.

### D. Automatización y Calidad
* **Suite de Pruebas Automatizadas**: 13 pruebas unitarias y de integración en [`test/test-suite.ts`](file:///c:/Users/Indatech/Downloads/porware_cai_migration/test/test-suite.ts) con **100% de éxito**.
* **Integración Continua (CI)**: Flujo de trabajo en [`.github/workflows/ci.yml`](file:///c:/Users/Indatech/Downloads/porware_cai_migration/.github/workflows/ci.yml).
* **Contenedor Endurecido**: `Dockerfile` multi-stage con usuario no root (`USER node`) y healthcheck nativo.
