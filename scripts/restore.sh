#!/usr/bin/env bash
# ==============================================================================
# Script de Restauración de Base de Datos - Porware CAI PostgreSQL
# Uso: ./scripts/restore.sh ./backups/porware_cai_YYYYMMDD_HHMMSS.sql.gz [contenedor]
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "❌ Error: Debe especificar la ruta del archivo de respaldo (.sql o .sql.gz)."
  echo "Uso: ./scripts/restore.sh ./backups/porware_cai_YYYYMMDD_HHMMSS.sql.gz [nombre_contenedor]"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${2:-${POSTGRES_CONTAINER:-porware_cai_db_prod}}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-porware_cai}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: El archivo '${BACKUP_FILE}' no existe."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^porware_cai_db$"; then
    CONTAINER_NAME="porware_cai_db"
  else
    echo "❌ Error: No se encontró el contenedor PostgreSQL activo (${CONTAINER_NAME} ni porware_cai_db)."
    exit 1
  fi
fi

echo "⚠️  Restaurando base de datos '${DB_NAME}' en '${CONTAINER_NAME}' desde '${BACKUP_FILE}'..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}"
else
  cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "✅ Restauración completada exitosamente."
