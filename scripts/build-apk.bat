@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Compilador Automatizado de APK CAI v2 (Android)
echo ========================================================

cd /d "%~dp0\..\frontend"

echo [1/3] Compilando bundle de produccion (Vite + TypeScript)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la compilacion de frontend.
    exit /b %ERRORLEVEL%
)

echo [2/3] Sincronizando recursos con Capacitor Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo Capacitor sync.
    exit /b %ERRORLEVEL%
)

echo [3/3] Compilando APK con Gradle Wrapper...
cd android
if exist gradlew.bat (
    call gradlew.bat assembleDebug assembleRelease
) else (
    echo [ERROR] gradlew.bat no encontrado en frontend/android.
    exit /b 1
)

echo ========================================================
echo  Compilacion Completada con Exito
echo ========================================================
echo APK de depuracion (instalable directo en PDAs):
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo APK de lanzamiento para firma de produccion:
echo   frontend\android\app\build\outputs\apk\release\app-release-unsigned.apk
echo ========================================================
cd /d "%~dp0\.."
