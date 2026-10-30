@echo off
REM ==============================================================================
REM Script de Restauracion de Base de Datos - Porware CAI PostgreSQL (Windows)
REM Uso: scripts\restore.bat backups\porware_cai_YYYYMMDD_HHMMSS.sql [contenedor]
REM ==============================================================================

if "%~1"=="" (
    echo [ERROR] Debe especificar la ruta del archivo de respaldo .sql
    echo Uso: scripts\restore.bat backups\porware_cai_YYYYMMDD_HHMMSS.sql [nombre_contenedor]
    exit /b 1
)

set BACKUP_FILE=%~1
set CONTAINER_NAME=%2
if "%CONTAINER_NAME%"=="" set CONTAINER_NAME=porware_cai_db_prod
set DB_USER=postgres
set DB_NAME=porware_cai

if not exist "%BACKUP_FILE%" (
    echo [ERROR] El archivo "%BACKUP_FILE%" no existe.
    exit /b 1
)

echo Restaurando base de datos %DB_NAME% desde %BACKUP_FILE%...
type "%BACKUP_FILE%" | docker exec -i %CONTAINER_NAME% psql -v ON_ERROR_STOP=1 -U %DB_USER% -d %DB_NAME% 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Contenedor %CONTAINER_NAME% no disponible, intentando con porware_cai_db...
    type "%BACKUP_FILE%" | docker exec -i porware_cai_db psql -v ON_ERROR_STOP=1 -U %DB_USER% -d %DB_NAME%
)

if %ERRORLEVEL% EQU 0 (
    echo [OK] Restauracion completada exitosamente.
) else (
    echo [ERROR] Ocurrio un fallo durante la restauracion. Verifique que Docker PostgreSQL este activo.
    exit /b 1
)
