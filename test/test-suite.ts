import 'reflect-metadata';
import * as assert from 'assert';
import { ForbiddenException, BadRequestException, ConflictException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService } from '../src/access/access.service';
import { AccessController } from '../src/access/access.controller';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/users/users.controller';
import { InvitadosService } from '../src/invitados/invitados.service';
import { InvitadosController } from '../src/invitados/invitados.controller';
import { HistorialController } from '../src/historial/historial.controller';
import { HistorialService } from '../src/historial/historial.service';
import { NoticiasController } from '../src/noticias/noticias.controller';
import { AuditoriaController } from '../src/auditoria/auditoria.controller';
import { HealthController } from '../src/health/health.controller';
import { EventosController } from '../src/eventos/eventos.controller';
import { EventosService } from '../src/eventos/eventos.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { signQrPassPayload, verifyQrPassToken, signEventJoinToken } from '../src/common/utils/qr-pass.util';
import { validateRuntimeSecrets } from '../src/common/utils/env-validation.util';
import { runSeed } from '../prisma/seed';
import * as bcrypt from 'bcryptjs';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-cai-production-suite-2026';
process.env.QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'test-qr-hmac-secret-key-for-cai-production-2026';

function createMockExecutionContext(
  controllerClass: any,
  handlerName: string,
  user: { id: string; rol: string; debeCambiarClave?: boolean } | null,
): ExecutionContext {
  const handler = controllerClass.prototype[handlerName];
  if (!handler) {
    throw new Error(`Handler ${controllerClass.name}.${handlerName} no existe`);
  }
  return {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

async function runTests() {
  console.log('🧪 Iniciando Suite de Pruebas Automatizadas — PORWARE CAI Producción...\n');
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (error: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Detalle: ${error.message}`);
      failed++;
    }
  };

  // =========================================================================
  // 1. PRUEBAS DE MATRIZ RBAC POR ROL (403 EN ENDPOINTS NO AUTORIZADOS)
  // =========================================================================
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  const adminUser = { id: 'admin-1', rol: 'ADMINISTRADOR', debeCambiarClave: false };
  const seguridadUser = { id: 'seg-1', rol: 'SEGURIDAD', debeCambiarClave: false };
  const empleadoUser = { id: 'emp-1', rol: 'EMPLEADO', debeCambiarClave: false };

  const assertForbiddenForRole = (
    controllerClass: any,
    handlerName: string,
    user: { id: string; rol: string; debeCambiarClave?: boolean },
  ) => {
    const ctx = createMockExecutionContext(controllerClass, handlerName, user);
    assert.throws(
      () => rolesGuard.canActivate(ctx),
      (err: any) => err instanceof ForbiddenException,
      `Se esperaba 403 Forbidden para rol ${user.rol} en ${controllerClass.name}.${handlerName}`,
    );
  };

  const assertAllowedForRole = (
    controllerClass: any,
    handlerName: string,
    user: { id: string; rol: string; debeCambiarClave?: boolean },
  ) => {
    const ctx = createMockExecutionContext(controllerClass, handlerName, user);
    const allowed = rolesGuard.canActivate(ctx);
    assert.strictEqual(
      allowed,
      true,
      `Se esperaba acceso permitido para rol ${user.rol} en ${controllerClass.name}.${handlerName}`,
    );
  };

  await test('RBAC SEGURIDAD: recibe 403 en bitácora general, exportaciones, acta evacuación, usuarios, invitados y auditoría', async () => {
    // Prohibidos para SEGURIDAD
    assertForbiddenForRole(HistorialController, 'findAll', seguridadUser);
    assertForbiddenForRole(HistorialController, 'getStats', seguridadUser);
    assertForbiddenForRole(HistorialController, 'exportCsv', seguridadUser);
    assertForbiddenForRole(HistorialController, 'getActaEvacuacion', seguridadUser);
    assertForbiddenForRole(HistorialController, 'getPersonaHistorial', seguridadUser);
    assertForbiddenForRole(HistorialController, 'updateObservacion', seguridadUser);

    assertForbiddenForRole(InvitadosController, 'findAll', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'create', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'findMyInvitations', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'findOne', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'emitirPase', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'update', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'setBloqueo', seguridadUser);
    assertForbiddenForRole(InvitadosController, 'remove', seguridadUser);

    assertForbiddenForRole(UsersController, 'findAll', seguridadUser);
    assertForbiddenForRole(UsersController, 'findOne', seguridadUser);
    assertForbiddenForRole(UsersController, 'create', seguridadUser);
    assertForbiddenForRole(UsersController, 'update', seguridadUser);
    assertForbiddenForRole(UsersController, 'setBloqueo', seguridadUser);
    assertForbiddenForRole(UsersController, 'remove', seguridadUser);

    assertForbiddenForRole(AuditoriaController, 'findAll', seguridadUser);

    assertForbiddenForRole(NoticiasController, 'findAll', seguridadUser);
    assertForbiddenForRole(NoticiasController, 'create', seguridadUser);
    assertForbiddenForRole(NoticiasController, 'update', seguridadUser);
    assertForbiddenForRole(NoticiasController, 'remove', seguridadUser);

    // Permitidos exclusivamente para SEGURIDAD
    assertAllowedForRole(AccessController, 'lookupPersona', seguridadUser);
    assertAllowedForRole(AccessController, 'registerEntry', seguridadUser);
    assertAllowedForRole(AccessController, 'registerExit', seguridadUser);
    assertAllowedForRole(HistorialController, 'getPersonasDentro', seguridadUser);
  });

  await test('RBAC EMPLEADO (Propietario): recibe 403 en garita, bitácora, usuarios, listado global de invitados y edición de cartelera', async () => {
    // Prohibidos para EMPLEADO
    assertForbiddenForRole(AccessController, 'lookupPersona', empleadoUser);
    assertForbiddenForRole(AccessController, 'registerEntry', empleadoUser);
    assertForbiddenForRole(AccessController, 'registerExit', empleadoUser);

    assertForbiddenForRole(HistorialController, 'findAll', empleadoUser);
    assertForbiddenForRole(HistorialController, 'getStats', empleadoUser);
    assertForbiddenForRole(HistorialController, 'getPersonasDentro', empleadoUser);
    assertForbiddenForRole(HistorialController, 'exportCsv', empleadoUser);
    assertForbiddenForRole(HistorialController, 'getActaEvacuacion', empleadoUser);
    assertForbiddenForRole(HistorialController, 'getPersonaHistorial', empleadoUser);
    assertForbiddenForRole(HistorialController, 'updateObservacion', empleadoUser);

    assertForbiddenForRole(UsersController, 'findAll', empleadoUser);
    assertForbiddenForRole(UsersController, 'findOne', empleadoUser);
    assertForbiddenForRole(UsersController, 'create', empleadoUser);
    assertForbiddenForRole(UsersController, 'update', empleadoUser);
    assertForbiddenForRole(UsersController, 'setBloqueo', empleadoUser);
    assertForbiddenForRole(UsersController, 'remove', empleadoUser);

    assertForbiddenForRole(InvitadosController, 'findAll', empleadoUser);
    assertForbiddenForRole(InvitadosController, 'setBloqueo', empleadoUser);

    assertForbiddenForRole(NoticiasController, 'create', empleadoUser);
    assertForbiddenForRole(NoticiasController, 'update', empleadoUser);
    assertForbiddenForRole(NoticiasController, 'remove', empleadoUser);

    assertForbiddenForRole(AuditoriaController, 'findAll', empleadoUser);

    // Permitidos para EMPLEADO
    assertAllowedForRole(InvitadosController, 'create', empleadoUser);
    assertAllowedForRole(InvitadosController, 'findMyInvitations', empleadoUser);
    assertAllowedForRole(InvitadosController, 'findOne', empleadoUser);
    assertAllowedForRole(InvitadosController, 'emitirPase', empleadoUser);
    assertAllowedForRole(InvitadosController, 'update', empleadoUser);
    assertAllowedForRole(InvitadosController, 'remove', empleadoUser);
    assertAllowedForRole(NoticiasController, 'findAll', empleadoUser);
    assertAllowedForRole(NoticiasController, 'findOne', empleadoUser);
    assertAllowedForRole(AuthController, 'getProfile', empleadoUser);
    assertAllowedForRole(AuthController, 'updateProfile', empleadoUser);
  });

  await test('RBAC ADMINISTRADOR: tiene acceso completo a todas las vistas y endpoints del sistema', async () => {
    assertAllowedForRole(AccessController, 'lookupPersona', adminUser);
    assertAllowedForRole(AccessController, 'registerEntry', adminUser);
    assertAllowedForRole(AccessController, 'registerExit', adminUser);
    assertAllowedForRole(HistorialController, 'findAll', adminUser);
    assertAllowedForRole(HistorialController, 'getStats', adminUser);
    assertAllowedForRole(HistorialController, 'getPersonasDentro', adminUser);
    assertAllowedForRole(HistorialController, 'exportCsv', adminUser);
    assertAllowedForRole(HistorialController, 'getActaEvacuacion', adminUser);
    assertAllowedForRole(UsersController, 'findAll', adminUser);
    assertAllowedForRole(UsersController, 'create', adminUser);
    assertAllowedForRole(InvitadosController, 'findAll', adminUser);
    assertAllowedForRole(InvitadosController, 'setBloqueo', adminUser);
    assertAllowedForRole(NoticiasController, 'create', adminUser);
    assertAllowedForRole(NoticiasController, 'update', adminUser);
    assertAllowedForRole(NoticiasController, 'remove', adminUser);
    assertAllowedForRole(AuditoriaController, 'findAll', adminUser);
  });

  // =========================================================================
  // 2. PRUEBAS DE CAMBIO OBLIGATORIO DE CLAVE (debeCambiarClave)
  // =========================================================================
  await test('Seguridad debeCambiarClave: bloquea con 403 todos los endpoints salvo changePassword y logout', async () => {
    const userMustChange = { id: 'u-temp', rol: 'ADMINISTRADOR', debeCambiarClave: true };

    assertForbiddenForRole(HistorialController, 'getStats', userMustChange);
    assertForbiddenForRole(AccessController, 'lookupPersona', userMustChange);
    assertForbiddenForRole(UsersController, 'findAll', userMustChange);
    assertForbiddenForRole(InvitadosController, 'findAll', userMustChange);
    assertForbiddenForRole(AuthController, 'getProfile', userMustChange);

    // Solo changePassword y logout tienen @AllowPasswordChange()
    assertAllowedForRole(AuthController, 'changePassword', userMustChange);
    assertAllowedForRole(AuthController, 'logout', userMustChange);
  });

  // =========================================================================
  // 3. PRUEBAS DE FIRMA QR HMAC-SHA256 EN BACKEND Y VIGENCIA EN TABLA VISITA
  // =========================================================================
  await test('QR HMAC-SHA256: genera y verifica firma criptográfica en backend y rechaza tokens adulterados o expirados', async () => {
    const expFutureIso = new Date(Date.now() + 3600_000).toISOString();
    const token = signQrPassPayload({
      visitaId: 'visita-uuid-101',
      invitadoId: 'inv-uuid-202',
      c: 'V-19888777',
      n: 'Carlos Mendoza',
      v: expFutureIso,
    });

    assert.ok(token.startsWith('CAI2:'), 'El token debe iniciar con el prefijo CAI2:');
    const verified = verifyQrPassToken(token);
    assert.strictEqual(verified.isValidSignature, true);
    assert.strictEqual(verified.isExpired, false);
    assert.strictEqual(verified.payload?.visitaId, 'visita-uuid-101');
    assert.strictEqual(verified.payload?.invitadoId, 'inv-uuid-202');

    // Adulterar un caracter de la firma
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    const verifiedTampered = verifyQrPassToken(tampered);
    assert.strictEqual(verifiedTampered.isValidSignature, false);
    assert.ok(verifiedTampered.error?.includes('Firma criptográfica HMAC-SHA256 inválida'));

    // Token expirado
    const expiredIso = new Date(Date.now() - 60_000).toISOString();
    const expiredToken = signQrPassPayload({
      visitaId: 'visita-uuid-102',
      invitadoId: 'inv-uuid-202',
      c: 'V-19888777',
      n: 'Carlos Mendoza',
      v: expiredIso,
    });
    const verifiedExpired = verifyQrPassToken(expiredToken);
    assert.strictEqual(verifiedExpired.isValidSignature, true);
    assert.strictEqual(verifiedExpired.isExpired, true);
    assert.ok(verifiedExpired.error?.includes('expiró'));
  });

  // =========================================================================
  // 4. PRUEBAS DE ACCESS SERVICE (ANTI-PASSBACK, LISTA NEGRA, QR VISITA)
  // =========================================================================
  let ultimoMovMock: any = null;
  let usuarioBloqueadoMock = false;
  let tieneVisitaMock = true;
  let visitaEstadoMock: 'AUTORIZADA' | 'CANCELADA' | 'COMPLETADA' = 'AUTORIZADA';
  let visitaExpiracionMock: Date = new Date(Date.now() + 3600_000);
  const auditoriaLogs: any[] = [];

  const mockAuditoriaService: any = {
    registrar: async (entry: any) => {
      auditoriaLogs.push(entry);
    },
  };

  const mockPrismaAccess: any = {
    $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockPrismaAccess),
    usuario: {
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const match = conds.some((c: any) => c.id === 'user-1' || c.cedula?.equals === 'V-10000001');
        if (match) {
          return {
            id: 'user-1',
            cedula: 'V-10000001',
            nombre: 'Administrador',
            apellido: 'Sistema',
            rol: 'ADMINISTRADOR',
            bloqueado: usuarioBloqueadoMock,
            motivoBloqueo: usuarioBloqueadoMock ? 'Suspendido por auditoría' : null,
            historial: ultimoMovMock ? [ultimoMovMock] : [],
          };
        }
        return null;
      },
    },
    invitado: {
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const match = conds.some(
          (c: any) =>
            c.id === 'inv-1' ||
            c.cedula?.equals === 'V-19888777' ||
            (Array.isArray(c.cedula?.in) && c.cedula.in.includes('V-19888777')),
        );
        if (match) {
          return {
            id: 'inv-1',
            cedula: 'V-19888777',
            nombre: 'Carlos',
            apellido: 'Mendoza',
            empresa: 'Proveedores C.A.',
            bloqueado: false,
            eliminado: false,
            empleado: { id: 'emp-1', nombre: 'Juan', apellido: 'Pérez' },
            visitas: tieneVisitaMock
              ? [
                  {
                    id: 'visita-1',
                    estado: visitaEstadoMock,
                    fechaExpiracion: visitaExpiracionMock,
                  },
                ]
              : [],
            historial: ultimoMovMock ? [ultimoMovMock] : [],
          };
        }
        return null;
      },
    },
    visita: {
      findUnique: async ({ where }: any) => {
        if (tieneVisitaMock && where.id === 'visita-1') {
          return {
            id: 'visita-1',
            invitadoId: 'inv-1',
            empleadoId: 'emp-1',
            estado: visitaEstadoMock,
            fechaExpiracion: visitaExpiracionMock,
          };
        }
        return null;
      },
      findFirst: async () =>
        tieneVisitaMock
          ? {
              id: 'visita-1',
              invitadoId: 'inv-1',
              estado: visitaEstadoMock,
              fechaExpiracion: visitaExpiracionMock,
            }
          : null,
      update: async () => ({}),
    },
    historial: {
      findFirst: async () => ultimoMovMock,
      create: async ({ data }: any) => ({
        id: 'hist-1',
        tipo: data.tipo,
        observacion: data.observacion,
        visitaId: data.visitaId,
        timestamp: new Date(),
        usuario: data.usuarioId ? { id: 'user-1', cedula: 'V-10000001', nombre: 'Admin', apellido: 'Sistema' } : null,
        invitado: data.invitadoId ? { id: 'inv-1', cedula: 'V-19888777', nombre: 'Carlos', apellido: 'Mendoza' } : null,
      }),
    },
  };

  const accessService = new AccessService(mockPrismaAccess, mockAuditoriaService);

  await test('Check-In con Pase QR firmado válido registra ENTRADA vinculada a la Visita', async () => {
    ultimoMovMock = null;
    visitaEstadoMock = 'AUTORIZADA';
    visitaExpiracionMock = new Date(Date.now() + 3600_000);

    const qrToken = signQrPassPayload({
      visitaId: 'visita-1',
      invitadoId: 'inv-1',
      c: 'V-19888777',
      n: 'Carlos Mendoza',
      v: visitaExpiracionMock.toISOString(),
    });

    const lookup = await accessService.lookupPersona(qrToken);
    assert.strictEqual(lookup.paseFirmado, true);
    assert.strictEqual(lookup.visitaId, 'visita-1');

    const res = await accessService.registerAccess('inv-1', true, 'ENTRADA', 'Ingreso garita norte', 'seg-1', qrToken);
    assert.strictEqual(res.tipo, 'ENTRADA');
    assert.strictEqual(res.visitaId, 'visita-1');
  });

  await test('Check-In con Visita cancelada o vencida en BD es rechazado con 403 Forbidden', async () => {
    ultimoMovMock = null;
    visitaEstadoMock = 'CANCELADA';
    const qrToken = signQrPassPayload({
      visitaId: 'visita-1',
      invitadoId: 'inv-1',
      c: 'V-19888777',
      n: 'Carlos Mendoza',
      v: new Date(Date.now() + 3600_000).toISOString(),
    });

    await assert.rejects(
      async () => {
        await accessService.registerAccess('inv-1', true, 'ENTRADA', undefined, 'seg-1', qrToken);
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('cancelada'),
    );
  });

  await test('Anti-Passback: Rechaza doble ENTRADA consecutiva cuando la persona ya está dentro', async () => {
    ultimoMovMock = { id: 'h-prev', tipo: 'ENTRADA', timestamp: new Date() };
    await assert.rejects(
      async () => {
        await accessService.registerAccess('user-1', false, 'ENTRADA', undefined, 'seg-1');
      },
      (err: any) => err instanceof BadRequestException && err.message.includes('Anti-Passback'),
    );
  });

  await test('Lista Negra: Rechaza con 403 Forbidden el ingreso de persona bloqueada/vetada', async () => {
    ultimoMovMock = null;
    usuarioBloqueadoMock = true;
    await assert.rejects(
      async () => {
        await accessService.registerAccess('user-1', false, 'ENTRADA', undefined, 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('BLOQUEADO'),
    );
    usuarioBloqueadoMock = false;
  });

  // =========================================================================
  // 5. PRUEBAS DE INVITADOS SERVICE: PROPIEDAD POR EMPLEADO Y BAJA LÓGICA
  // =========================================================================
  let softDeletedGuest = false;
  let hardDeletedGuest = false;

  const mockPrismaInvitados: any = {
    invitado: {
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const isAjeno = conds.some((c: any) => c.id === 'inv-ajeno' || c.cedula?.equals === 'inv-ajeno');
        if (isAjeno) {
          return {
            id: 'inv-ajeno',
            cedula: 'V-55666777',
            nombre: 'Invitado',
            apellido: 'Ajeno',
            empleadoId: 'otro-empleado-id',
            eliminado: false,
            empleado: { id: 'otro-empleado-id', cedula: 'V-222', nombre: 'Ana', apellido: 'Gómez', email: 'a@cai.local' },
            visitas: [],
            historial: [],
          };
        }
        return null;
      },
      findUnique: async ({ where }: any) => {
        if (where.id === 'inv-con-historial') {
          return {
            id: 'inv-con-historial',
            cedula: 'V-22333444',
            nombre: 'Pedro',
            apellido: 'ConHistorial',
            empleadoId: 'emp-1',
            eliminado: false,
            _count: { historial: 3, visitas: 1 },
          };
        }
        if (where.id === 'inv-ajeno') {
          return {
            id: 'inv-ajeno',
            cedula: 'V-55666777',
            nombre: 'Invitado',
            apellido: 'Ajeno',
            empleadoId: 'otro-empleado-id',
            eliminado: false,
            _count: { historial: 0, visitas: 1 },
          };
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        if (where.id === 'inv-con-historial' && data.eliminado === true) {
          softDeletedGuest = true;
        }
        return {
          id: where.id,
          cedula: 'V-22333444',
          nombre: 'Pedro',
          apellido: 'ConHistorial',
          ...data,
        };
      },
      delete: async () => {
        hardDeletedGuest = true;
      },
    },
    visita: {
      updateMany: async () => ({ count: 1 }),
    },
  };

  const invitadosService = new InvitadosService(mockPrismaInvitados, mockAuditoriaService);

  await test('Propiedad EMPLEADO: rechaza con 403 cuando un EMPLEADO intenta ver, editar o borrar un invitado de otro propietario', async () => {
    await assert.rejects(
      async () => {
        await invitadosService.findOne('inv-ajeno', { id: 'emp-1', rol: 'EMPLEADO' });
      },
      (err: any) => err instanceof ForbiddenException,
    );

    await assert.rejects(
      async () => {
        await invitadosService.update('inv-ajeno', { motivo: 'Cambio no autorizado' } as any, { id: 'emp-1', rol: 'EMPLEADO' });
      },
      (err: any) => err instanceof ForbiddenException,
    );

    await assert.rejects(
      async () => {
        await invitadosService.remove('inv-ajeno', { id: 'emp-1', rol: 'EMPLEADO' });
      },
      (err: any) => err instanceof ForbiddenException,
    );
  });

  await test('Baja Lógica y Auditoría con Autor: invitado con historial de accesos no se borra físicamente y registra autorId', async () => {
    auditoriaLogs.length = 0;
    const res: any = await invitadosService.remove('inv-con-historial', { id: 'emp-1', rol: 'EMPLEADO' });
    assert.strictEqual(res.eliminado, true);
    assert.strictEqual(softDeletedGuest, true);
    assert.strictEqual(hardDeletedGuest, false);
    assert.strictEqual(auditoriaLogs.length, 1);
    assert.strictEqual(auditoriaLogs[0].usuarioId, 'emp-1');
    assert.strictEqual(auditoriaLogs[0].accion, 'BAJA_LOGICA_INVITADO');
  });

  // =========================================================================
  // 6. PRUEBAS DE AUDITORÍA CON AUTOR EN USUARIOS Y NOTAS DE BITÁCORA
  // =========================================================================
  await test('Auditoría con Autor: bloqueo de usuario y nota de bitácora registran el usuarioId autor', async () => {
    auditoriaLogs.length = 0;
    const mockPrismaUsers: any = {
      usuario: {
        findUnique: async () => ({
          id: 'emp-2',
          cedula: 'V-30000001',
          nombre: 'María',
          apellido: 'López',
          rol: 'EMPLEADO',
        }),
        update: async ({ data }: any) => ({
          id: 'emp-2',
          cedula: 'V-30000001',
          nombre: 'María',
          apellido: 'López',
          rol: 'EMPLEADO',
          bloqueado: data.bloqueado,
          motivoBloqueo: data.motivoBloqueo,
        }),
      },
    };
    const usersService = new UsersService(mockPrismaUsers, mockAuditoriaService);
    await usersService.setBloqueo('emp-2', true, 'Incumplimiento de normas', 'admin-99');

    assert.strictEqual(auditoriaLogs.length, 1);
    assert.strictEqual(auditoriaLogs[0].usuarioId, 'admin-99');
    assert.strictEqual(auditoriaLogs[0].accion, 'BLOQUEO_USUARIO');

    const mockPrismaHist: any = {
      historial: {
        findUnique: async () => ({ id: 'h-1', observacion: 'Nota previa' }),
        update: async ({ data }: any) => ({ id: 'h-1', observacion: data.observacion }),
      },
    };
    const historialService = new HistorialService(mockPrismaHist, mockAuditoriaService);
    await historialService.updateObservacion('h-1', 'Nota corregida por admin', 'admin-99');

    assert.strictEqual(auditoriaLogs.length, 2);
    assert.strictEqual(auditoriaLogs[1].usuarioId, 'admin-99');
    assert.strictEqual(auditoriaLogs[1].accion, 'NOTA_BITACORA');
  });

  // =========================================================================
  // 7. PRUEBAS DE AUTH SERVICE (LOGIN Y CAMBIO DE CLAVE OBLIGATORIO)
  // =========================================================================
  const passwordHash = await bcrypt.hash('TempPass123!', 10);
  const mockPrismaAuth: any = {
    usuario: {
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const match = conds.some((c: any) => c.cedula?.equals === 'V-10000001');
        if (match) {
          return {
            id: 'user-1',
            cedula: 'V-10000001',
            nombre: 'Administrador',
            apellido: 'Sistema',
            email: 'admin@porware.com',
            password: passwordHash,
            rol: 'ADMINISTRADOR',
            debeCambiarClave: true,
          };
        }
        return null;
      },
      findUnique: async () => ({
        id: 'user-1',
        cedula: 'V-10000001',
        password: passwordHash,
        rol: 'ADMINISTRADOR',
      }),
      update: async ({ data }: any) => ({
        id: 'user-1',
        cedula: 'V-10000001',
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'ADMINISTRADOR',
        debeCambiarClave: data.debeCambiarClave,
      }),
    },
  };
  const mockJwtService: any = {
    sign: (payload: any) => `jwt_signed_${payload.sub}_${payload.rol}`,
  };
  const authService = new AuthService(mockPrismaAuth, mockJwtService, mockAuditoriaService);

  await test('AuthService: login retorna debeCambiarClave y changePassword lo limpia a false tras verificar clave actual', async () => {
    const loginRes = await authService.login({ identifier: 'V-10000001', password: 'TempPass123!' });
    assert.strictEqual(loginRes.user.debeCambiarClave, true);

    const changeRes = await authService.changePassword('user-1', {
      currentPassword: 'TempPass123!',
      newPassword: 'NuevaClaveSegura2026!',
    });
    assert.strictEqual(changeRes.user.debeCambiarClave, false);
  });

  await test('AuthService: registerAccount siempre asigna rol EMPLEADO y rechaza duplicados con ConflictException (409)', async () => {
    let createdUserRecord: any = null;
    const mockPrismaRegister: any = {
      usuario: {
        findFirst: async ({ where }: any) => {
          if (where.cedula?.equals === 'V-88888888' || where.email?.equals === 'nuevo@empresa.com') {
            return null;
          }
          if (where.cedula?.equals === 'V-10000001' || where.email?.equals === 'admin@porware.com') {
            return { id: 'admin-1', cedula: 'V-10000001', email: 'admin@porware.com', rol: 'ADMINISTRADOR' };
          }
          return null;
        },
        create: async ({ data }: any) => {
          createdUserRecord = { id: 'new-emp-1', ...data };
          return createdUserRecord;
        },
      },
    };
    const regService = new AuthService(mockPrismaRegister, mockJwtService, mockAuditoriaService);

    const regResult = await regService.registerAccount({
      cedula: 'V-88888888',
      nombre: 'Carlos',
      apellido: 'Perez',
      email: 'nuevo@empresa.com',
      password: 'MiPassword123!',
    });

    assert.strictEqual(regResult.user.rol, 'EMPLEADO', 'Debe asignar estrictamente rol EMPLEADO');
    assert.strictEqual(regResult.user.registroCompletado, true);

    // Intento de usurpación de cuenta con cédula existente -> 409
    await assert.rejects(
      async () => {
        await regService.registerAccount({
          cedula: 'V-10000001',
          nombre: 'Atacante',
          apellido: 'Hacker',
          email: 'otro@correo.com',
          password: 'Password123!',
        });
      },
      (err: any) => err instanceof ConflictException && err.message.includes('cédula de identidad ya se encuentra registrada'),
    );

    // Intento con correo existente -> 409
    await assert.rejects(
      async () => {
        await regService.registerAccount({
          cedula: 'V-99999999',
          nombre: 'Atacante',
          apellido: 'Hacker',
          email: 'admin@porware.com',
          password: 'Password123!',
        });
      },
      (err: any) => err instanceof ConflictException && err.message.includes('correo electrónico ya se encuentra registrado'),
    );
  });

  // =========================================================================
  // 8. PRUEBAS DE HEALTHCHECK (/health/live SIN BD Y /health CON BD)
  // =========================================================================
  await test('HealthController: /health/live responde 200 sin base de datos y /health responde 503 si PostgreSQL falla', async () => {
    let dbFailing = true;
    const mockPrismaHealth: any = {
      $queryRaw: async () => {
        if (dbFailing) {
          throw new Error('Connection refused to PostgreSQL');
        }
        return [{ '?column?': 1 }];
      },
    };

    const healthController = new HealthController(mockPrismaHealth);

    // 1. /health/live debe devolver 200 OK incluso cuando PostgreSQL está caído
    let liveStatus = 0;
    let liveBody: any = null;
    const mockResLive: any = {
      status(code: number) {
        liveStatus = code;
        return this;
      },
      json(payload: any) {
        liveBody = payload;
        return this;
      },
    };
    const liveRet = healthController.checkLiveness(mockResLive);
    assert.strictEqual(liveStatus, 200);
    assert.strictEqual(liveBody.status, 'ok');
    assert.strictEqual(liveRet, mockResLive);

    // 2. /health debe devolver 503 cuando PostgreSQL falla
    let healthStatus = 0;
    let healthBody: any = null;
    const mockResHealth: any = {
      status(code: number) {
        healthStatus = code;
        return this;
      },
      json(payload: any) {
        healthBody = payload;
        return this;
      },
    };
    await healthController.checkHealth(mockResHealth);
    assert.strictEqual(healthStatus, 503);
    assert.strictEqual(healthBody.status, 'degraded');
    assert.strictEqual(healthBody.database.status, 'down');

    // 3. /health debe devolver 200 cuando PostgreSQL responde
    dbFailing = false;
    await healthController.checkHealth(mockResHealth);
    assert.strictEqual(healthStatus, 200);
    assert.strictEqual(healthBody.status, 'ok');
    assert.strictEqual(healthBody.database.status, 'up');
  });

  // =========================================================================
  // 9. PRUEBAS DE SEED IDEMPOTENTE Y VARIABLES INITIAL_ADMIN / INITIAL_SECURITY
  // =========================================================================
  await test('Seed: crea admin y vigilante con cédulas/correos de variables, es idempotente y no sobrescribe contraseñas', async () => {
    const usersStore: any[] = [];
    const mockPrismaSeed: any = {
      usuario: {
        findFirst: async ({ where }: any) => {
          const conds = where?.OR || [];
          return (
            usersStore.find((u) =>
              conds.some(
                (c: any) =>
                  (c.cedula && u.cedula === c.cedula) ||
                  (c.email && u.email === c.email),
              ),
            ) || null
          );
        },
        create: async ({ data }: any) => {
          const created = { id: `u-${usersStore.length + 1}`, ...data };
          usersStore.push(created);
          return created;
        },
        update: async () => {
          throw new Error('El seed no debe sobrescribir usuarios ni contraseñas existentes');
        },
        upsert: async () => ({}),
      },
    };

    const seedEnv = {
      NODE_ENV: 'production',
      SEED_SKIP_CSV: 'true',
      INITIAL_ADMIN_CEDULA: 'V-10000001',
      INITIAL_ADMIN_EMAIL: 'admin@porware.com',
      INITIAL_ADMIN_PASSWORD: 'ClaveRealAdminProd2026!',
      INITIAL_SECURITY_CEDULA: 'V-20000002',
      INITIAL_SECURITY_EMAIL: 'garita@porware.com',
      INITIAL_SECURITY_PASSWORD: 'ClaveRealGaritaProd2026!',
    };

    // Primera ejecución: crea ambos con debeCambiarClave=true y registroCompletado=true
    const firstRun = await runSeed(mockPrismaSeed, seedEnv as any);
    assert.strictEqual(firstRun.adminCreated, true);
    assert.strictEqual(firstRun.securityCreated, true);
    assert.strictEqual(usersStore.length, 2);

    const adminCreated = usersStore.find((u) => u.rol === 'ADMINISTRADOR');
    const secCreated = usersStore.find((u) => u.rol === 'SEGURIDAD');
    assert.strictEqual(adminCreated.cedula, 'V-10000001');
    assert.strictEqual(adminCreated.email, 'admin@porware.com');
    assert.strictEqual(adminCreated.debeCambiarClave, true);
    assert.strictEqual(adminCreated.registroCompletado, true);

    assert.strictEqual(secCreated.cedula, 'V-20000002');
    assert.strictEqual(secCreated.email, 'garita@porware.com');
    assert.strictEqual(secCreated.debeCambiarClave, true);
    assert.strictEqual(secCreated.registroCompletado, true);

    const originalAdminHash = adminCreated.password;
    const originalSecHash = adminCreated.password && secCreated.password;

    // Segunda ejecución con otra contraseña en env: debe ser idempotente y NO pisar los hashes existentes
    const secondRun = await runSeed(
      mockPrismaSeed,
      {
        ...seedEnv,
        INITIAL_ADMIN_PASSWORD: 'OtraClaveDistintaNoPisar2026!',
        INITIAL_SECURITY_PASSWORD: 'OtraClaveGaritaNoPisar2026!',
      } as any,
    );
    assert.strictEqual(secondRun.adminCreated, false);
    assert.strictEqual(secondRun.securityCreated, false);
    assert.strictEqual(usersStore.length, 2);
    assert.strictEqual(adminCreated.password, originalAdminHash);
    assert.strictEqual(secCreated.password, originalSecHash);
  });

  // =========================================================================
  // 10. PRUEBAS DE VALIDACIÓN DE SECRETOS DE PLANTILLA AL ARRANCAR
  // =========================================================================
  await test('Arranque: falla con secretos de plantilla o longitudes insuficientes en JWT_SECRET, QR_HMAC_SECRET, POSTGRES_PASSWORD e INITIAL_ADMIN_PASSWORD', async () => {
    const validBaseEnv = {
      JWT_SECRET: 'a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8',
      QR_HMAC_SECRET: 'f1e2d3c4b5a69788796a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e',
      POSTGRES_PASSWORD: 'ClavePostgresProduccionSegura99!',
      INITIAL_ADMIN_PASSWORD: 'ClaveAdminInicialReal2026!',
    };

    // Caso válido no lanza error
    validateRuntimeSecrets(validBaseEnv);

    // 1. JWT_SECRET con palabra de plantilla "reemplazar"
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          JWT_SECRET: 'reemplazar_con_cadena_aleatoria_de_al_menos_64_caracteres_hex',
        }),
      (err: any) => err.message.includes('JWT_SECRET') && err.message.includes('plantilla'),
    );

    // 2. JWT_SECRET menor de 32 caracteres
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          JWT_SECRET: 'SecretoCorto12345',
        }),
      (err: any) => err.message.includes('JWT_SECRET') && err.message.includes('32 caracteres'),
    );

    // 3. QR_HMAC_SECRET con palabra de plantilla
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          QR_HMAC_SECRET: 'reemplazar_con_secreto_exclusivo_para_firma_hmac_sha256_de_qr',
        }),
      (err: any) => err.message.includes('QR_HMAC_SECRET'),
    );

    // 4. POSTGRES_PASSWORD con palabra "CambiarClave" o "changeme"
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          POSTGRES_PASSWORD: 'CambiarClavePostgres2026!',
        }),
      (err: any) => err.message.includes('POSTGRES_PASSWORD'),
    );

    // 5. INITIAL_ADMIN_PASSWORD con plantilla "CambiarClave" o menor de 12 caracteres
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          INITIAL_ADMIN_PASSWORD: 'CambiarClaveAdminInicial2026!',
        }),
      (err: any) => err.message.includes('INITIAL_ADMIN_PASSWORD'),
    );
    assert.throws(
      () =>
        validateRuntimeSecrets({
          ...validBaseEnv,
          INITIAL_ADMIN_PASSWORD: 'Corto123!',
        }),
      (err: any) => err.message.includes('INITIAL_ADMIN_PASSWORD') && err.message.includes('12 caracteres'),
    );
  });

  // =========================================================================
  // 11. PRUEBAS DE ACCESO DE VISITANTE SIN VISITA / VIGENTE / EXPIRADA POR CÉDULA
  // =========================================================================
  await test('Acceso por cédula: ENTRADA de invitado sin Visita vigente -> 403 y auditoría; con Visita AUTORIZADA vigente -> éxito; con Visita expirada o CANCELADA -> 403', async () => {
    ultimoMovMock = null;
    auditoriaLogs.length = 0;

    // A) Invitado sin ninguna Visita registrada -> 403 ("Sin visita autorizada vigente") + registro en Auditoría
    tieneVisitaMock = false;
    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-19888777', true, 'ENTRADA', 'Intento por cédula sin visita', 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('Sin visita autorizada vigente'),
    );
    assert.strictEqual(auditoriaLogs.length, 1);
    assert.strictEqual(auditoriaLogs[0].accion, 'ACCESO_DENEGADO_SIN_VISITA');

    // B) Invitado con Visita AUTORIZADA vigente ingresando por cédula -> éxito
    tieneVisitaMock = true;
    visitaEstadoMock = 'AUTORIZADA';
    visitaExpiracionMock = new Date(Date.now() + 3600_000);
    const okEntry = await accessService.registerAccess('V-19888777', true, 'ENTRADA', 'Ingreso por cédula con visita', 'seg-1');
    assert.strictEqual(okEntry.tipo, 'ENTRADA');
    assert.strictEqual(okEntry.visitaId, 'visita-1');

    // C) Invitado con Visita expirada ingresando por cédula -> 403
    visitaExpiracionMock = new Date(Date.now() - 60_000);
    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-19888777', true, 'ENTRADA', 'Intento con visita expirada', 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('Sin visita autorizada vigente'),
    );

    // D) Invitado con Visita CANCELADA ingresando por cédula -> 403
    visitaEstadoMock = 'CANCELADA';
    visitaExpiracionMock = new Date(Date.now() + 3600_000);
    await assert.rejects(
      async () => {
        await accessService.registerAccess('V-19888777', true, 'ENTRADA', 'Intento con visita cancelada', 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('Sin visita autorizada vigente'),
    );

    // Restaurar estado por defecto del mock
    visitaEstadoMock = 'AUTORIZADA';
    visitaExpiracionMock = new Date(Date.now() + 3600_000);
  });

  // =========================================================================
  // 12. PRUEBAS DEL MÓDULO DE EVENTOS Y CUPOS COMPARTIDOS (TAREA 2)
  // =========================================================================
  await test('Eventos RBAC: SEGURIDAD recibe 403 al intentar crear, listar, editar o aprobar eventos, y solo accede a /eventos/garita/*', async () => {
    assertForbiddenForRole(EventosController, 'create', seguridadUser);
    assertForbiddenForRole(EventosController, 'findAll', seguridadUser);
    assertForbiddenForRole(EventosController, 'findOne', seguridadUser);
    assertForbiddenForRole(EventosController, 'update', seguridadUser);
    assertForbiddenForRole(EventosController, 'cerrar', seguridadUser);
    assertForbiddenForRole(EventosController, 'cancelar', seguridadUser);
    assertForbiddenForRole(EventosController, 'toggleCodigo', seguridadUser);
    assertForbiddenForRole(EventosController, 'regenerarCodigo', seguridadUser);
    assertForbiddenForRole(EventosController, 'agregarInvitadoAnfitrion', seguridadUser);
    assertForbiddenForRole(EventosController, 'aprobarInvitado', seguridadUser);
    assertForbiddenForRole(EventosController, 'rechazarInvitado', seguridadUser);
    assertForbiddenForRole(EventosController, 'revocarInvitado', seguridadUser);

    // SEGURIDAD sí tiene acceso a la vista de eventos de hoy en garita y alta en puerta
    assertAllowedForRole(EventosController, 'getEventosGaritaHoy', seguridadUser);
    assertAllowedForRole(EventosController, 'altaEnGarita', seguridadUser);

    // EMPLEADO tiene acceso a gestión de sus eventos pero 403 en endpoints de garita
    assertAllowedForRole(EventosController, 'create', empleadoUser);
    assertAllowedForRole(EventosController, 'findAll', empleadoUser);
    assertAllowedForRole(EventosController, 'aprobarInvitado', empleadoUser);
    assertForbiddenForRole(EventosController, 'getEventosGaritaHoy', empleadoUser);
    assertForbiddenForRole(EventosController, 'altaEnGarita', empleadoUser);
  });

  // Estado en memoria para pruebas integrales de EventosService + AccessService
  const eventosMem: any[] = [];
  const invitadosMem: any[] = [
    {
      id: 'inv-vetado-1',
      cedula: 'V-99999999',
      nombre: 'Visitante',
      apellido: 'Vetado',
      bloqueado: true,
      motivoBloqueo: 'Prohibición de ingreso permanente',
      eliminado: false,
      empleadoId: 'emp-1',
    },
  ];
  const eventoInvitadosMem: any[] = [];
  const visitasMem: any[] = [];

  const mockPrismaEventos: any = {
    $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockPrismaEventos),
    usuario: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'emp-1') {
          return { id: 'emp-1', cedula: 'V-30000001', nombre: 'Juan', apellido: 'Pérez', email: 'juan@porware.com', rol: 'EMPLEADO' };
        }
        if (where.id === 'emp-2') {
          return { id: 'emp-2', cedula: 'V-30000002', nombre: 'Ana', apellido: 'Gómez', email: 'ana@porware.com', rol: 'EMPLEADO' };
        }
        return null;
      },
      findFirst: async () => null,
    },
    evento: {
      findMany: async ({ where }: any) => {
        if (where?.estado === 'ACTIVO' && where?.fin?.lt) {
          return eventosMem.filter((e) => e.estado === 'ACTIVO' && new Date(e.fin).getTime() < where.fin.lt.getTime());
        }
        return eventosMem
          .filter((e) => (!where?.anfitrionId ? true : e.anfitrionId === where.anfitrionId))
          .map((e) => ({
            ...e,
            invitados: eventoInvitadosMem
              .filter((rel) => rel.eventoId === e.id)
              .map((rel) => ({
                ...rel,
                invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
                visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
              })),
          }));
      },
      findUnique: async ({ where }: any) => {
        const ev = eventosMem.find((e) => e.id === where.id);
        if (!ev) return null;
        return {
          ...ev,
          anfitrion: { id: ev.anfitrionId, nombre: 'Juan', apellido: 'Pérez', cedula: 'V-30000001', email: 'juan@porware.com' },
          invitados: eventoInvitadosMem
            .filter((rel) => rel.eventoId === ev.id)
            .map((rel) => ({
              ...rel,
              invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
              visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
            })),
        };
      },
      create: async ({ data }: any) => {
        const created = {
          id: `evt-${eventosMem.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          anfitrion: { id: data.anfitrionId, nombre: 'Juan', apellido: 'Pérez', cedula: 'V-30000001', email: 'juan@porware.com' },
          invitados: [],
        };
        eventosMem.push(created);
        return created;
      },
      update: async ({ where, data }: any) => {
        const ev = eventosMem.find((e) => e.id === where.id);
        Object.assign(ev, data, { updatedAt: new Date() });
        return {
          ...ev,
          anfitrion: { id: ev.anfitrionId, nombre: 'Juan', apellido: 'Pérez', cedula: 'V-30000001', email: 'juan@porware.com' },
          invitados: eventoInvitadosMem
            .filter((rel) => rel.eventoId === ev.id)
            .map((rel) => ({
              ...rel,
              invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
              visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
            })),
        };
      },
      updateMany: async ({ where, data }: any) => {
        const ids: string[] = where?.id?.in || [];
        eventosMem.forEach((e) => {
          if (ids.includes(e.id)) {
            Object.assign(e, data);
          }
        });
        return { count: ids.length };
      },
    },
    invitado: {
      findUnique: async ({ where }: any) => {
        if (where.cedula) {
          return invitadosMem.find((g) => g.cedula.toUpperCase() === where.cedula.toUpperCase()) || null;
        }
        if (where.id) {
          return invitadosMem.find((g) => g.id === where.id) || null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const found = invitadosMem.find((g) =>
          conds.some(
            (c: any) =>
              c.id === g.id ||
              (c.cedula?.equals && g.cedula.toUpperCase() === c.cedula.equals.toUpperCase()),
          ),
        );
        return found || null;
      },
      create: async ({ data }: any) => {
        const created = {
          id: `inv-evt-${invitadosMem.length + 1}`,
          bloqueado: false,
          motivoBloqueo: null,
          ...data,
          createdAt: new Date(),
        };
        invitadosMem.push(created);
        return created;
      },
      update: async ({ where, data }: any) => {
        const g = invitadosMem.find((x) => x.id === where.id);
        Object.assign(g, data);
        return g;
      },
    },
    eventoInvitado: {
      findUnique: async ({ where }: any) => {
        const rel = eventoInvitadosMem.find((r) => r.id === where.id);
        if (!rel) return null;
        return {
          ...rel,
          invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
          visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
        };
      },
      create: async ({ data }: any) => {
        const rel = {
          id: `rel-${eventoInvitadosMem.length + 1}`,
          ...data,
          createdAt: new Date(),
        };
        eventoInvitadosMem.push(rel);
        return {
          ...rel,
          invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
          visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
        };
      },
      update: async ({ where, data }: any) => {
        const rel = eventoInvitadosMem.find((r) => r.id === where.id);
        Object.assign(rel, data);
        return {
          ...rel,
          invitado: invitadosMem.find((g) => g.id === rel.invitadoId),
          visita: visitasMem.find((v) => v.id === rel.visitaId) || null,
        };
      },
    },
    visita: {
      create: async ({ data }: any) => {
        const v = {
          id: `vis-evt-${visitasMem.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        visitasMem.push(v);
        return v;
      },
      findUnique: async ({ where }: any) => visitasMem.find((v) => v.id === where.id) || null,
      findFirst: async ({ where }: any) => {
        const list = visitasMem.filter((v) => v.invitadoId === where.invitadoId);
        return list.length > 0 ? list[list.length - 1] : null;
      },
      update: async ({ where, data }: any) => {
        const v = visitasMem.find((x) => x.id === where.id);
        if (v) Object.assign(v, data);
        return v;
      },
      updateMany: async ({ where, data }: any) => {
        const ids: string[] = where?.id?.in || [];
        visitasMem.forEach((v) => {
          if (ids.includes(v.id)) {
            Object.assign(v, data);
          }
        });
        return { count: ids.length };
      },
    },
    historial: {
      findFirst: async () => null,
      create: async ({ data }: any) => ({
        id: 'hist-evt-1',
        ...data,
        timestamp: new Date(),
      }),
    },
  };

  const eventosService = new EventosService(mockPrismaEventos, mockAuditoriaService);
  const accessEventosService = new AccessService(mockPrismaEventos, mockAuditoriaService);

  await test('Eventos: unirse con token válido -> PENDIENTE (o APROBADO si no requiere aprobación); rechaza token vencido, adulterado o de evento cerrado', async () => {
    const inicio = new Date(Date.now() + 60_000).toISOString();
    const fin = new Date(Date.now() + 7200_000).toISOString();

    const ev = await eventosService.create(
      {
        nombre: 'Asamblea de Propietarios',
        inicio,
        fin,
        aforo: 2,
        requiereAprobacion: true,
      },
      empleadoUser,
    );

    assert.ok(ev.tokenUnion && ev.tokenUnion.startsWith('CAI-EVT:'));

    // 1. Unión válida -> queda PENDIENTE
    const joinRes = await eventosService.unirsePublico(
      {
        token: ev.tokenUnion,
        cedula: 'V-40111222',
        nombre: 'Laura',
        apellido: 'Suárez',
        placa: 'AA111BB',
      },
      '192.168.1.50',
    );
    assert.strictEqual(joinRes.ok, true);
    assert.strictEqual(joinRes.estado, 'PENDIENTE');

    // 2. Token adulterado -> rechazado con 403
    const tampered = ev.tokenUnion.slice(0, -2) + (ev.tokenUnion.endsWith('00') ? '11' : '00');
    await assert.rejects(
      async () => {
        await eventosService.unirsePublico({
          token: tampered,
          cedula: 'V-40333444',
          nombre: 'Pedro',
          apellido: 'Soto',
        });
      },
      (err: any) => err instanceof ForbiddenException,
    );

    // 3. Token expirado -> rechazado con 403
    const expiredToken = signEventJoinToken({
      eventoId: ev.id,
      nonce: ev.nonceCodigo,
      v: new Date(Date.now() - 60_000).toISOString(),
    });
    await assert.rejects(
      async () => {
        await eventosService.unirsePublico({
          token: expiredToken,
          cedula: 'V-40333444',
          nombre: 'Pedro',
          apellido: 'Soto',
        });
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('expirado'),
    );

    // 4. Evento sin requerir aprobación -> unión directa en estado APROBADO
    const evAuto = await eventosService.create(
      {
        nombre: 'Charla Abierta',
        inicio,
        fin,
        aforo: 5,
        requiereAprobacion: false,
      },
      empleadoUser,
    );
    const joinAuto = await eventosService.unirsePublico({
      token: evAuto.tokenUnion,
      cedula: 'V-40555666',
      nombre: 'Miguel',
      apellido: 'Rivas',
    });
    assert.strictEqual(joinAuto.estado, 'APROBADO');
  });

  await test('Eventos: cupo duro (aforo lleno) rechaza nuevas uniones, e invitado con bloqueado=true es rechazado al unirse y en garita', async () => {
    const ev = eventosMem[0]; // Asamblea de Propietarios (aforo = 2, ya tiene 1 PENDIENTE: Laura V-40111222)
    const token = signEventJoinToken({
      eventoId: ev.id,
      nonce: ev.nonceCodigo,
      v: new Date(ev.fin).toISOString(),
    });

    // 1. Invitado bloqueado (V-99999999) no puede unirse por enlace público
    await assert.rejects(
      async () => {
        await eventosService.unirsePublico({
          token,
          cedula: 'V-99999999',
          nombre: 'Visitante',
          apellido: 'Vetado',
        });
      },
      (err: any) => err instanceof ForbiddenException,
    );

    // 2. Invitado bloqueado tampoco puede darse de alta en garita ni ingresar
    await assert.rejects(
      async () => {
        await eventosService.altaEnGarita(
          ev.id,
          { cedula: 'V-99999999', nombre: 'Visitante', apellido: 'Vetado' },
          seguridadUser,
        );
      },
      (err: any) => err instanceof ForbiddenException,
    );
    await assert.rejects(
      async () => {
        await accessEventosService.registerAccess('V-99999999', true, 'ENTRADA', undefined, 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('BLOQUEADO'),
    );

    // 3. Llenar el segundo cupo con alta en garita (origen = GARITA, estado = PENDIENTE)
    auditoriaLogs.length = 0;
    const altaGaritaRes = await eventosService.altaEnGarita(
      ev.id,
      { cedula: 'V-40222333', nombre: 'Sofía', apellido: 'Morales', placa: 'CC222DD' },
      seguridadUser,
    );
    assert.strictEqual(altaGaritaRes.origen, 'GARITA');
    assert.strictEqual(altaGaritaRes.estado, 'PENDIENTE');
    assert.ok(auditoriaLogs.some((a) => a.accion === 'ALTA_GARITA_EVENTO' && a.usuarioId === seguridadUser.id));

    // 4. Con 2 de 2 cupos ocupados, un tercer invitado es rechazado por aforo lleno
    await assert.rejects(
      async () => {
        await eventosService.unirsePublico({
          token,
          cedula: 'V-40777888',
          nombre: 'Tercer',
          apellido: 'Invitado',
        });
      },
      (err: any) => err instanceof BadRequestException && err.message.includes('Cupo agotado'),
    );
  });

  await test('Eventos: aprobar invitado crea Visita con vencimiento del evento y permite check-in; tras pasar fin o cerrar evento se rechaza check-in; token CAI-EVT directo en garita es rechazado', async () => {
    const ev = eventosMem[0];
    const relLaura = eventoInvitadosMem.find((r) => r.eventoId === ev.id);

    // 1. Usar el token compartido CAI-EVT directamente en garita NUNCA autoriza entrada
    const eventShareToken = signEventJoinToken({
      eventoId: ev.id,
      nonce: ev.nonceCodigo,
      v: new Date(ev.fin).toISOString(),
    });
    await assert.rejects(
      async () => {
        await accessEventosService.registerAccess(eventShareToken, true, 'ENTRADA', undefined, 'seg-1', eventShareToken);
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('CAI-EVT'),
    );

    // 2. Antes de aprobar a Laura (V-40111222), no tiene Visita -> check-in por cédula rechazado con 403
    await assert.rejects(
      async () => {
        await accessEventosService.registerAccess('V-40111222', true, 'ENTRADA', undefined, 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('Sin visita autorizada vigente'),
    );

    // 3. EMPLEADO de otro departamento (emp-2) recibe 403 al intentar ver, editar o aprobar el evento de emp-1
    const otroEmpleado = { id: 'emp-2', rol: 'EMPLEADO', debeCambiarClave: false };
    await assert.rejects(
      async () => {
        await eventosService.findOne(ev.id, otroEmpleado);
      },
      (err: any) => err instanceof ForbiddenException,
    );
    await assert.rejects(
      async () => {
        await eventosService.aprobarInvitado(ev.id, relLaura.id, otroEmpleado);
      },
      (err: any) => err instanceof ForbiddenException,
    );

    // 4. El anfitrión dueño (emp-1) aprueba a Laura -> crea Visita AUTORIZADA con fechaExpiracion = ev.fin
    const approved = await eventosService.aprobarInvitado(ev.id, relLaura.id, empleadoUser);
    assert.strictEqual(approved.estado, 'APROBADO');
    assert.ok(approved.visitaId);
    assert.strictEqual(
      new Date(approved.visita.fechaExpiracion).getTime(),
      new Date(ev.fin).getTime(),
    );

    // 5. Ahora Laura puede hacer check-in en garita
    const entryOk = await accessEventosService.registerAccess('V-40111222', true, 'ENTRADA', 'Ingreso evento', 'seg-1');
    assert.strictEqual(entryOk.tipo, 'ENTRADA');
    assert.strictEqual(entryOk.visitaId, approved.visitaId);

    // 6. Al pasar la hora de fin del evento (cierre automático), la visita expira y se rechaza nuevo check-in y nuevas uniones
    ev.fin = new Date(Date.now() - 5_000);
    const createdVisita = visitasMem.find((v) => v.id === approved.visitaId);
    createdVisita.fechaExpiracion = ev.fin;

    await eventosService.sincronizarEventosVencidos();
    assert.strictEqual(ev.estado, 'CERRADO');

    await assert.rejects(
      async () => {
        await accessEventosService.registerAccess('V-40111222', true, 'ENTRADA', 'Intento tras fin de evento', 'seg-1');
      },
      (err: any) => err instanceof ForbiddenException && err.message.includes('Sin visita autorizada vigente'),
    );
  });

  console.log(`\n📊 Resumen de Pruebas: ${passed} exitosas, ${failed} fallidas.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
