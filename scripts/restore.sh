#!/bin/sh
set -e

if [ -z "$1" ]; then
    echo "❌ Error: Debe especificar el archivo a restaurar."
    echo "Uso: ./restore.sh ./backups/cai_db_backup_XXXXXXXX_XXXXXX.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ El archivo especificado no existe: $BACKUP_FILE"
    exit 1
fi

echo "=== INICIANDO RESTAURACIÓN DE BASE DE DATOS CAI ==="
echo "Archivo: $BACKUP_FILE"
echo "⚠️  Esta operación sobrescribirá los datos actuales en cai_db."

if command -v docker > /dev/null 2>&1; then
    gunzip -c "$BACKUP_FILE" | docker exec -i cai_postgres psql -U postgres -d cai_db
else
    gunzip -c "$BACKUP_FILE" | psql -U "${POSTGRES_USER:-postgres}" -h "${DB_HOST:-localhost}" -d "${POSTGRES_DB:-cai_db}"
fi

echo "✅ Restauración finalizada con éxito."
