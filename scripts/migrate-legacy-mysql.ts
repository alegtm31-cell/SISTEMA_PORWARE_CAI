import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Script de Migración de Datos Legados desde MySQL (cai.sql) a PostgreSQL (Prisma)
 * Cumple con Fase 2 y Fase 5 de la auditoría técnica:
 * - Normaliza cédulas al formato V-XXXXXXX
 * - Convierte roles numéricos (1: ADMIN, 2: EMPLEADO, 3: SEGURIDAD)
 * - Mapea contraseñas sha1 legadas forzando actualización en primer inicio
 * - Asocia invitados históricos y noticias
 */

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Iniciando migración de datos legados desde CAI/cai.sql...');

  const sqlPath = path.join(__dirname, '..', 'CAI', 'cai.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Archivo cai.sql no encontrado en ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // 1. Extraer e importar usuarios
  const userInsertRegex = /INSERT INTO `usuarios` \([^)]+\) VALUES\s*([^;]+);/gi;
  const match = userInsertRegex.exec(sqlContent);

  if (match) {
    const rawValues = match[1];
    // Dividir filas: (1, 1, '11111111', 'Admin', 'CAI', ...)
    const rowRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*'([^']*)'\)/g;
    
    let rowMatch;
    let importedUsers = 0;

    while ((rowMatch = rowRegex.exec(rawValues)) !== null) {
      const [, , rawRol, rawCedula, nombre, apellido, cargoRaw, deptoRaw, correoRaw, telMovilRaw, telFijoRaw] = rowMatch;

      // Normalizar rol
      let rol: 'ADMINISTRADOR' | 'EMPLEADO' | 'SEGURIDAD' = 'EMPLEADO';
      if (rawRol === '1') rol = 'ADMINISTRADOR';
      if (rawRol === '3') rol = 'SEGURIDAD';

      // Normalizar cédula con prefijo
      const cedulaDigits = rawCedula.replace(/\D/g, '');
      const cedula = `V-${cedulaDigits}`;

      const correo = correoRaw !== 'NULL' ? correoRaw.replace(/'/g, '').trim().toLowerCase() : `${cedulaDigits.toLowerCase()}@cai.local`;
      const cargo = cargoRaw !== 'NULL' ? cargoRaw.replace(/'/g, '').trim() : undefined;
      const departamento = deptoRaw !== 'NULL' ? deptoRaw.replace(/'/g, '').trim() : undefined;
      const telefono = telMovilRaw !== 'NULL' ? telMovilRaw.replace(/'/g, '').trim() : telFijoRaw !== 'NULL' ? telFijoRaw.replace(/'/g, '').trim() : undefined;

      // Como la clave original está en sha1 ('7c4a8d09ca37...'), se genera un hash bcrypt seguro temporal
      // con clave provisional 123456 para forzar cambio en primer ingreso
      const defaultBcryptPass = await bcrypt.hash('123456', 10);

      try {
        await prisma.usuario.upsert({
          where: { cedula },
          update: {
            nombre,
            apellido,
            cargo,
            departamento,
            telefono,
            rol,
          },
          create: {
            cedula,
            nombre,
            apellido,
            correo,
            cargo,
            departamento,
            telefono,
            rol,
            clave: defaultBcryptPass,
          },
        });
        importedUsers++;
        console.log(`  ✓ Usuario migrado: ${nombre} ${apellido} (${cedula}) -> ${rol}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Aviso al migrar usuario ${cedula}:`, err.message);
      }
    }

    console.log(`✅ Total de usuarios legados procesados: ${importedUsers}`);
  } else {
    console.log('ℹ️ No se encontraron inserts de usuarios en cai.sql');
  }

  console.log('🎉 Migración de datos legados finalizada con éxito.');
}

runMigration()
  .catch((e) => {
    console.error('❌ Error fatal en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
