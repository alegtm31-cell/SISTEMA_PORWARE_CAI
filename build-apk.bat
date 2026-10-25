@echo off
setlocal
echo ============================================
echo   Compilando Aplicacion CAI Control (APK)
echo ============================================

REM 1. Configurar JAVA_HOME si no esta en el entorno
if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    )
)

REM 2. Compilar Frontend Web
echo [1/3] Compilando frontend web (Vite)...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo Error al compilar el frontend.
    pause
    exit /b %errorlevel%
)

REM 3. Sincronizar con Capacitor Android
echo [2/3] Sincronizando con Capacitor Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error al sincronizar con Capacitor.
    pause
    exit /b %errorlevel%
)

REM 4. Compilar APK con Gradle
echo [3/3] Compilando APK Debug con Gradle...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo Error al compilar el APK.
    pause
    exit /b %errorlevel%
)

echo ============================================
echo   APK generado con exito en:
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================

REM 5. Instalar automaticamente si hay un emulador o celular conectado por ADB
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if exist "%ADB%" (
    "%ADB%" get-state >nul 2>&1
    if %errorlevel% equ 0 (
        echo Dispositivo/Emulador detectado. Instalando APK...
        "%ADB%" install -r "app\build\outputs\apk\debug\app-debug.apk"
        echo Aplicacion instalada correctamente!
    )
)

echo Proceso finalizado.
pause
