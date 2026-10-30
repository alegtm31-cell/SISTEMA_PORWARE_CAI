import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('csv-parser');

const TEMPLATE_TOKENS = ['reemplazar', 'cambiarclave', 'cambiarporclave', 'changeme'];

export const DEFAULT_INITIAL_ADMIN_CEDULA = 'V-10000001';
export const DEFAULT_INITIAL_ADMIN_EMAIL = 'admin@porware.com';
export const DEFAULT_INITIAL_SECURITY_CEDULA = 'V-20000002';
export const DEFAULT_INITIAL_SECURITY_EMAIL = 'garita@porware.com';

export function validateSeedSecret(value: string | undefined, varName: string, minLength = 12): string {
  if (!value || !value.trim()) {
    throw new Error(`FATAL: ${varName} es obligatoria y no puede estar vacía.`);
  }
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (TEMPLATE_TOKENS.some((t) => lower.includes(t))) {
    throw new Error(
      `FATAL: ${varName} contiene un texto de plantilla ("reemplazar", "CambiarClave" o "changeme"). Defina una clave real.`,
    );
  }
  if (trimmed.length < minLength) {
    throw new Error(`FATAL: ${varName} debe tener al menos ${minLength} caracteres (actual: ${trimmed.length}).`);
  }
  return trimmed;
}

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

async function migrateUsersFromCsv(
  prisma: PrismaClient,
  csvFilePath: string,
  env: NodeJS.ProcessEnv,
): Promise<number> {
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
              continue;
            }

            const existing = await prisma.usuario.findUnique({ where: { cedula } });
            if (existing) {
              processed++;
              continue;
            }

            const nombre = (row.nombre || row.first_name || 'Sin Nombre').trim();
            const apellido = (row.apellido || row.last_name || 'Sin Apellido').trim();
            const email = (row.email || row.correo || `${cedula}@porware.com`).trim().toLowerCase();
            const rol = normalizeRole(row.rol || row.role || row.tipo);

            let initialPassword = '';
            let registroCompletado = false;
            let debeCambiarClave = true;

            if (rol === Role.ADMINISTRADOR) {
              initialPassword = env.INITIAL_ADMIN_PASSWORD
                ? validateSeedSecret(env.INITIAL_ADMIN_PASSWORD, 'INITIAL_ADMIN_PASSWORD', 12)
                : crypto.randomBytes(16).toString('hex');
              registroCompletado = true;
              debeCambiarClave = true;
            } else if (rol === Role.SEGURIDAD) {
              initialPassword = env.INITIAL_SECURITY_PASSWORD
                ? validateSeedSecret(env.INITIAL_SECURITY_PASSWORD, 'INITIAL_SECURITY_PASSWORD', 12)
                : crypto.randomBytes(16).toString('hex');
              registroCompletado = true;
              debeCambiarClave = true;
            } else {
              initialPassword = crypto.randomBytes(32).toString('hex');
              registroCompletado = false;
              debeCambiarClave = false;
            }

            const hashedPassword = await bcrypt.hash(initialPassword, 10);

            await prisma.usuario.create({
              data: {
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
          }

          resolve(processed);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err: Error) => reject(err));
  });
}

export async function ensureBootstrapUsers(
  prisma: PrismaClient,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ adminCreated: boolean; securityCreated: boolean }> {
  const adminCedula = (env.INITIAL_ADMIN_CEDULA || DEFAULT_INITIAL_ADMIN_CEDULA).trim();
  const adminEmail = (env.INITIAL_ADMIN_EMAIL || DEFAULT_INITIAL_ADMIN_EMAIL).trim().toLowerCase();
  const securityCedula = (env.INITIAL_SECURITY_CEDULA || DEFAULT_INITIAL_SECURITY_CEDULA).trim();
  const securityEmail = (env.INITIAL_SECURITY_EMAIL || DEFAULT_INITIAL_SECURITY_EMAIL).trim().toLowerCase();

  const rawAdminPass = env.INITIAL_ADMIN_PASSWORD;
  const adminPlainPass = rawAdminPass
    ? validateSeedSecret(rawAdminPass, 'INITIAL_ADMIN_PASSWORD', 12)
    : env.NODE_ENV === 'production'
      ? validateSeedSecret(rawAdminPass, 'INITIAL_ADMIN_PASSWORD', 12)
      : crypto.randomBytes(16).toString('hex');

  let adminCreated = false;
  const existingAdmin = await prisma.usuario.findFirst({
    where: {
      OR: [{ cedula: adminCedula }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    const hashedAdminPass = await bcrypt.hash(adminPlainPass, 10);
    await prisma.usuario.create({
      data: {
        cedula: adminCedula,
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: adminEmail,
        password: hashedAdminPass,
        rol: Role.ADMINISTRADOR,
        registroCompletado: true,
        debeCambiarClave: true,
      },
    });
    adminCreated = true;
    console.log(`✅ Usuario Administrador inicial creado: ${adminEmail} (${adminCedula}) [debeCambiarClave=true]`);
  } else {
    console.log(`ℹ️ Administrador inicial (${adminCedula} / ${adminEmail}) ya existe; se preserva su contraseña actual.`);
  }

  let securityCreated = false;
  if (env.INITIAL_SECURITY_PASSWORD && env.INITIAL_SECURITY_PASSWORD.trim()) {
    const securityPlainPass = validateSeedSecret(env.INITIAL_SECURITY_PASSWORD, 'INITIAL_SECURITY_PASSWORD', 12);
    const existingSecurity = await prisma.usuario.findFirst({
      where: {
        OR: [{ cedula: securityCedula }, { email: securityEmail }],
      },
    });

    if (!existingSecurity) {
      const hashedSecurityPass = await bcrypt.hash(securityPlainPass, 10);
      await prisma.usuario.create({
        data: {
          cedula: securityCedula,
          nombre: 'Operador',
          apellido: 'Garita',
          email: securityEmail,
          password: hashedSecurityPass,
          rol: Role.SEGURIDAD,
          registroCompletado: true,
          debeCambiarClave: true,
        },
      });
      securityCreated = true;
      console.log(`✅ Usuario Vigilante inicial creado: ${securityEmail} (${securityCedula}) [debeCambiarClave=true]`);
    } else {
      console.log(`ℹ️ Vigilante inicial (${securityCedula} / ${securityEmail}) ya existe; se preserva su contraseña actual.`);
    }
  }

  return { adminCreated, securityCreated };
}

export async function runSeed(
  prisma: PrismaClient,
  env: NodeJS.ProcessEnv = process.env,
) {
  console.log('🚀 Iniciando script de siembra y aprovisionamiento (Seed)...');

  // Siempre garantizar la creación idempotente del Administrador inicial y (si aplica) del Vigilante
  const bootstrapResult = await ensureBootstrapUsers(prisma, env);

  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'data', 'usuarios.csv'),
    path.join(process.cwd(), 'usuarios.csv'),
    path.join(__dirname, 'data', 'usuarios.csv'),
    path.join(__dirname, 'usuarios.csv'),
  ];

  const selectedPath = possiblePaths.find((p) => fs.existsSync(p));

  if (selectedPath && env.SEED_SKIP_CSV !== 'true') {
    const totalMigrated = await migrateUsersFromCsv(prisma, selectedPath, env);
    console.log(`\n🎉 Migración de usuarios desde CSV completada. Total procesados: ${totalMigrated}.`);
  } else {
    console.log('ℹ️ Sin archivo CSV adicional de migración o migración omitida.');
  }

  return bootstrapResult;
}

if (require.main === module) {
  const prismaClient = new PrismaClient();
  runSeed(prismaClient, process.env)
    .catch((e) => {
      console.error('❌ Error durante la ejecución del seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
}
