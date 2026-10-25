import QRCode from 'qrcode';

/**
 * Módulo de Generación y Validación de Pases Digitales QR Locales (CAI v2)
 * Cumple con directiva de auditoría: 100% local, sin enviar cédulas a servidores de terceros,
 * y con vigencia temporal y firma de integridad.
 */

// Secreto interno del cliente para verificar que el QR fue emitido por la plataforma
const PASS_SECRET = 'cai_secure_pass_signature_key_2026';

function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export interface DigitalPassPayload {
  c: string; // Cédula
  n: string; // Nombre
  v: string; // Fecha de vigencia (YYYY-MM-DD)
  p?: string; // Placa vehicular
  s: string; // Firma/Checksum
}

/**
 * Genera el payload firmado del pase digital con fecha de vigencia
 */
export function createDigitalPassPayload(params: {
  cedula: string;
  nombre: string;
  apellido: string;
  placa?: string;
  vigenciaDias?: number;
}): { encoded: string; vigencia: string; checksum: string } {
  const now = new Date();
  const vigenciaDate = new Date(now.getTime() + (params.vigenciaDias || 1) * 24 * 60 * 60 * 1000);
  const vigenciaStr = vigenciaDate.toISOString().split('T')[0];

  const cleanCedula = params.cedula.trim();
  const cleanNombre = `${params.nombre.trim()} ${params.apellido.trim()}`;
  const signInput = `${cleanCedula}:${vigenciaStr}:${PASS_SECRET}`;
  const checksum = simpleChecksum(signInput);

  const payload: DigitalPassPayload = {
    c: cleanCedula,
    n: cleanNombre,
    v: vigenciaStr,
    p: params.placa ? params.placa.trim().toUpperCase() : undefined,
    s: checksum,
  };

  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const encoded = `CAI2:${base64}`;

  return { encoded, vigencia: vigenciaStr, checksum };
}

/**
 * Valida e interpreta un código escaneado (soporta QR firmado o cédula en texto plano)
 */
export function parseScannedCode(raw: string): {
  cedula: string;
  isSignedPass: boolean;
  isValid: boolean;
  isExpired: boolean;
  vigencia?: string;
  nombre?: string;
  placa?: string;
  warning?: string;
} {
  const trimmed = raw.trim();

  // Si es un pase firmado CAI v2
  if (trimmed.startsWith('CAI2:')) {
    try {
      const b64 = trimmed.substring(5);
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const payload: DigitalPassPayload = JSON.parse(jsonStr);

      const expectedSign = simpleChecksum(`${payload.c}:${payload.v}:${PASS_SECRET}`);
      const isIntegrityValid = payload.s === expectedSign;

      const todayStr = new Date().toISOString().split('T')[0];
      const isExpired = payload.v < todayStr;

      let warning: string | undefined;
      if (!isIntegrityValid) {
        warning = '⚠️ Firma digital del pase alterada o no reconocida.';
      } else if (isExpired) {
        warning = `⛔ Pase digital VENCIDO (Vigencia expiró el ${payload.v}).`;
      }

      return {
        cedula: payload.c,
        isSignedPass: true,
        isValid: isIntegrityValid && !isExpired,
        isExpired,
        vigencia: payload.v,
        nombre: payload.n,
        placa: payload.p,
        warning,
      };
    } catch {
      return {
        cedula: trimmed,
        isSignedPass: false,
        isValid: false,
        isExpired: false,
        warning: 'Formato de pase digital corrupto.',
      };
    }
  }

  // Si fue escaneado directamente de una cédula física o código de barras estándar
  return {
    cedula: trimmed,
    isSignedPass: false,
    isValid: true,
    isExpired: false,
  };
}

/**
 * Genera el código QR de manera 100% LOCAL en el dispositivo usando Canvas
 * Nunca realiza peticiones a servidores externos, garantizando privacidad total.
 */
export async function generateLocalQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error al generar QR local:', err);
    throw err;
  }
}
