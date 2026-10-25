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

  async createInvitado(data: { cedula: string; nombre: string; apellido: string; empresa?: string; empleadoId?: string }): Promise<Invitado> {
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

  async createNoticia(data: { titulo: string; contenido: string }): Promise<Noticia> {
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
};
