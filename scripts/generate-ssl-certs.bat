@echo off
REM ==============================================================================
REM Generador de Certificados TLS con SAN (Subject Alternative Name) para Nginx
REM Uso: scripts\generate-ssl-certs.bat [dominio] [--force]
REM Genera: nginx\certs\cai.crt y nginx\certs\cai.key
REM ==============================================================================
setlocal

set "DOMAIN=%~1"
if "%DOMAIN%"=="" set "DOMAIN=localhost"
set "FORCE=%~2"

set "CERTS_DIR=%~dp0..\nginx\certs"

if not exist "%CERTS_DIR%" mkdir "%CERTS_DIR%"

if exist "%CERTS_DIR%\cai.key" (
    if exist "%CERTS_DIR%\cai.crt" (
        if not "%FORCE%"=="--force" (
            echo [INFO] Los certificados TLS ya existen en nginx\certs\ ^(use --force para regenerar^).
            exit /b 0
        )
    )
)

set "SAN_LIST=DNS:localhost,IP:127.0.0.1"
if /I not "%DOMAIN%"=="localhost" (
    set "SAN_LIST=DNS:%DOMAIN%,DNS:localhost,IP:127.0.0.1"
)

echo [INFO] Generando certificados TLS para Nginx en nginx\certs\ (Dominio: %DOMAIN%)...

where openssl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "OPENSSL_CMD=openssl"
) else if exist "C:\Program Files\Git\usr\bin\openssl.exe" (
    set "OPENSSL_CMD=C:\Program Files\Git\usr\bin\openssl.exe"
) else (
    echo [ERROR] No se encontro OpenSSL en el sistema.
    echo Instale OpenSSL o utilice Git for Windows.
    exit /b 1
)

"%OPENSSL_CMD%" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "%CERTS_DIR%\cai.key" -out "%CERTS_DIR%\cai.crt" -subj "/CN=%DOMAIN%/O=Porware CAI/OU=Seguridad" -addext "subjectAltName=%SAN_LIST%"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Certificados TLS generados exitosamente en nginx\certs\cai.crt y nginx\certs\cai.key
) else (
    echo [ERROR] Fallo la generacion de certificados TLS.
    exit /b 1
)
