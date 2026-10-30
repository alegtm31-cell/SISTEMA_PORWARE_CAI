@echo off
REM ==============================================================================
REM Script de Respaldo Automatizado con Rotacion - Porware CAI PostgreSQL (Windows)
REM Uso: scripts\backup.bat [nombre_contenedor] [dias_retencion]
REM ==============================================================================

set CONTAINER_NAME=%1
if "%CONTAINER_NAME%"=="" set CONTAINER_NAME=porware_cai_db_prod
set RETENTION_DAYS=%2
if "%RETENTION_DAYS%"=="" set RETENTION_DAYS=30

set DB_USER=postgres
set DB_NAME=porware_cai
set BACKUP_DIR=backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=%BACKUP_DIR%\porware_cai_%TIMESTAMP%.sql

echo Iniciando respaldo de la base de datos %DB_NAME% desde %CONTAINER_NAME%...

docker exec -i %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% --clean --if-exists > "%BACKUP_FILE%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Contenedor %CONTAINER_NAME% no disponible, intentando con porware_cai_db...
    docker exec -i porware_cai_db pg_dump -U %DB_USER% -d %DB_NAME% --clean --if-exists > "%BACKUP_FILE%"
)

if %ERRORLEVEL% EQU 0 (
    echo [OK] Respaldo completado exitosamente en: %BACKUP_FILE%
    forfiles /p "%BACKUP_DIR%" /s /m porware_cai_*.sql* /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    echo [OK] Politica de rotacion (%RETENTION_DAYS% dias) aplicada.
) else (
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
    echo [ERROR] Fallo al generar el respaldo. Verifique que el contenedor Docker PostgreSQL este en ejecucion.
    exit /b 1
)
