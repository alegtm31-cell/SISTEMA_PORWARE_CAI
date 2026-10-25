@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo [ERROR] Debe indicar la ruta del archivo de respaldo a restaurar.
    echo Uso: restore.bat ..\backups\cai_db_backup_XXXXXXXX_XXXXXX.sql
    exit /b 1
)

set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo [ERROR] El archivo especificado no existe: %BACKUP_FILE%
    exit /b 1
)

echo ===================================================
echo     RESTAURACION DE BASE DE DATOS CAI
echo ===================================================
echo Archivo a restaurar: %BACKUP_FILE%
echo.
echo ATENCION: Esta accion sobrescribira los datos existentes en cai_db.
set /p CONFIRM="Desea continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Restauracion cancelada por el usuario.
    exit /b 0
)

echo Restaurando base de datos PostgreSQL...
type "%BACKUP_FILE%" | docker exec -i cai_postgres psql -U postgres -d cai_db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Base de datos restaurada exitosamente desde: %BACKUP_FILE%
) else (
    echo.
    echo [ERROR] Ocurrio un error durante la restauracion.
    exit /b 1
)
