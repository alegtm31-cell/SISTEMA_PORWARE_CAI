#!/usr/bin/env bash
# ==============================================================================
# Generador de Certificados TLS con SAN (Subject Alternative Name) para Nginx
# Uso: ./scripts/generate-ssl-certs.sh [dominio] [--force]
# Genera: nginx/certs/cai.crt y nginx/certs/cai.key
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-localhost}"
FORCE="${2:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$DIR/../nginx/certs"

mkdir -p "$CERTS_DIR"

if [ -f "$CERTS_DIR/cai.key" ] && [ -f "$CERTS_DIR/cai.crt" ] && [ "$FORCE" != "--force" ]; then
    echo "ℹ️ Los certificados TLS ya existen en nginx/certs/ (use --force para regenerar)."
    exit 0
fi

SAN_LIST="DNS:localhost,IP:127.0.0.1"
if [ "$DOMAIN" != "localhost" ]; then
    SAN_LIST="DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1"
fi

echo "🔐 Generando certificados TLS para Nginx en nginx/certs/ (Dominio: ${DOMAIN}, SAN: ${SAN_LIST})..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/cai.key" \
    -out "$CERTS_DIR/cai.crt" \
    -subj "/CN=${DOMAIN}/O=Porware CAI/OU=Seguridad" \
    -addext "subjectAltName=${SAN_LIST}"

chmod 600 "$CERTS_DIR/cai.key"
chmod 644 "$CERTS_DIR/cai.crt"

echo "✅ Certificados TLS generados exitosamente en nginx/certs/cai.crt y nginx/certs/cai.key"
