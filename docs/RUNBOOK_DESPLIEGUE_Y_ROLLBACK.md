# 🚀 Runbook de Despliegue, Actualización y Rollback
**Sistema de Control de Acceso e Identificación (CAI v2)**  
*Documento Operativo de Puesta en Producción - Fase 5*

---

## 1. Requisitos Previos del Servidor de Garita / Datacenter

| Componente | Requisito Mínimo Recomendado |
| :--- | :--- |
| **Sistema Operativo** | Ubuntu Server 22.04/24.04 LTS, Debian 12 o Windows Server 2022 |
| **Motor de Contenedores** | Docker Engine 24.0+ y Docker Compose v2.20+ |
| **Hardware** | 2 vCPU, 4 GB Memoria RAM, 40 GB Almacenamiento SSD |
| **Red** | IP Estática en LAN de Garita (ej. `192.168.10.8`), puertos `80` (HTTP) y `443` (HTTPS) abiertos en firewall local |
| **Certificados TLS** | Certificados SSL/TLS válidos o autofirmados de confianza para garita colocados en `nginx/certs/` |

---

## 2. Configuración de Entorno de Producción (`.env`)

Cree o valide el archivo `.env` en la raíz del proyecto. **Nunca utilice valores por defecto en producción**:

```env
# URL de conexión interna a PostgreSQL (red aislada de Docker)
DATABASE_URL="postgresql://cai_admin:ClaveSeguraProd2026!@postgres:5432/cai_prod_db?schema=public"

# Puerto interno del API
PORT=3000

# Secreto de firma JWT (mínimo 64 caracteres criptográficamente seguros)
JWT_SECRET="cai_prod_jwt_super_secret_key_8f3b2a9e1d0c4b5a6f7e8d9c0b1a2e3f4"
JWT_EXPIRATION="8h"

# Zona horaria del servidor
TZ="America/Caracas"
```

---

## 3. Procedimiento de Primer Despliegue (Go-Live)

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/alegtm31-cell/SISTEMA_PORWARE_CAI.git /opt/cai-system
   cd /opt/cai-system
   ```

2. **Copiar y configurar variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Construir y levantar la infraestructura en producción**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verificar estado de los contenedores**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   *Debe mostrar los 3 servicios en estado saludable (`healthy` o `Up`):*
   * `cai_postgres`
   * `cai_api_prod`
   * `cai_nginx_prod`

5. **Verificación de Salud (Healthcheck)**:
   ```bash
   curl -i http://localhost/api/v1/health
   ```
   *Respuesta esperada (HTTP 200 OK):*
   ```json
   {
     "status": "ok",
     "service": "porware-cai-backend",
     "version": "2.0.0",
     "timestamp": "2026-10-25T...",
     "database": { "status": "connected", "latencyMs": 4 },
     "memory": { "rssMb": 85.2, "heapUsedMb": 42.1 }
   }
   ```

---

## 4. Procedimiento de Actualización de Versión

Para aplicar parches o actualizaciones sin pérdida de datos en producción:

1. **Crear un respaldo preventivo obligatorio**:
   ```bash
   # En Linux:
   bash scripts/backup.sh
   # En Windows:
   scripts\backup.bat
   ```

2. **Descargar los últimos cambios**:
   ```bash
   git pull origin main
   ```

3. **Reconstruir y desplegar los contenedores sin tiempo de inactividad de datos**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Confirmar logs y ausencia de errores**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f cai_api_prod
   ```

---

## 5. Procedimiento de Reversión Inmediata (Rollback)

Si una versión presenta fallos críticos en garita:

1. **Identificar el commit estable anterior**:
   ```bash
   git log --oneline -n 5
   ```

2. **Revertir el código al commit estable (ejemplo `f5b09dd`)**:
   ```bash
   git checkout f5b09dd
   ```

3. **Reconstruir los contenedores con la versión anterior**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Si la base de datos sufrió alteraciones incompatibles, restaurar el respaldo previo**:
   ```bash
   # En Linux:
   bash scripts/restore.sh backups/cai_backup_YYYYMMDD_HHMMSS.sql.gz
   # En Windows:
   scripts\restore.bat backups\cai_backup_YYYYMMDD_HHMMSS.sql
   ```

5. **Validar funcionamiento**:
   Acceda a `http://192.168.10.8` y verifique la pantalla de garita y el endpoint `/api/v1/health`.
