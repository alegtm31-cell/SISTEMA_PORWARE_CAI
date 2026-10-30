import 'reflect-metadata';
import * as assert from 'assert';
import { ForbiddenException, BadRequestException, ExecutionContext } from '@nestjs/common';
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
import { RolesGuard } from '../src/auth/roles.guard';
import { signQrPassPayload, verifyQrPassToken } from '../src/common/utils/qr-pass.util';
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
        const match = conds.some((c: any) => c.id === 'inv-1' || c.cedula?.equals === 'V-19888777');
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
            visitas: [
              {
                id: 'visita-1',
                estado: visitaEstadoMock,
                fechaExpiracion: visitaExpiracionMock,
              },
            ],
            historial: ultimoMovMock ? [ultimoMovMock] : [],
          };
        }
        return null;
      },
    },
    visita: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'visita-1') {
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
      findFirst: async () => ({
        id: 'visita-1',
        invitadoId: 'inv-1',
        estado: visitaEstadoMock,
        fechaExpiracion: visitaExpiracionMock,
      }),
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

  console.log(`\n📊 Resumen de Pruebas: ${passed} exitosas, ${failed} fallidas.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
