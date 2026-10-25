import type {
  HistorialRegistro,
  Invitado,
  Noticia,
  PersonaLookup,
  StatsResponse,
  Usuario,
} from '../types';

export function getApiBase(): string {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('cai_custom_api_url') : null;
  const raw = custom || ((import.meta as any).env?.VITE_API_URL || 'http://192.168.10.8:3000');
  return `${raw.replace(/\/$/, '')}/api/v1`;
}

function buildUrl(endpoint: string): URL {
  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(`${base}${cleanEndpoint}`);
  }
  return new URL(`${window.location.origin}${base}${cleanEndpoint}`);
}

// Web Audio synthesizer for garita chime feedback & laser barcode beep
export function playChime(type: 'success' | 'exit' | 'alert' | 'laser') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'laser') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'exit') {
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.setValueAtTime(460, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Audio context may require user gesture on some browsers
  }
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem('cai_token');
  },

  getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Auth real (Fase 0: Honestidad - sin fallbacks demo falsos)
  async login(identifier: string, password: string) {
    const res = await fetch(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciales inválidas o usuario no registrado');
    }

    const data = await res.json();
    localStorage.setItem('cai_token', data.accessToken);
    localStorage.setItem('cai_user', JSON.stringify(data.user));
    return { success: true, user: data.user, token: data.accessToken };
  },

  logout() {
    localStorage.removeItem('cai_token');
    localStorage.removeItem('cai_user');
  },

  getCurrentUser(): Usuario | null {
    const token = this.getToken();
    const stored = localStorage.getItem('cai_user');
    if (!token || !stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  // Paridad sistema original: Verificación de Pre-registro por cédula
  async checkPreRegistro(cedula: string): Promise<{
    preregistrado: boolean;
    completado: boolean;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    cargo?: string;
    departamento?: string;
  }> {
    const res = await fetch(`${getApiBase()}/auth/check-preregistro/${encodeURIComponent(cedula.trim())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Cédula no pre-registrada por la administración');
    }
    return await res.json();
  },

  // Paridad sistema original: Auto-registro del empleado
  async completeRegistro(data: {
    cedula: string;
    password: string;
    email?: string;
    cargo?: string;
    departamento?: string;
    telefonoMovil?: string;
    telefonoFijo?: string;
  }) {
    const res = await fetch(`${getApiBase()}/auth/complete-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al completar auto-registro');
    }

    const resData = await res.json();
    localStorage.setItem('cai_token', resData.accessToken);
    localStorage.setItem('cai_user', JSON.stringify(resData.user));
    return { success: true, user: resData.user, token: resData.accessToken };
  },

  // Perfil del usuario autenticado
  async getProfile(): Promise<Usuario> {
    const res = await fetch(`${getApiBase()}/auth/profile`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener perfil');
    }

    const user = await res.json();
    localStorage.setItem('cai_user', JSON.stringify(user));
    return user;
  },

  // Paridad sistema original: Modificar mi propio perfil
  async updateProfile(data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    cargo?: string;
    departamento?: string;
    telefonoMovil?: string;
    telefonoFijo?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<Usuario> {
    const res = await fetch(`${getApiBase()}/auth/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar perfil');
    }

    const updated = await res.json();
    localStorage.setItem('cai_user', JSON.stringify(updated));
    return updated;
  },

  // Garita: Check-in / Check-out real
  async registerAccess(targetId: string, isGuest: boolean, tipo: 'ENTRADA' | 'SALIDA', observacion?: string) {
    const res = await fetch(`${getApiBase()}/access/${tipo === 'ENTRADA' ? 'check-in' : 'check-out'}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetId, isGuest, observacion }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al registrar ${tipo.toLowerCase()} en el servidor`);
    }

    playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
    return await res.json();
  },

  // Búsqueda rápida de persona en Garita por cédula contra PostgreSQL
  async lookupPersona(query: string): Promise<PersonaLookup | null> {
    const q = query.trim();
    if (!q) return null;

    const res = await fetch(`${getApiBase()}/access/lookup/${encodeURIComponent(q)}`, {
      headers: this.getHeaders(),
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar persona en el servidor');
    }

    return await res.json();
  },

  // Lista de evacuación para brigadistas y emergencias (Roll call real desde PostgreSQL)
  async getEvacuationList(): Promise<Array<{
    id: string;
    nombre: string;
    cedula: string;
    tipo: string;
    empresa: string;
    horaIngreso: string;
    fotoUrl?: string;
  }>> {
    const res = await fetch(`${getApiBase()}/historial/dentro`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener la lista de personas dentro de la planta');
    }

    return await res.json();
  },

  // Stats / Aforo en vivo
  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${getApiBase()}/historial/stats`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener estadísticas del servidor');
    }

    return await res.json();
  },

  // Directorio de Usuarios
  async getUsers(params?: { search?: string; rol?: string }): Promise<{ total: number; data: Usuario[] }> {
    const url = buildUrl('/users');
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.rol) url.searchParams.set('rol', params.rol);

    const res = await fetch(url.toString(), { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener usuarios del servidor');
    }

    return await res.json();
  },

  async createUser(data: Partial<Usuario> & { password?: string }): Promise<Usuario> {
    const res = await fetch(`${getApiBase()}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al crear usuario en el servidor');
    }

    return await res.json();
  },

  // Invitados / Visitas
  async getInvitados(search?: string): Promise<{ total: number; data: Invitado[] }> {
    const url = buildUrl('/invitados');
    if (search) url.searchParams.set('search', search);

    const res = await fetch(url.toString(), { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener visitantes del servidor');
    }

    return await res.json();
  },

  async createInvitado(data: {
    cedula: string;
    nombre: string;
    apellido: string;
    empresa?: string;
    placa?: string;
    telefono?: string;
    motivo?: string;
    empleadoId?: string;
  }): Promise<Invitado> {
    const res = await fetch(`${getApiBase()}/invitados`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al registrar visitante en el servidor');
    }

    return await res.json();
  },

  // Historial y Bitácora
  async getHistorial(filter?: { tipo?: string; search?: string }): Promise<{ total: number; data: HistorialRegistro[] }> {
    const url = buildUrl('/historial');
    if (filter?.tipo) url.searchParams.set('tipo', filter.tipo);
    if (filter?.search) url.searchParams.set('search', filter.search);

    const res = await fetch(url.toString(), { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar historial en el servidor');
    }

    return await res.json();
  },

  // Noticias / Cartelera
  async getNoticias(): Promise<Noticia[]> {
    const res = await fetch(`${getApiBase()}/noticias`, { headers: this.getHeaders() });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  },

  async createNoticia(data: { titulo: string; contenido: string; imagenUrl?: string }): Promise<Noticia> {
    const res = await fetch(`${getApiBase()}/noticias`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al publicar noticia en el servidor');
    }

    return await res.json();
  },

  // Exportar Historial a CSV
  async downloadHistorialCsv(filter?: { tipo?: string; search?: string; startDate?: string; endDate?: string }): Promise<void> {
    const url = buildUrl('/historial/export/csv');
    if (filter?.tipo) url.searchParams.set('tipo', filter.tipo);
    if (filter?.search) url.searchParams.set('search', filter.search);
    if (filter?.startDate) url.searchParams.set('startDate', filter.startDate);
    if (filter?.endDate) url.searchParams.set('endDate', filter.endDate);

    const res = await fetch(url.toString(), { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al exportar historial a CSV');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `historial_accesos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  // Acta Oficial de Evacuación (Roll Call)
  async getActaEvacuacion(): Promise<any> {
    const res = await fetch(`${getApiBase()}/historial/evacuacion/acta`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al generar acta de evacuación');
    }

    return await res.json();
  },

  // Auditoría Integral del Sistema (Solo Administrador)
  async getAuditoria(filter?: { entidad?: string; accion?: string; skip?: number; take?: number }): Promise<any> {
    const url = buildUrl('/auditoria');
    if (filter?.entidad) url.searchParams.set('entidad', filter.entidad);
    if (filter?.accion) url.searchParams.set('accion', filter.accion);
    if (filter?.skip !== undefined) url.searchParams.set('skip', String(filter.skip));
    if (filter?.take !== undefined) url.searchParams.set('take', String(filter.take));

    const res = await fetch(url.toString(), { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar auditoría del sistema');
    }

    return await res.json();
  },

  // Healthcheck de conexión en vivo
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBase()}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(4000) : undefined,
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

