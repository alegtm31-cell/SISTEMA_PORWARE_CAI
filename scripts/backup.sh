#!/usr/bin/env bash
# ==============================================================================
# Script de Respaldo Automatizado con Rotación - Porware CAI PostgreSQL
# Uso: ./scripts/backup.sh [nombre_contenedor] [dias_retencion]
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="${1:-${POSTGRES_CONTAINER:-porware_cai_db_prod}}"
RETENTION_DAYS="${2:-30}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-porware_cai}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/porware_cai_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Si el contenedor de producción no está activo, intentar con el contenedor de desarrollo
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^porware_cai_db$"; then
    CONTAINER_NAME="porware_cai_db"
  else
    echo "❌ Error: No se encontró el contenedor PostgreSQL activo (${CONTAINER_NAME} ni porware_cai_db)."
    exit 1
  fi
fi

echo "📦 Iniciando respaldo de la base de datos '${DB_NAME}' desde '${CONTAINER_NAME}'..."

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ ! -s "${BACKUP_FILE}" ]; then
  rm -f "${BACKUP_FILE}"
  echo "❌ Error: El archivo de respaldo generado está vacío."
  exit 1
fi

echo "✅ Respaldo completado exitosamente: ${BACKUP_FILE}"

# Rotación automática de respaldos antiguos
echo "🧹 Aplicando política de rotación (eliminando respaldos mayores a ${RETENTION_DAYS} días)..."
find "${BACKUP_DIR}" -name "porware_cai_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -name "porware_cai_*.sql" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "✅ Proceso de respaldo y rotación finalizado."
