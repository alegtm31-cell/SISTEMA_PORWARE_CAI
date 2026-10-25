#!/bin/sh
set -e

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/cai_db_backup_$TIMESTAMP.sql.gz"

echo "=== INICIANDO RESPALDO DE BASE DE DATOS CAI ==="
echo "Timestamp: $TIMESTAMP"

if command -v docker > /dev/null 2>&1; then
    docker exec -t cai_postgres pg_dump -U postgres cai_db | gzip > "$FILENAME"
else
    pg_dump -U "${POSTGRES_USER:-postgres}" -h "${DB_HOST:-localhost}" "${POSTGRES_DB:-cai_db}" | gzip > "$FILENAME"
fi

if [ -f "$FILENAME" ] && [ -s "$FILENAME" ]; then
    echo "✅ Respaldo generado con éxito: $FILENAME"
    ls -lh "$FILENAME"
else
    echo "❌ Error al generar respaldo de la base de datos."
    exit 1
fi
