/**
 * Utilidad de generación de imagen QR local para pases firmados en el Backend (HMAC-SHA256)
 * El secreto criptográfico y la firma residen exclusivamente en el backend (CAI2:<payload>.<firma>).
 */
import QRCode from 'qrcode';

/**
 * Verifica si una cadena leída por el escáner corresponde a un pase firmado CAI2
 */
export function isSignedQrString(raw: string): boolean {
  return raw.trim().startsWith('CAI2:');
}

/**
 * Genera un DataURL PNG del código QR de forma 100% local a partir del token firmado por el backend
 */
export async function generateLocalQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generando QR local:', err);
    return '';
  }
}
