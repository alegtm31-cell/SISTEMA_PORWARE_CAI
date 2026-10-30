import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('csv-parser');

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
            const cedula = (row.cedula || row.ci || row.rut || row.id || '').trim();
            if (!cedula) {
              console.warn(`⚠️ Saltando fila sin cédula/identificación:`, row);
              continue;
            }

            const nombre = (row.nombre || row.first_name || 'Sin Nombre').trim();
            const apellido = (row.apellido || row.last_name || 'Sin Apellido').trim();
            const email = (row.email || row.correo || `${cedula}@cai.local`).trim().toLowerCase();
            const rol = normalizeRole(row.rol || row.role || row.tipo);

            let initialPassword = '';
            let registroCompletado = false;
            let debeCambiarClave = true;

            if (rol === Role.ADMINISTRADOR) {
              initialPassword = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
              registroCompletado = true;
              debeCambiarClave = !process.env.INITIAL_ADMIN_PASSWORD;
              if (!process.env.INITIAL_ADMIN_PASSWORD) {
                console.log(`🔑 Contraseña generada para Administrador (${email}): ${initialPassword}`);
              }
            } else if (rol === Role.SEGURIDAD) {
              initialPassword = process.env.INITIAL_SECURITY_PASSWORD || crypto.randomBytes(16).toString('hex');
              registroCompletado = true;
              debeCambiarClave = true;
              if (!process.env.INITIAL_SECURITY_PASSWORD) {
                console.log(`🔑 Contraseña generada para Guardia (${email}): ${initialPassword}`);
              }
            } else {
              // EMPLEADO: Se genera hash inaccesible temporal. Debe realizar auto-registro (/auth/complete-registro)
              initialPassword = crypto.randomBytes(32).toString('hex');
              registroCompletado = false;
              debeCambiarClave = false;
            }

            const hashedPassword = await bcrypt.hash(initialPassword, 10);

            await prisma.usuario.upsert({
              where: { cedula },
              update: {
                nombre,
                apellido,
                email,
                rol,
              },
              create: {
                cedula,
                nombre,
                apellido,
                email,
                password: hashedPassword,
                rol,
                registroCompletado,
                debeCambiarClave,
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
      .on('error', (err: Error) => reject(err));
  });
}

async function ensureBootstrapAdmin() {
  const adminCount = await prisma.usuario.count({
    where: { rol: Role.ADMINISTRADOR },
  });

  if (adminCount > 0) {
    console.log(`ℹ️ Ya existe al menos un usuario ADMINISTRADOR registrado (${adminCount}).`);
    return;
  }

  const initialAdminPass = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
  const defaultAdminPass = await bcrypt.hash(initialAdminPass, 10);

  await prisma.usuario.upsert({
    where: { cedula: 'V-00000000' },
    update: {},
    create: {
      cedula: 'V-00000000',
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@cai.local',
      password: defaultAdminPass,
      rol: Role.ADMINISTRADOR,
      registroCompletado: true,
      debeCambiarClave: !process.env.INITIAL_ADMIN_PASSWORD,
    },
  });

  console.log(`✅ Usuario Administrador inicial creado: admin@cai.local (V-00000000)`);
  if (!process.env.INITIAL_ADMIN_PASSWORD) {
    console.log(`🔑 Clave temporal generada para Administrador: ${initialAdminPass}`);
  }
}

async function main() {
  console.log('🚀 Iniciando script de siembra y aprovisionamiento (Seed)...');

  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'data', 'usuarios.csv'),
    path.join(process.cwd(), 'usuarios.csv'),
    path.join(__dirname, 'data', 'usuarios.csv'),
    path.join(__dirname, 'usuarios.csv'),
  ];

  const selectedPath = possiblePaths.find((p) => fs.existsSync(p));

  if (selectedPath && process.env.SEED_SKIP_CSV !== 'true') {
    const totalMigrated = await migrateUsersFromCsv(selectedPath);
    console.log(`\n🎉 Migración de usuarios desde CSV completada. Total: ${totalMigrated} usuarios.`);
  } else {
    console.log('ℹ️ Sin archivo CSV de migración o migración omitida. Verificando administrador inicial...');
  }

  // Garantizar siempre que exista al menos un ADMINISTRADOR operativo
  await ensureBootstrapAdmin();
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
