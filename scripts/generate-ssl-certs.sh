#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$DIR/../nginx/ssl"

mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/server.key" ] && [ -f "$SSL_DIR/server.crt" ]; then
    echo "ℹ️ Los certificados SSL ya existen en nginx/ssl."
    exit 0
fi

echo "🔐 Generando certificados SSL locales para Nginx..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/server.key" \
    -out "$SSL_DIR/server.crt" \
    -subj "/CN=localhost/O=CAI/OU=Garita"

chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

echo "✅ Certificados SSL generados exitosamente en nginx/ssl/"
