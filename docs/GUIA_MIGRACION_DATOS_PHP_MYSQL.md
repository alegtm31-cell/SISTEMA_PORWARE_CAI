# 🗄️ Guía de Migración de Datos Legados (PHP 5.6 / MySQL a NestJS / PostgreSQL)
**Sistema CAI v2**  
*Documento de Transición de Datos - Fase 5*

---

## 1. Contexto del Sistema Original

El sistema legado utilizaba MySQL 5.6 con almacenamiento en tablas `usuarios`, `invitados` y `noticias`:
* **Claves débiles**: Las contraseñas estaban almacenadas con el algoritmo `sha1` sin salt (ej. el administrador por defecto tenía clave `123456` con hash `7c4a8d09ca3762af61e59520943dc26494f8941b`).
* **Cédulas sin formato**: Almacenadas como cadenas de 8 dígitos sin prefijo (ej. `11111111`).
* **Roles numéricos**: `1` (Administrador), `2` (Empleado), `3` (Seguridad).

---

## 2. Estrategia de Migración y Normalización

1. **Normalización de Cédulas**: Todas las cédulas se convierten automáticamente al estándar nacional con prefijo `V-` (ej. `11111111` pasa a `V-11111111`).
2. **Transformación Criptográfica de Claves**:
   * Debido a que `sha1` es matemáticamente irreversible a texto plano, no es posible derivar el hash `bcrypt` directamente del hash `sha1`.
   * El importador asigna a cada cuenta migrada una clave provisional cifrada con `bcrypt` (10 salt rounds) con valor por defecto `123456`, requiriendo al usuario cambiar su clave en el primer inicio de sesión mediante la pantalla de *Mi Perfil*.
3. **Mapeo de Roles**:
   * `1` ➔ `ADMINISTRADOR`
   * `2` ➔ `EMPLEADO`
   * `3` ➔ `SEGURIDAD`

---

## 3. Ejecución del Importador Automatizado

El proyecto incluye el script especializado `scripts/migrate-legacy-mysql.ts`:

```bash
# Ejecutar migración de datos legados
npm run migrate:legacy
```

### Flujo de Ejecución:
1. Lee y analiza el archivo `CAI/cai.sql`.
2. Extrae las tuplas de usuarios legados.
3. Ejecuta `prisma.usuario.upsert` preservando nombres, apellidos, teléfonos, cargos y departamentos.
4. Conecta el usuario administrador migrado con permisos globales.
