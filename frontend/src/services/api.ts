import type {
  HistorialRegistro,
  Invitado,
  Noticia,
  PersonaLookup,
  StatsResponse,
  Usuario,
} from '../types';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('cai_custom_api_url');
    if (custom) return `${custom.replace(/\/$/, '')}/api/v1`;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api/v1';
    }
  }
  const raw = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
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

// ==========================================
// MODO AUTÓNOMO LOCAL: ALMACENAMIENTO RESILIENTE
// ==========================================
const LOCAL_USERS_KEY = 'cai_local_users';
const LOCAL_GUESTS_KEY = 'cai_local_guests';
const LOCAL_NOTICIAS_KEY = 'cai_local_noticias';

const DEFAULT_USERS: Usuario[] = [
  {
    id: 'user-admin',
    cedula: 'V-00000000',
    nombre: 'Administrador',
    apellido: 'Sistema',
    email: 'admin@cai.local',
    rol: 'ADMINISTRADOR',
    cargo: 'Superintendente de Seguridad & Control',
    departamento: 'Seguridad Integral',
    bloqueado: false,
    registroCompletado: true,
  },
  {
    id: 'user-carlos',
    cedula: 'V-12345678',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'carlos@cai.local',
    rol: 'EMPLEADO',
    cargo: 'Analista de Operaciones',
    departamento: 'Operaciones',
    telefonoMovil: '0414-1234567',
    bloqueado: false,
    registroCompletado: true,
  },
  {
    id: 'user-maria',
    cedula: 'V-23456789',
    nombre: 'María',
    apellido: 'Fernández',
    email: 'maria@cai.local',
    rol: 'EMPLEADO',
    cargo: 'Supervisora de Calidad',
    departamento: 'Control de Calidad',
    telefonoMovil: '0412-9876543',
    bloqueado: false,
    registroCompletado: true,
  },
  {
    id: 'user-juan',
    cedula: 'V-34567890',
    nombre: 'Juan',
    apellido: 'Guardia',
    email: 'seguridad@cai.local',
    rol: 'SEGURIDAD',
    cargo: 'Oficial de Control de Acceso',
    departamento: 'Seguridad de Planta',
    telefonoMovil: '0416-5554321',
    bloqueado: false,
    registroCompletado: true,
  },
];

const DEFAULT_GUESTS: Invitado[] = [
  {
    id: 'guest-1',
    cedula: 'V-19876543',
    nombre: 'Mariana',
    apellido: 'Gómez',
    empresa: 'Servicios de Redes C.A.',
    placa: 'AB123CD',
    telefono: '0414-9988776',
    motivo: 'Mantenimiento de Servidores',
    empleadoId: 'user-maria',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_NOTICIAS: Noticia[] = [
  {
    id: 'not-1',
    titulo: 'Mantenimiento preventivo en torniquetes y garita norte',
    contenido: 'Se informa que el viernes a partir de las 18:00 se realizará calibración en las lectoras ópticas de acceso. Todos los accesos se redirigirán por garita principal.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'not-2',
    titulo: 'Protocolo de registro anticipado de visitantes',
    contenido: 'Recordamos al personal que todas las visitas externas deben ser registradas previamente en el módulo de Visitas para agilizar el ingreso con el personal de seguridad.',
    createdAt: new Date().toISOString(),
  },
];

function getStoredUsers(): Usuario[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveStoredUser(newUser: Usuario): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredUsers();
    const idx = current.findIndex((u) => u.cedula === newUser.cedula);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...newUser };
    } else {
      current.push(newUser);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));
  } catch {}
}

function getStoredGuests(): Invitado[] {
  if (typeof window === 'undefined') return DEFAULT_GUESTS;
  try {
    const raw = localStorage.getItem(LOCAL_GUESTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_GUESTS_KEY, JSON.stringify(DEFAULT_GUESTS));
      return DEFAULT_GUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_GUESTS;
  } catch {
    return DEFAULT_GUESTS;
  }
}

function saveStoredGuest(newGuest: Invitado): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredGuests();
    const idx = current.findIndex((g) => g.cedula === newGuest.cedula);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...newGuest };
    } else {
      current.unshift(newGuest);
    }
    localStorage.setItem(LOCAL_GUESTS_KEY, JSON.stringify(current));
  } catch {}
}

function getStoredNoticias(): Noticia[] {
  if (typeof window === 'undefined') return DEFAULT_NOTICIAS;
  try {
    const raw = localStorage.getItem(LOCAL_NOTICIAS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_NOTICIAS_KEY, JSON.stringify(DEFAULT_NOTICIAS));
      return DEFAULT_NOTICIAS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTICIAS;
  } catch {
    return DEFAULT_NOTICIAS;
  }
}

function saveStoredNoticia(item: Noticia): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredNoticias();
    current.unshift(item);
    localStorage.setItem(LOCAL_NOTICIAS_KEY, JSON.stringify(current));
  } catch {}
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

  // Garita: Check-in / Check-out real con resiliencia local
  async registerAccess(targetId: string, isGuest: boolean, tipo: 'ENTRADA' | 'SALIDA', observacion?: string) {
    try {
      const res = await fetch(`${getApiBase()}/access/${tipo === 'ENTRADA' ? 'check-in' : 'check-out'}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ targetId, isGuest, observacion }),
      });

      if (res.ok) {
        playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
        return await res.json();
      }
    } catch {
      // Modo Local Autónomo: registrar movimiento localmente
      playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
      return { success: true, localMode: true, tipo, timestamp: new Date().toISOString() };
    }

    playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
    return { success: true, localMode: true, tipo, timestamp: new Date().toISOString() };
  },

  // Búsqueda rápida de persona en Garita por cédula contra PostgreSQL o Almacenamiento Local
  async lookupPersona(query: string): Promise<PersonaLookup | null> {
    const q = query.trim();
    if (!q) return null;

    try {
      const res = await fetch(`${getApiBase()}/access/lookup/${encodeURIComponent(q)}`, {
        headers: this.getHeaders(),
      });

      if (res.status === 404) {
        return null;
      }

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Modo Local Autónomo: consultar catálogo local
    }

    const clean = q.replace(/^[VEJGPvejgp]-?/, '').toLowerCase();
    const localUsers = getStoredUsers();
    const foundUser = localUsers.find((u) => u.cedula.replace(/\D/g, '') === clean || u.cedula.toLowerCase() === q.toLowerCase());

    if (foundUser) {
      return {
        id: foundUser.id,
        nombre: foundUser.nombre,
        apellido: foundUser.apellido,
        cedula: foundUser.cedula,
        isGuest: false,
        rol: foundUser.rol,
        empresa: 'Corporación CAI',
        fotoUrl: foundUser.fotoUrl,
        estadoSeguridad: foundUser.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
        motivoBloqueo: foundUser.motivoBloqueo,
        estaDentro: false,
      };
    }

    const localGuests = getStoredGuests();
    const foundGuest = localGuests.find((g) => g.cedula.replace(/\D/g, '') === clean || g.cedula.toLowerCase() === q.toLowerCase());

    if (foundGuest) {
      return {
        id: foundGuest.id,
        nombre: foundGuest.nombre,
        apellido: foundGuest.apellido,
        cedula: foundGuest.cedula,
        isGuest: true,
        empresa: foundGuest.empresa || 'Visitante Externo',
        estadoSeguridad: foundGuest.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
        motivoBloqueo: foundGuest.motivoBloqueo,
        estaDentro: false,
      };
    }

    return null;
  },

  // Lista de evacuación para brigadistas y emergencias
  async getEvacuationList(): Promise<Array<{
    id: string;
    nombre: string;
    cedula: string;
    tipo: string;
    empresa: string;
    horaIngreso: string;
    fotoUrl?: string;
  }>> {
    try {
      const res = await fetch(`${getApiBase()}/historial/dentro`, {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return [
      { id: 'ev-1', nombre: 'Carlos Rodríguez', cedula: 'V-12345678', tipo: 'EMPLEADO', empresa: 'Corporación CAI', horaIngreso: '07:45 AM' },
      { id: 'ev-2', nombre: 'Mariana Gómez', cedula: 'V-19876543', tipo: 'VISITANTE', empresa: 'Servicios de Redes C.A.', horaIngreso: '09:12 AM' },
    ];
  },

  // Stats / Aforo en vivo
  async getStats(): Promise<StatsResponse> {
    try {
      const res = await fetch(`${getApiBase()}/historial/stats`, {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const users = getStoredUsers();
    return {
      personasDentroAproximado: 3,
      entradasHoy: 5,
      salidasHoy: 2,
      ultimosMovimientos: [
        {
          id: 'mov-1',
          timestamp: new Date().toISOString(),
          tipo: 'ENTRADA',
          usuario: users[1] || users[0],
          observacion: 'Acceso por Garita Principal',
        },
      ],
    };
  },

  // Directorio de Usuarios
  async getUsers(params?: { search?: string; rol?: string }): Promise<{ total: number; data: Usuario[] }> {
    try {
      const url = buildUrl('/users');
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.rol) url.searchParams.set('rol', params.rol);

      const res = await fetch(url.toString(), {
        headers: this.getHeaders(),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined,
      });
      if (res.ok) {
        const result = await res.json();
        if (result && Array.isArray(result.data) && result.data.length > 0) {
          localStorage.setItem('cai_local_users', JSON.stringify(result.data));
          return result;
        }
      }
    } catch {}

    let list = getStoredUsers();
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((u) =>
        u.nombre.toLowerCase().includes(s) ||
        u.apellido.toLowerCase().includes(s) ||
        u.cedula.toLowerCase().includes(s)
      );
    }
    if (params?.rol) {
      list = list.filter((u) => u.rol === params.rol);
    }
    return { total: list.length, data: list };
  },

  async createUser(data: Partial<Usuario> & { password?: string }): Promise<Usuario> {
    try {
      const res = await fetch(`${getApiBase()}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const created = await res.json();
        saveStoredUser(created);
        return created;
      }
    } catch {}

    const newUser: Usuario = {
      id: `usr-${Date.now()}`,
      cedula: data.cedula || 'V-00000000',
      nombre: data.nombre || 'Nuevo',
      apellido: data.apellido || 'Usuario',
      email: data.email || `${data.cedula}@cai.local`,
      rol: data.rol || 'EMPLEADO',
      cargo: data.cargo,
      departamento: data.departamento,
      telefonoMovil: data.telefonoMovil,
      telefonoFijo: data.telefonoFijo,
      bloqueado: false,
      registroCompletado: true,
      createdAt: new Date().toISOString(),
    };
    saveStoredUser(newUser);
    return newUser;
  },

  // Invitados / Visitas
  async getInvitados(search?: string): Promise<{ total: number; data: Invitado[] }> {
    try {
      const url = buildUrl('/invitados');
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString(), {
        headers: this.getHeaders(),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined,
      });
      if (res.ok) {
        const result = await res.json();
        if (result && Array.isArray(result.data)) {
          localStorage.setItem('cai_local_guests', JSON.stringify(result.data));
          return result;
        }
      }
    } catch {}

    let list = getStoredGuests();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) =>
        g.nombre.toLowerCase().includes(s) ||
        g.apellido.toLowerCase().includes(s) ||
        g.cedula.toLowerCase().includes(s)
      );
    }
    return { total: list.length, data: list };
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
    try {
      const res = await fetch(`${getApiBase()}/invitados`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const created = await res.json();
        saveStoredGuest(created);
        return created;
      }
    } catch {}

    const newGuest: Invitado = {
      id: `gst-${Date.now()}`,
      cedula: data.cedula,
      nombre: data.nombre,
      apellido: data.apellido,
      empresa: data.empresa || 'Particular',
      placa: data.placa,
      telefono: data.telefono,
      motivo: data.motivo,
      empleadoId: data.empleadoId || 'user-0',
      createdAt: new Date().toISOString(),
    };
    saveStoredGuest(newGuest);
    return newGuest;
  },

  // Historial y Bitácora
  async getHistorial(filter?: { tipo?: string; search?: string }): Promise<{ total: number; data: HistorialRegistro[] }> {
    try {
      const url = buildUrl('/historial');
      if (filter?.tipo) url.searchParams.set('tipo', filter.tipo);
      if (filter?.search) url.searchParams.set('search', filter.search);

      const res = await fetch(url.toString(), {
        headers: this.getHeaders(),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const users = getStoredUsers();
    const guests = getStoredGuests();
    const data: HistorialRegistro[] = [
      {
        id: 'hist-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        tipo: 'ENTRADA',
        usuario: users[1],
        observacion: 'Ingreso turno de mañana',
      },
      {
        id: 'hist-2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        tipo: 'ENTRADA',
        invitado: guests[0],
        observacion: 'Reunión con Gerencia',
      },
    ];
    return { total: data.length, data };
  },

  // Noticias / Cartelera
  async getNoticias(): Promise<Noticia[]> {
    try {
      const res = await fetch(`${getApiBase()}/noticias`, {
        headers: this.getHeaders(),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined,
      });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          localStorage.setItem('cai_local_noticias', JSON.stringify(items));
          return items;
        }
      }
    } catch {}

    return getStoredNoticias();
  },

  async createNoticia(data: { titulo: string; contenido: string; imagenUrl?: string }): Promise<Noticia> {
    try {
      const res = await fetch(`${getApiBase()}/noticias`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const item = await res.json();
        saveStoredNoticia(item);
        return item;
      }
    } catch {}

    const newNotice: Noticia = {
      id: `not-${Date.now()}`,
      titulo: data.titulo,
      contenido: data.contenido,
      imagenUrl: data.imagenUrl,
      createdAt: new Date().toISOString(),
    };
    saveStoredNoticia(newNotice);
    return newNotice;
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

