const TEMPLATE_TOKENS = ['reemplazar', 'cambiarclave', 'cambiarporclave', 'changeme'];

export function containsTemplatePlaceholder(value: string): boolean {
  const normalized = (value || '').toLowerCase();
  return TEMPLATE_TOKENS.some((token) => normalized.includes(token));
}

export function validateInitialPassword(
  password: string | undefined,
  varName = 'INITIAL_ADMIN_PASSWORD',
): void {
  if (!password || !password.trim()) {
    throw new Error(`FATAL: La variable ${varName} es obligatoria y no puede estar vacía.`);
  }

  const trimmed = password.trim();
  if (containsTemplatePlaceholder(trimmed)) {
    throw new Error(
      `FATAL: ${varName} contiene un valor de plantilla inseguro ("reemplazar", "CambiarClave" o "changeme"). Configure una contraseña real.`,
    );
  }

  if (trimmed.length < 12) {
    throw new Error(
      `FATAL: ${varName} debe tener al menos 12 caracteres de longitud (actual: ${trimmed.length}).`,
    );
  }
}

export function validateRuntimeSecrets(env: NodeJS.ProcessEnv = process.env): void {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || !jwtSecret.trim()) {
    throw new Error('FATAL: JWT_SECRET no está definido en las variables de entorno.');
  }
  if (containsTemplatePlaceholder(jwtSecret)) {
    throw new Error(
      'FATAL: JWT_SECRET contiene un texto de plantilla ("reemplazar", "CambiarClave" o "changeme").',
    );
  }
  if (jwtSecret.trim().length < 32) {
    throw new Error(
      `FATAL: JWT_SECRET debe tener al menos 32 caracteres (actual: ${jwtSecret.trim().length}).`,
    );
  }

  if (env.QR_HMAC_SECRET && env.QR_HMAC_SECRET.trim()) {
    if (containsTemplatePlaceholder(env.QR_HMAC_SECRET)) {
      throw new Error(
        'FATAL: QR_HMAC_SECRET contiene un texto de plantilla ("reemplazar", "CambiarClave" o "changeme").',
      );
    }
  }

  if (env.POSTGRES_PASSWORD && env.POSTGRES_PASSWORD.trim()) {
    if (containsTemplatePlaceholder(env.POSTGRES_PASSWORD)) {
      throw new Error(
        'FATAL: POSTGRES_PASSWORD contiene un texto de plantilla ("reemplazar", "CambiarClave" o "changeme").',
      );
    }
  }

  if (env.DATABASE_URL && containsTemplatePlaceholder(env.DATABASE_URL)) {
    throw new Error(
      'FATAL: DATABASE_URL contiene una contraseña de plantilla ("reemplazar", "CambiarClave" o "changeme").',
    );
  }

  if (env.INITIAL_ADMIN_PASSWORD !== undefined && env.INITIAL_ADMIN_PASSWORD !== '') {
    validateInitialPassword(env.INITIAL_ADMIN_PASSWORD, 'INITIAL_ADMIN_PASSWORD');
  }
}
