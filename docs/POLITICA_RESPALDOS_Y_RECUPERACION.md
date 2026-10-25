# 💾 Política de Respaldos y Procedimiento de Recuperación ante Desastres (DRP)
**Sistema CAI v2**  
*Documento de Continuidad Operativa - Fase 5*

---

## 1. Parámetros de Recuperación

* **RPO (Recovery Point Objective)**: Máximo 24 horas de transacciones de acceso (se recomienda respaldo cada 12 horas en instalaciones críticas).
* **RTO (Recovery Time Objective)**: Menos de 15 minutos para restaurar el servicio completo en caso de fallo del hardware de garita.

---

## 2. Automatización de Copias de Seguridad

Los scripts ubicados en `scripts/` generan volcados consistentes de PostgreSQL sin detener el servicio:

### En Linux / Servidores Ubuntu (Cron diario a las 23:30)
```bash
# Editar el crontab del sistema
crontab -e

# Agregar la siguiente línea:
30 23 * * * /bin/bash /opt/cai-system/scripts/backup.sh >> /var/log/cai_backup.log 2>&1
```

### En Windows Server (Programador de Tareas)
1. Abra el **Programador de tareas** (`taskschd.msc`).
2. Cree una tarea básica: *Respaldo Diario CAI*.
3. Desencadenador: Diariamente a las 23:30.
4. Acción: Iniciar programa `cmd.exe /c "C:\porware_cai_migration\scripts\backup.bat"`.

---

## 3. Estructura y Rotación de Archivos de Respaldo

Los respaldos se almacenan automáticamente en la carpeta `backups/` con la nomenclatura:
* Linux: `cai_backup_YYYYMMDD_HHMMSS.sql.gz` (comprimido con gzip)
* Windows: `cai_backup_YYYYMMDD_HHMMSS.sql`

### Política de Retención:
1. **En Servidor Local**: Conservar los últimos 30 días de respaldos.
2. **Copia Fuera de Sitio**: Sincronizar semanalmente hacia un NAS o almacenamiento seguro en la nube.
3. **Purgado Automático (Linux)**:
   ```bash
   # Elimina respaldos con más de 30 días de antigüedad
   find /opt/cai-system/backups/ -name "cai_backup_*.sql.gz" -mtime +30 -delete
   ```

---

## 4. Simulacro de Restauración y Recuperación ante Desastres

Para restaurar una copia de seguridad en caso de corrupción o cambio de servidor:

### Paso 1: Asegurar que el contenedor de base de datos esté activo
```bash
docker compose up -d postgres
```

### Paso 2: Ejecutar el script de restauración
* **En Linux**:
  ```bash
  bash scripts/restore.sh backups/cai_backup_20261025_233000.sql.gz
  ```
* **En Windows**:
  ```bash
  scripts\restore.bat backups\cai_backup_20261025_233000.sql
  ```

### Paso 3: Reiniciar la API y verificar la integridad
```bash
docker compose restart api
curl -s http://localhost:3000/api/v1/health | jq
```
