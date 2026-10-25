@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     RESPALDO AUTOMATIZADO DE BASE DE DATOS CAI
echo ===================================================

set BACKUP_DIR=..\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set FILENAME=%BACKUP_DIR%\cai_db_backup_%TIMESTAMP%.sql

echo Generando volcado de PostgreSQL cai_db...
docker exec -t cai_postgres pg_dump -U postgres cai_db > "%FILENAME%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Respaldo generado con exito: %FILENAME%
    for %%F in ("%FILENAME%") do echo Tamano del archivo: %%~zF bytes
) else (
    echo.
    echo [ERROR] No se pudo generar el respaldo de la base de datos.
    exit /b 1
)

echo ===================================================
