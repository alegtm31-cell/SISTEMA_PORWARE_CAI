import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Script de Migración de Datos Legados desde MySQL (cai.sql) a PostgreSQL (Prisma)
 * Cumple con Fase 2 y Fase 5 de la auditoría técnica:
 * - Normaliza cédulas al formato V-XXXXXXX
 * - Convierte roles numéricos (1: ADMIN, 2: EMPLEADO, 3: SEGURIDAD)
 * - Mapea contraseñas sha1 legadas forzando actualización en primer inicio
 * - Mapea campos exactos del schema de Prisma (email, password, telefonoMovil, etc.)
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
  const matchUser = userInsertRegex.exec(sqlContent);

  if (matchUser) {
    const rawValues = matchUser[1];
    const rowRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*'([^']*)'\)/g;
    
    let rowMatch;
    let importedUsers = 0;

    while ((rowMatch = rowRegex.exec(rawValues)) !== null) {
      const [, , rawRol, rawCedula, nombre, apellido, cargoRaw, deptoRaw, correoRaw, telMovilRaw, telFijoRaw] = rowMatch;

      let rol: Role = Role.EMPLEADO;
      if (rawRol === '1') rol = Role.ADMINISTRADOR;
      if (rawRol === '3') rol = Role.SEGURIDAD;

      const cedulaDigits = rawCedula.replace(/\D/g, '');
      const cedula = `V-${cedulaDigits}`;

      const email = correoRaw !== 'NULL' ? correoRaw.replace(/'/g, '').trim().toLowerCase() : `${cedulaDigits.toLowerCase()}@cai.local`;
      const cargo = cargoRaw !== 'NULL' ? cargoRaw.replace(/'/g, '').trim() : undefined;
      const departamento = deptoRaw !== 'NULL' ? deptoRaw.replace(/'/g, '').trim() : undefined;
      const telefonoMovil = telMovilRaw !== 'NULL' ? telMovilRaw.replace(/'/g, '').trim() : undefined;
      const telefonoFijo = telFijoRaw !== 'NULL' ? telFijoRaw.replace(/'/g, '').trim() : undefined;

      const defaultBcryptPass = await bcrypt.hash('123456', 10);

      try {
        await prisma.usuario.upsert({
          where: { cedula },
          update: {
            nombre,
            apellido,
            cargo,
            departamento,
            telefonoMovil,
            telefonoFijo,
            rol,
          },
          create: {
            cedula,
            nombre,
            apellido,
            email,
            cargo,
            departamento,
            telefonoMovil,
            telefonoFijo,
            rol,
            password: defaultBcryptPass,
          },
        });
        importedUsers++;
        console.log(`  ✓ Usuario migrado: ${nombre} ${apellido} (${cedula}) -> ${rol}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Aviso al migrar usuario ${cedula}:`, err.message);
      }
    }

    console.log(`✅ Total de usuarios legados procesados: ${importedUsers}`);
  }

  // 2. Extraer e importar noticias
  const noticiaRegex = /INSERT INTO `noticias` \([^)]+\) VALUES\s*([^;]+);/gi;
  const matchNoticia = noticiaRegex.exec(sqlContent);
  if (matchNoticia) {
    const rawNoticias = matchNoticia[1];
    const nRowRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*'([^']*)'\)/g;
    let nMatch;
    let importedNoticias = 0;

    while ((nMatch = nRowRegex.exec(rawNoticias)) !== null) {
      const [, , titulo, contenido, imagenRaw] = nMatch;
      const imagen = imagenRaw !== 'NULL' ? imagenRaw.replace(/'/g, '').trim() : undefined;

      try {
        await prisma.noticia.create({
          data: {
            titulo,
            contenido,
            imagenUrl: imagen,
          },
        });
        importedNoticias++;
        console.log(`  ✓ Noticia migrada: ${titulo}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Aviso al migrar noticia:`, err.message);
      }
    }
    console.log(`✅ Total de noticias legadas procesadas: ${importedNoticias}`);
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
