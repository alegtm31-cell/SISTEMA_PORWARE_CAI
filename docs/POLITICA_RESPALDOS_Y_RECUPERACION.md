# Política de Respaldos, Rotación y Recuperación — Sistema PORWARE CAI

## 1. Arquitectura de Respaldos

El servicio PostgreSQL 16 (`porware_cai_db_prod` en producción o `porware_cai_db` en desarrollo) almacena sus datos en un volumen Docker persistente y monta el directorio `./backups` del host para resguardar volcados lógicos completos (`pg_dump --clean --if-exists`).

---

## 2. Ejecución de Respaldo (`backup`)

### En Linux / macOS:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh porware_cai_db_prod 30
```
- Genera un archivo comprimido `./backups/porware_cai_YYYYMMDD_HHMMSS.sql.gz`.
- Verifica que el archivo generado no esté vacío.
- Ejecuta automáticamente la rotación eliminando respaldos con antigüedad superior a **30 días** (o el número de días indicado como segundo parámetro).

### En Windows:
```cmd
scripts\backup.bat porware_cai_db_prod 30
```
- Genera `./backups/porware_cai_YYYYMMDD_HHMMSS.sql` y aplica la limpieza de archivos con más de 30 días mediante `forfiles`.

---

## 3. Programación Automática de Respaldos y Rotación

### Cron en Servidor Linux (Diario a las 02:00 AM con retención de 30 días):
Agregue la siguiente línea ejecutando `crontab -e`:
```cron
0 2 * * * cd /opt/porware_cai_migration && ./scripts/backup.sh porware_cai_db_prod 30 >> /var/log/porware_cai_backup.log 2>&1
```

### Programador de Tareas en Windows:
```cmd
schtasks /create /tn "PorwareCAI_Backup_Diario" /tr "C:\ruta\porware_cai_migration\scripts\backup.bat porware_cai_db_prod 30" /sc daily /st 02:00 /ru SYSTEM
```

---

## 4. Restauración y Prueba de Recuperación (`restore`)

Para restaurar un respaldo en el contenedor PostgreSQL activo:

### En Linux / macOS:
```bash
chmod +x scripts/restore.sh
./scripts/restore.sh ./backups/porware_cai_YYYYMMDD_HHMMSS.sql.gz porware_cai_db_prod
```

### En Windows:
```cmd
scripts\restore.bat backups\porware_cai_YYYYMMDD_HHMMSS.sql porware_cai_db_prod
```

### Verificación Posterior a la Restauración:
1. Comprobar que el endpoint de salud responde `200 OK`:
   ```bash
   curl -k https://localhost/api/v1/health
   ```
2. Iniciar sesión como `ADMINISTRADOR` y verificar que la Bitácora (`GET /api/v1/historial`) y el Directorio de Usuarios (`GET /api/v1/users`) contienen los registros esperados.
