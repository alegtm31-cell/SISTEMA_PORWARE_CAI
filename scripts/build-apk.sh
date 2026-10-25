#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$DIR/../frontend"

echo "========================================================"
echo " Compilador Automatizado de APK CAI v2 (Android)"
echo "========================================================"

cd "$FRONTEND_DIR"

echo "[1/3] Compilando bundle de produccion (Vite + TypeScript)..."
npm run build

echo "[2/3] Sincronizando recursos con Capacitor Android..."
npx cap sync android

echo "[3/3] Compilando APK con Gradle Wrapper..."
cd android
chmod +x gradlew
./gradlew assembleDebug assembleRelease

echo "========================================================"
echo " Compilacion Completada con Exito"
echo "========================================================"
echo "APK de depuracion (instalable directo en PDAs):"
echo "  frontend/android/app/build/outputs/apk/debug/app-debug.apk"
echo "APK de lanzamiento para firma de produccion:"
echo "  frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk"
echo "========================================================"
