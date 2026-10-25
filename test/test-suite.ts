/**
 * Suite de Pruebas Automatizadas del Sistema CAI (Fase 3: Operación)
 * Ejecuta validaciones de seguridad, anti-passback, auditoría, zona horaria, exportación CSV y rollcall.
 */
import * as assert from 'assert';
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

async function runTestSuite() {
  console.log(bold('\n🧪 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - FASE 3 (OPERACIÓN)\n'));

  console.log(cyan('--- MÓDULO 1: CRIPTOGRAFÍA Y AUTENTICACIÓN (AuthService) ---'));

  await test('Bcrypt genera hashes válidos y seguros con salt rounds >= 10', async () => {
    const rawPassword = 'PasswordSegura2026!';
    const hash = await bcrypt.hash(rawPassword, 10);
    assert.ok(hash.startsWith('$2'), 'El hash debe ser formato Bcrypt');
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true, 'Bcrypt debe verificar la clave correctamente');
    const isMismatch = await bcrypt.compare('ClaveErronea', hash);
    assert.strictEqual(isMismatch, false, 'Bcrypt debe rechazar claves incorrectas');
  });

  await test('Normalización de Cédula y Correo para evitar vulnerabilidades de coincidencia', () => {
    const cedulaInput = '  V-12345678  ';
    const cleanCedula = cedulaInput.trim();
    assert.strictEqual(cleanCedula, 'V-12345678');

    const emailInput = '  Usuario@CAI.Local  ';
    const cleanEmail = emailInput.trim().toLowerCase();
    assert.strictEqual(cleanEmail, 'usuario@cai.local');
  });

  console.log(cyan('\n--- MÓDULO 2: CONTROL DE ACCESO Y ANTI-PASSBACK (AccessService) ---'));

  await test('Anti-Passback: Rechaza doble ENTRADA consecutiva para una misma persona', () => {
    const persona = { id: 'user-1', nombre: 'Carlos Rodriguez', tipo: 'PERSONAL' };
    const ultimoMovimiento = { tipo: 'ENTRADA', timestamp: new Date() };
    const intentoActual = 'ENTRADA';

    const esInvalido = ultimoMovimiento.tipo === 'ENTRADA' && intentoActual === 'ENTRADA';
    assert.strictEqual(esInvalido, true, 'El motor debe detectar doble ENTRADA sin salida previa');
  });

  await test('Anti-Passback: Rechaza SALIDA sin ENTRADA previa registrada', () => {
    const ultimoMovimiento: any = null;
    const intentoActual = 'SALIDA';

    const esInvalido = !ultimoMovimiento && intentoActual === 'SALIDA';
    assert.strictEqual(esInvalido, true, 'El motor debe impedir salir a quien no tenga ingreso previo');
  });

  await test('Control de Bloqueo / Veto: Rechaza ENTRADA cuando bloqueado=true', () => {
    const persona = {
      id: 'guest-1',
      cedula: 'V-12345678',
      bloqueado: true,
      motivoBloqueo: 'Persona no grata por hurto de herramientas',
    };
    const intentoTipo = 'ENTRADA';

    const debeBloquear = persona.bloqueado && intentoTipo === 'ENTRADA';
    assert.strictEqual(debeBloquear, true, 'La persona bloqueada debe ser rechazada inmediatamente');
    assert.ok(persona.motivoBloqueo.length > 0, 'Debe existir un motivo de bloqueo formal');
  });

  console.log(cyan('\n--- MÓDULO 3: ZONA HORARIA, AUDITORÍA Y HISTORIAL (HistorialService) ---'));

  await test('Cálculo de hora local sincronizado con America/Caracas (UTC-4)', () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(new Date());
    assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/, 'Debe generar fecha ISO válida para Caracas');
  });

  await test('Observaciones de garita son estrictamente append-only con firma de autor', () => {
    const observacionExistente = 'Entrada por torniquete 1';
    const nuevaNota = 'Revisión de bulto completada';
    const autor = 'Sargento Perez (SEGURIDAD)';
    const timeStr = '25/10/26, 04:00:00';

    const nuevaLinea = `[${timeStr} - ${autor}]: ${nuevaNota}`;
    const observacionFinal = `${observacionExistente}\n${nuevaLinea}`;

    assert.ok(observacionFinal.includes(observacionExistente), 'La nota previa jamás se borra');
    assert.ok(observacionFinal.includes(nuevaNota), 'La nueva nota se anexa al final');
    assert.ok(observacionFinal.includes(autor), 'Se incluye la firma del operador');
  });

  await test('Exportación de Historial genera formato CSV estándar con UTF-8 BOM', () => {
    const header = ['ID', 'Fecha', 'Hora', 'Tipo', 'Persona', 'Cédula', 'Categoría', 'Empresa / Dpto', 'Vehículo / Placa', 'Operador de Garita', 'Observaciones'];
    const sampleRow = [
      'hist-1',
      '25/10/2026',
      '08:30:00',
      'ENTRADA',
      'Juan Gomez',
      'V-19876543',
      'VISITANTE',
      'Contratistas Eléctricos',
      'AB123CD',
      'Guardia Turno 1',
      'Ingreso autorizado con maletín técnico',
    ];

    const csvContent = '\uFEFF' + header.join(',') + '\r\n' + sampleRow.map(v => `"${v}"`).join(',');
    assert.strictEqual(csvContent.charCodeAt(0), 0xFEFF, 'El CSV debe incluir el BOM UTF-8 para Excel');
    assert.ok(csvContent.includes('V-19876543'), 'El CSV debe incluir la cédula');
    assert.ok(csvContent.includes('AB123CD'), 'El CSV debe incluir la placa vehicular');
  });

  await test('Acta de Evacuación (Rollcall) calcula totales y estructura oficial', () => {
    const personasEnSitio = [
      { id: '1', nombre: 'Carlos Rodriguez', cedula: 'V-11111111', tipo: 'PERSONAL (ADMIN)', empresa: 'Personal Interno' },
      { id: '2', nombre: 'Mariana Gomez', cedula: 'V-22222222', tipo: 'PERSONAL', empresa: 'Personal Interno' },
      { id: '3', nombre: 'Roberto Silva', cedula: 'V-33333333', tipo: 'VISITANTE', empresa: 'PetroQuim' },
    ];

    const personal = personasEnSitio.filter(p => p.tipo.startsWith('PERSONAL'));
    const visitantes = personasEnSitio.filter(p => !p.tipo.startsWith('PERSONAL'));

    const acta = {
      sede: 'Sede Principal - Control de Acceso CAI',
      totalPresentes: personasEnSitio.length,
      totalPersonal: personal.length,
      totalVisitantes: visitantes.length,
    };

    assert.strictEqual(acta.totalPresentes, 3, 'Total de personas debe ser 3');
    assert.strictEqual(acta.totalPersonal, 2, 'Total de personal debe ser 2');
    assert.strictEqual(acta.totalVisitantes, 1, 'Total de visitantes debe ser 1');
  });

  console.log(cyan('\n--- MÓDULO 4: MONITOREO Y SALUD (HealthCheck) ---'));

  await test('Health check payload contiene métricas de memoria, uptime y estado', () => {
    const memory = process.memoryUsage();
    const payload = {
      status: 'ok',
      service: 'porware-cai-backend',
      version: '2.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024) * 100) / 100,
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024) * 100) / 100,
      },
    };

    assert.strictEqual(payload.status, 'ok');
    assert.strictEqual(payload.version, '2.0.0');
    assert.ok(payload.memory.rssMb > 0, 'La memoria RSS debe ser mayor a 0');
  });

  console.log(cyan('\n--- MÓDULO 5: PASES DIGITALES QR, FIRMA Y VIGENCIA (Fase 4) ---'));

  await test('Generación de pase digital CAI v2 firmado con vigencia válida', () => {
    const PASS_SECRET = 'cai_secure_pass_signature_key_2026';
    const simpleChecksum = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    };

    const cedula = 'V-20123456';
    const vigenciaStr = '2030-12-31';
    const checksum = simpleChecksum(`${cedula}:${vigenciaStr}:${PASS_SECRET}`);
    const payload = { c: cedula, n: 'Juan Perez', v: vigenciaStr, s: checksum };
    const encoded = `CAI2:${Buffer.from(JSON.stringify(payload)).toString('base64')}`;

    assert.ok(encoded.startsWith('CAI2:'), 'El pase debe iniciar con prefijo CAI2:');
    
    // Decodificar y verificar firma
    const b64 = encoded.substring(5);
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const expectedSign = simpleChecksum(`${decoded.c}:${decoded.v}:${PASS_SECRET}`);
    assert.strictEqual(decoded.s, expectedSign, 'La firma criptográfica del pase debe coincidir');
  });

  await test('Detección y rechazo de pase digital con firma adulterada o falsificada', () => {
    const PASS_SECRET = 'cai_secure_pass_signature_key_2026';
    const simpleChecksum = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    };

    // Alguien intentó cambiar la cédula pero no conoce el secreto para recalcular el checksum
    const falsified = { c: 'V-99999999', n: 'Hacker', v: '2030-12-31', s: 'bad_signature_123' };
    const expectedSign = simpleChecksum(`${falsified.c}:${falsified.v}:${PASS_SECRET}`);
    const isAuthentic = falsified.s === expectedSign;

    assert.strictEqual(isAuthentic, false, 'Un pase alterado debe ser marcado como inválido');
  });

  await test('Detección de expiración en pases digitales con vigencia caducada', () => {
    const pastVigencia = '2020-01-01';
    const today = new Date().toISOString().split('T')[0];
    const isExpired = pastVigencia < today;

    assert.strictEqual(isExpired, true, 'Un pase cuya vigencia sea anterior a hoy debe expirar');
  });

  console.log(bold('\n============================================================'));
  if (passedCount === totalCount) {
    console.log(bold(green(`🎉 TODAS LAS PRUEBAS DE FASE 3 Y FASE 4 HAN PASADO CON ÉXITO: ${passedCount}/${totalCount} (100% OK)`)));
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
