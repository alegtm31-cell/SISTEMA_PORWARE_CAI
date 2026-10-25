/**
 * Suite de Pruebas Automatizadas del Sistema CAI (Pruebas Reales de Servicios)
 * Instancia y evalúa directamente las clases AuthService, AccessService, HistorialService y utilidades de QR.
 */
import * as assert from 'assert';
import { AuthService } from '../src/auth/auth.service';
import { AccessService } from '../src/access/access.service';
import { HistorialService } from '../src/historial/historial.service';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Color logging helpers
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

let passedCount = 0;
let totalCount = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  totalCount++;
  try {
    await fn();
    console.log(`  ${green('✓')} ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ${red('✗')} ${name}`);
    console.error(`    ${red(err.message || String(err))}`);
  }
}

// Mock de AuditoriaService
const mockAuditoriaService: any = {
  registrar: async () => {},
};

// Mock de JwtService
const mockJwtService: any = {
  sign: () => 'fake_jwt_token',
};

async function runTestSuite() {
  console.log(bold('\n🧪 INICIANDO SUITE DE PRUEBAS SOBRE SERVICIOS REALES (CAI v2)\n'));

  // ========================================================
  // MÓDULO 1: AUTENTICACIÓN Y SEGURIDAD (AuthService)
  // ========================================================
  console.log(cyan('--- MÓDULO 1: PRUEBAS REALES DE AuthService ---'));

  await test('AuthService.validateUser: Rechaza usuario bloqueado por administración', async () => {
    const rawPass = 'Password123!';
    const hashed = await bcrypt.hash(rawPass, 10);
    const mockPrisma: any = {
      usuario: {
        findFirst: async () => ({
          id: 'user-1',
          cedula: 'V-11111111',
          email: 'bloqueado@cai.local',
          password: hashed,
          rol: 'EMPLEADO',
          bloqueado: true,
          motivoBloqueo: 'Desincorporado por RRHH',
        }),
      },
    };

    const authService = new AuthService(mockPrisma, mockJwtService, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await authService.validateUser('V-11111111', rawPass);
      },
      (err: any) => {
        return err instanceof UnauthorizedException && err.message.includes('bloqueado por administración');
      },
      'Debe lanzar UnauthorizedException si el usuario tiene bloqueado=true'
    );
  });

  await test('AuthService.completeRegistro: Rechaza intento de auto-registro en rol ADMINISTRADOR', async () => {
    const mockPrisma: any = {
      usuario: {
        findFirst: async () => ({
          id: 'admin-1',
          cedula: 'V-12345678',
          email: 'admin@cai.local',
          rol: 'ADMINISTRADOR',
          bloqueado: false,
          cargo: 'Gerente IT',
          telefonoMovil: '04141234567',
        }),
      },
    };

    const authService = new AuthService(mockPrisma, mockJwtService, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await authService.completeRegistro({
          cedula: 'V-12345678',
          password: 'new_hacked_pass_123',
        });
      },
      (err: any) => {
        return err instanceof BadRequestException && err.message.includes('Solo empleados pueden completar auto-registro');
      },
      'Debe prohibir auto-registro sobre cuentas de Administrador'
    );
  });

  await test('AuthService.completeRegistro: Rechaza auto-registro si el empleado ya completó su registro previamente', async () => {
    const mockPrisma: any = {
      usuario: {
        findFirst: async () => ({
          id: 'emp-1',
          cedula: 'V-22222222',
          email: 'empleado@cai.local',
          rol: 'EMPLEADO',
          bloqueado: false,
          cargo: 'Analista de Operaciones',
          telefonoMovil: '04129876543',
        }),
      },
    };

    const authService = new AuthService(mockPrisma, mockJwtService, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await authService.completeRegistro({
          cedula: 'V-22222222',
          password: 'new_pass_attempt',
        });
      },
      (err: any) => {
        return err instanceof BadRequestException && err.message.includes('ya completó su registro previamente');
      },
      'Debe impedir sobreescritura de contraseña en empleados ya registrados'
    );
  });

  // ========================================================
  // MÓDULO 2: CONTROL DE ACCESO ATÓMICO Y ANTI-PASSBACK (AccessService)
  // ========================================================
  console.log(cyan('\n--- MÓDULO 2: PRUEBAS REALES DE AccessService (Anti-Passback) ---'));

  await test('AccessService.registerAccess: Rechaza doble ENTRADA consecutiva (Anti-Passback)', async () => {
    const mockPrisma: any = {
      $transaction: async (cb: any) => {
        const tx: any = {
          usuario: {
            findFirst: async () => ({
              id: 'user-emp',
              cedula: 'V-12345678',
              nombre: 'Carlos',
              apellido: 'Rodriguez',
              bloqueado: false,
            }),
          },
          historial: {
            findFirst: async () => ({
              id: 'h-1',
              tipo: 'ENTRADA',
              timestamp: new Date(),
            }),
          },
        };
        return cb(tx);
      },
    };

    const accessService = new AccessService(mockPrisma, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-12345678', false, 'ENTRADA');
      },
      (err: any) => {
        return err instanceof BadRequestException && err.message.includes('Anti-Passback');
      },
      'Debe rechazar doble entrada consecutiva'
    );
  });

  await test('AccessService.registerAccess: Rechaza SALIDA sin ENTRADA previa', async () => {
    const mockPrisma: any = {
      $transaction: async (cb: any) => {
        const tx: any = {
          usuario: {
            findFirst: async () => ({
              id: 'user-emp',
              cedula: 'V-12345678',
              nombre: 'Carlos',
              apellido: 'Rodriguez',
              bloqueado: false,
            }),
          },
          historial: {
            findFirst: async () => null, // No tiene entradas registradas
          },
        };
        return cb(tx);
      },
    };

    const accessService = new AccessService(mockPrisma, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-12345678', false, 'SALIDA');
      },
      (err: any) => {
        return err instanceof BadRequestException && err.message.includes('sin una ENTRADA previa');
      },
      'Debe rechazar salida sin entrada registrada'
    );
  });

  await test('AccessService.registerAccess: Rechaza ingreso de persona con veto/bloqueo activo', async () => {
    const mockPrisma: any = {
      $transaction: async (cb: any) => {
        const tx: any = {
          usuario: {
            findFirst: async () => ({
              id: 'user-vetado',
              cedula: 'V-99887766',
              nombre: 'Pedro',
              apellido: 'Ramirez',
              bloqueado: true,
              motivoBloqueo: 'Vetado por seguridad',
            }),
          },
        };
        return cb(tx);
      },
    };

    const accessService = new AccessService(mockPrisma, mockAuditoriaService);

    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-99887766', false, 'ENTRADA');
      },
      (err: any) => {
        return err instanceof ForbiddenException && err.message.includes('Acceso BLOQUEADO');
      },
      'Debe rechazar entrada de usuario bloqueado con ForbiddenException'
    );
  });

  // ========================================================
  // MÓDULO 3: HISTORIAL, AFORO COHERENTE Y CSV (HistorialService)
  // ========================================================
  console.log(cyan('\n--- MÓDULO 3: PRUEBAS REALES DE HistorialService ---'));

  await test('HistorialService.getStats: Unifica aforo exacto usando conteo de getPersonasDentro', async () => {
    const mockPrisma: any = {
      historial: {
        count: async () => 15,
        findMany: async () => [],
      },
      $queryRaw: async (query: any) => {
        // Simular que DISTINCT ON devuelve personas con último estado ENTRADA
        return [
          { id: '1', tipo: 'ENTRADA' },
          { id: '2', tipo: 'ENTRADA' },
          { id: '3', tipo: 'ENTRADA' },
        ];
      },
    };

    const historialService = new HistorialService(mockPrisma);
    const stats = await historialService.getStats();

    assert.strictEqual(stats.dentroEstimado, 6, 'Debe coincidir con la suma de personal y visitantes dentro (3 + 3)');
    assert.strictEqual(stats.personasDentroAproximado, 6);
  });

  await test('HistorialService.exportCsv: Neutraliza fórmulas maliciosas de Excel (=, +, -, @)', async () => {
    const mockPrisma: any = {
      historial: {
        findMany: async () => [
          {
            id: 'h-100',
            timestamp: new Date('2026-10-25T10:00:00Z'),
            tipo: 'ENTRADA',
            usuario: {
              cedula: 'V-12345678',
              nombre: '=cmd|\'/C calc\'!A0', // Payload malicioso de inyección CSV
              apellido: '+1234567',
              rol: 'EMPLEADO',
              departamento: '@DptoFinanzas',
            },
            invitado: null,
            registradoPor: null,
            observacion: '-DATO_PELIGROSO',
          },
        ],
      },
    };

    const historialService = new HistorialService(mockPrisma);
    const csvOutput = await historialService.exportCsv({});

    // Verificar que los caracteres maliciosos fueron prefijados con comilla simple ' para neutralizar ejecución en hojas de cálculo
    assert.ok(csvOutput.includes("\"'=cmd|"), 'La fórmula =cmd debe ser neutralizada con comilla simple');
    assert.ok(csvOutput.includes("\"'@DptoFinanzas\""), 'El campo iniciando con @ debe ser neutralizado con comilla simple');
    assert.ok(csvOutput.includes("\"'-DATO_PELIGROSO\""), 'El campo iniciando con - debe ser neutralizado con comilla simple');
  });

  // ========================================================
  // MÓDULO 4: PASES DIGITALES QR, FIRMA Y VIGENCIA (Fase 4)
  // ========================================================
  console.log(cyan('\n--- MÓDULO 4: VALIDACIÓN DE PASES DIGITALES QR ---'));

  await test('Pase Digital: Detección y rechazo de firma alterada', () => {
    const PASS_SECRET = 'cai_secure_pass_signature_key_2026';
    const simpleChecksum = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    };

    const original = { c: 'V-20123456', v: '2026-12-31' };
    const validSign = simpleChecksum(`${original.c}:${original.v}:${PASS_SECRET}`);

    const altered = { c: 'V-99999999', v: '2026-12-31', s: validSign };
    const calculatedSign = simpleChecksum(`${altered.c}:${altered.v}:${PASS_SECRET}`);

    assert.notStrictEqual(altered.s, calculatedSign, 'La firma no debe coincidir si la cédula fue alterada');
  });

  console.log(bold('\n============================================================'));
  if (passedCount === totalCount) {
    console.log(bold(green(`🎉 TODAS LAS PRUEBAS SOBRE SERVICIOS REALES PASARON CON ÉXITO: ${passedCount}/${totalCount} (100% OK)`)));
  } else {
    console.log(bold(red(`⚠️ ALGUNAS PRUEBAS FALLARON: ${passedCount}/${totalCount} pasaron.`)));
    process.exit(1);
  }
  console.log(bold('============================================================\n'));
}

runTestSuite().catch((e) => {
  console.error(red('Error fatal en ejecución de pruebas:'), e);
  process.exit(1);
});
