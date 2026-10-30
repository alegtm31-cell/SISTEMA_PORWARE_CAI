import * as crypto from 'crypto';

export interface SignedQrPayload {
  visitaId: string;
  invitadoId: string;
  c: string; // Cédula
  n: string; // Nombre completo
  v: string; // Fecha/hora de expiración ISO 8601
  p?: string; // Placa vehicular
}

export interface VerifiedQrResult {
  isSignedPass: boolean;
  isValidSignature: boolean;
  isExpired: boolean;
  payload?: SignedQrPayload;
  rawIdentifier: string;
  error?: string;
}

function getQrSecret(overrideSecret?: string): string {
  const secret = overrideSecret || process.env.QR_HMAC_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: QR_HMAC_SECRET o JWT_SECRET debe estar configurado en el servidor para firmar pases QR.');
  }
  return secret;
}

/**
 * Genera un token QR firmado con HMAC-SHA256 exclusivamente en el backend,
 * vinculado a un registro en la tabla Visita.
 */
export function signQrPassPayload(payload: SignedQrPayload, overrideSecret?: string): string {
  const secret = getQrSecret(overrideSecret);
  const jsonStr = JSON.stringify({
    visitaId: payload.visitaId,
    invitadoId: payload.invitadoId,
    c: payload.c.trim(),
    n: payload.n.trim(),
    v: payload.v,
    ...(payload.p ? { p: payload.p.trim().toUpperCase() } : {}),
  });

  const payloadB64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const signatureHex = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  return `CAI2:${payloadB64}.${signatureHex}`;
}

/**
 * Verifica criptográficamente en el backend un token QR escaneado (CAI2:<base64url>.<hmac_sha256>)
 * usando comparación en tiempo constante (timingSafeEqual).
 */
export function verifyQrPassToken(rawInput: string, overrideSecret?: string): VerifiedQrResult {
  const trimmed = (rawInput || '').trim();

  if (!trimmed.startsWith('CAI2:')) {
    return {
      isSignedPass: false,
      isValidSignature: true,
      isExpired: false,
      rawIdentifier: trimmed,
    };
  }

  const secret = getQrSecret(overrideSecret);
  const body = trimmed.slice(5);
  const dotIndex = body.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === body.length - 1) {
    return {
      isSignedPass: true,
      isValidSignature: false,
      isExpired: false,
      rawIdentifier: trimmed,
      error: 'Formato de pase QR inválido o adulterado (carece de firma HMAC-SHA256).',
    };
  }

  const payloadB64 = body.slice(0, dotIndex);
  const providedHex = body.slice(dotIndex + 1);

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  let isValidSignature = false;
  try {
    const providedBuf = Buffer.from(providedHex, 'hex');
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    if (providedBuf.length === expectedBuf.length) {
      isValidSignature = crypto.timingSafeEqual(providedBuf, expectedBuf);
    }
  } catch {
    isValidSignature = false;
  }

  if (!isValidSignature) {
    return {
      isSignedPass: true,
      isValidSignature: false,
      isExpired: false,
      rawIdentifier: trimmed,
      error: 'Firma criptográfica HMAC-SHA256 inválida. El pase QR fue alterado o falsificado.',
    };
  }

  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as SignedQrPayload;

    if (!payload.visitaId || !payload.invitadoId || !payload.c || !payload.v) {
      return {
        isSignedPass: true,
        isValidSignature: false,
        isExpired: false,
        rawIdentifier: trimmed,
        error: 'Estructura interna del pase QR incompleta.',
      };
    }

    const expDate = new Date(payload.v);
    const isExpired = isNaN(expDate.getTime()) || expDate.getTime() < Date.now();

    return {
      isSignedPass: true,
      isValidSignature: true,
      isExpired,
      payload,
      rawIdentifier: payload.c,
      error: isExpired ? `El pase QR expiró el ${expDate.toISOString().slice(0, 10)}.` : undefined,
    };
  } catch {
    return {
      isSignedPass: true,
      isValidSignature: false,
      isExpired: false,
      rawIdentifier: trimmed,
      error: 'No se pudo decodificar el contenido del pase QR.',
    };
  }
}
