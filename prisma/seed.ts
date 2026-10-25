import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import csv = require('csv-parser');

const prisma = new PrismaClient();

interface CsvUserRow {
  cedula?: string;
  ci?: string;
  rut?: string;
  id?: string;
  nombre?: string;
  first_name?: string;
  apellido?: string;
  last_name?: string;
  email?: string;
  correo?: string;
  password?: string;
  clave?: string;
  contrasena?: string;
  pass?: string;
  rol?: string;
  role?: string;
  tipo?: string;
  [key: string]: string | undefined;
}

/**
 * Normaliza el rol del usuario a los roles admitidos por Prisma (ADMINISTRADOR, EMPLEADO, SEGURIDAD)
 */
function normalizeRole(rawRole?: string): Role {
  if (!rawRole) return Role.EMPLEADO;
  const upper = rawRole.toUpperCase().trim();
  if (upper.includes('ADMIN') || upper === '1') {
    return Role.ADMINISTRADOR;
  }
  if (upper.includes('SEGURIDAD') || upper.includes('GUARD') || upper.includes('VIGILANTE') || upper === '3') {
    return Role.SEGURIDAD;
  }
  return Role.EMPLEADO;
}

/**
 * Procesa e inserta usuarios desde un archivo CSV con Bcrypt
 */
async function migrateUsersFromCsv(csvFilePath: string): Promise<number> {
  console.log(`\n📂 Leyendo archivo CSV desde: ${csvFilePath}`);

  return new Promise((resolve, reject) => {
    const rows: CsvUserRow[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CsvUserRow) => rows.push(data))
      .on('end', async () => {
        try {
          console.log(`📊 Total de filas detectadas en CSV: ${rows.length}`);
          let processed = 0;

          for (const row of rows) {
            // Manejar variaciones comunes de nombres de columnas en bases de datos MySQL antiguas
            const cedula = (row.cedula || row.ci || row.rut || row.id || '').trim();
            if (!cedula) {
              console.warn(`⚠️ Saltando fila sin cédula/identificación:`, row);
              continue;
            }

            const nombre = (row.nombre || row.first_name || 'Sin Nombre').trim();
            const apellido = (row.apellido || row.last_name || 'Sin Apellido').trim();
            const email = (row.email || row.correo || `${cedula}@cai.local`).trim().toLowerCase();
            const rawPassword = (row.password || row.clave || row.contrasena || row.pass || '123456').trim();
            const rol = normalizeRole(row.rol || row.role || row.tipo);

            // Cifrar clave con Bcrypt si no está previamente hasheada
            const isAlreadyBcrypt = rawPassword.startsWith('$2a$') || rawPassword.startsWith('$2b$') || rawPassword.startsWith('$2y$');
            const hashedPassword = isAlreadyBcrypt ? rawPassword : await bcrypt.hash(rawPassword, 10);

            // Upsert para idempotencia (permite ejecutar el seed varias veces sin duplicar)
            await prisma.usuario.upsert({
              where: { cedula },
              update: {
                nombre,
                apellido,
                email,
                password: hashedPassword,
                rol,
              },
              create: {
                cedula,
                nombre,
                apellido,
                email,
                password: hashedPassword,
                rol,
              },
            });

            processed++;
            console.log(`✅ [${processed}/${rows.length}] Usuario migrado: ${cedula} - ${nombre} ${apellido} (${rol})`);
          }

          resolve(processed);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('🚀 Iniciando script de migración y siembra (Seed)...');

  // Posibles rutas donde puede estar el archivo CSV
  const possiblePaths = [
    path.join(__dirname, 'data', 'usuarios.csv'),
    path.join(__dirname, 'usuarios.csv'),
    path.join(process.cwd(), 'usuarios.csv'),
  ];

  let selectedPath = possiblePaths.find((p) => fs.existsSync(p));

  if (!selectedPath) {
    console.warn('⚠️ No se encontró un archivo usuarios.csv en las rutas predeterminadas.');
    console.log('📌 Se esperaba en alguna de estas ubicaciones:');
    possiblePaths.forEach((p) => console.log(`   - ${p}`));
    console.log('\n💡 Creando un usuario administrador por defecto...');

    const defaultAdminPass = await bcrypt.hash('admin123', 10);
    await prisma.usuario.upsert({
      where: { cedula: 'V-00000000' },
      update: {},
      create: {
        cedula: 'V-00000000',
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@cai.local',
        password: defaultAdminPass,
        rol: Role.ADMINISTRADOR,
      },
    });
    console.log('✅ Usuario Administrador creado: admin@cai.local / clave: admin123');
    return;
  }

  const totalMigrated = await migrateUsersFromCsv(selectedPath);
  console.log(`\n🎉 Migración de usuarios completada con éxito. Total: ${totalMigrated} usuarios.`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
