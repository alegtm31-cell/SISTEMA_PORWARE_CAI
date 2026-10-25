@echo off
setlocal

set "SSL_DIR=%~dp0\..\nginx\ssl"

if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

if exist "%SSL_DIR%\server.key" (
    if exist "%SSL_DIR%\server.crt" (
        echo [INFO] Los certificados SSL ya existen en nginx\ssl.
        exit /b 0
    )
)

echo [INFO] Generando certificados SSL locales para Nginx...

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

"%OPENSSL_CMD%" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "%SSL_DIR%\server.key" -out "%SSL_DIR%\server.crt" -subj "/CN=localhost/O=CAI/OU=Garita"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Certificados SSL generados exitosamente en nginx\ssl\
) else (
    echo [ERROR] Fallo la generacion de certificados SSL.
    exit /b 1
)
