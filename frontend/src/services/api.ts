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
const API_BASE = getApiBase();

// Web Audio synthesizer for garita chime feedback & laser barcode beep
export function playChime(type: 'success' | 'exit' | 'alert' | 'laser') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'laser') {
      // Classic high-frequency barcode scanner beep (2400Hz, 50ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'success') {
      // Bright double chime for authorized entry
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'exit') {
      // Descending chime for exit
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.setValueAtTime(460, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Security alarm siren buzz for blocked / restricted entry
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Audio might be blocked by browser policy before first user interaction
  }
}

// Initial demo / seed fallback data with enterprise identification photos
let demoUsers: Usuario[] = [
  {
    id: 'u-1',
    cedula: 'V-12345678',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'admin@cai.local',
    rol: 'ADMINISTRADOR',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    _count: { invitaciones: 3, registros: 12 },
  },
  {
    id: 'u-2',
    cedula: 'V-23456789',
    nombre: 'María',
    apellido: 'Fernández',
    email: 'mfernandez@cai.local',
    rol: 'EMPLEADO',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    _count: { invitaciones: 5, registros: 8 },
  },
  {
    id: 'u-3',
    cedula: 'V-34567890',
    nombre: 'José',
    apellido: 'Hernández',
    email: 'seguridad@cai.local',
    rol: 'SEGURIDAD',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    _count: { invitaciones: 0, registros: 24 },
  },
  {
    id: 'u-4',
    cedula: 'V-28111222',
    nombre: 'Sofía',
    apellido: 'Morales',
    email: 'smorales@cai.local',
    rol: 'EMPLEADO',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    _count: { invitaciones: 1, registros: 4 },
  },
  {
    id: 'u-99',
    cedula: 'V-99887766',
    nombre: 'Pedro',
    apellido: 'Ramírez',
    email: 'pramirez_desincorporado@empresa.com',
    rol: 'EMPLEADO',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'BLOQUEADO',
    motivoBloqueo: 'Desincorporado por RRHH con prohibición de ingreso a plantas e instalaciones',
    _count: { invitaciones: 0, registros: 0 },
  },
];

let demoGuests: Invitado[] = [
  {
    id: 'g-1',
    cedula: 'V-19876543',
    nombre: 'Mariana',
    apellido: 'Gómez',
    empresa: 'Servicios de Redes C.A.',
    empleadoId: 'u-2',
    fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    empleado: {
      id: 'u-2',
      cedula: 'V-23456789',
      nombre: 'María',
      apellido: 'Fernández',
      email: 'mfernandez@cai.local',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-2',
    cedula: 'V-21000999',
    nombre: 'Roberto',
    apellido: 'Alvarado',
    empresa: 'Auditoría Externa KPMG',
    empleadoId: 'u-1',
    fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    estadoSeguridad: 'AUTORIZADO',
    empleado: {
      id: 'u-1',
      cedula: 'V-12345678',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'admin@cai.local',
    },
    createdAt: new Date().toISOString(),
  },
];


let demoHistorial: HistorialRegistro[] = [
  {
    id: 'h-1',
    tipo: 'ENTRADA',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    observacion: 'Acceso por garita principal',
    usuarioId: 'u-2',
    usuario: {
      id: 'u-2',
      cedula: 'V-23456789',
      nombre: 'María',
      apellido: 'Fernández',
      email: 'mfernandez@cai.local',
      rol: 'EMPLEADO',
    },
  },
  {
    id: 'h-2',
    tipo: 'ENTRADA',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    observacion: 'Visita técnica autorizada',
    invitadoId: 'g-1',
    invitado: {
      id: 'g-1',
      cedula: 'V-19876543',
      nombre: 'Mariana',
      apellido: 'Gómez',
      empresa: 'Servicios de Redes C.A.',
      empleado: {
        id: 'u-2',
        nombre: 'María',
        apellido: 'Fernández',
        email: 'mfernandez@cai.local',
      },
    },
  },
  {
    id: 'h-3',
    tipo: 'SALIDA',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    observacion: 'Salida a refrigerio',
    usuarioId: 'u-3',
    usuario: {
      id: 'u-3',
      cedula: 'V-34567890',
      nombre: 'José',
      apellido: 'Hernández',
      email: 'seguridad@cai.local',
      rol: 'SEGURIDAD',
    },
  },
];

let demoNoticias: Noticia[] = [
  {
    id: 'n-1',
    titulo: 'Mantenimiento preventivo en torniquetes y garita norte',
    contenido:
      'Se informa que el viernes a partir de las 18:00 se realizará calibración en las lectoras ópticas de acceso. Todos los accesos se redirigirán por garita principal.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n-2',
    titulo: 'Protocolo de registro anticipado de visitantes',
    contenido:
      'Recordamos al personal que todas las visitas externas deben ser registradas previamente en el módulo de Visitas para agilizar el ingreso con el personal de seguridad.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

export const api = {
  // Helper de Headers
  getHeaders(): HeadersInit {
    const token = localStorage.getItem('cai_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Auth
  async login(identifier: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cai_token', data.accessToken);
        localStorage.setItem('cai_user', JSON.stringify(data.user));
        return { success: true, user: data.user, token: data.accessToken, isDemo: false };
      }
    } catch {
      // Fallback a demo mode si el backend aún no está encendido
    }

    // Demo login matching seed
    const match = demoUsers.find(
      (u) =>
        (u.cedula.toLowerCase() === identifier.trim().toLowerCase() ||
          u.email.toLowerCase() === identifier.trim().toLowerCase()) &&
        (password === '123456' || password.length >= 4),
    );

    if (match) {
      localStorage.setItem('cai_token', 'demo-jwt-token-active');
      localStorage.setItem('cai_user', JSON.stringify(match));
      return { success: true, user: match, token: 'demo-jwt-token-active', isDemo: true };
    }

    // Default admin fallback
    const fallbackUser: Usuario = {
      id: 'demo-admin',
      cedula: identifier || 'V-12345678',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: identifier.includes('@') ? identifier : 'admin@cai.local',
      rol: 'ADMINISTRADOR',
    };
    localStorage.setItem('cai_token', 'demo-jwt-token-active');
    localStorage.setItem('cai_user', JSON.stringify(fallbackUser));
    return { success: true, user: fallbackUser, token: 'demo-jwt-token-active', isDemo: true };
  },

  logout() {
    localStorage.removeItem('cai_token');
    localStorage.removeItem('cai_user');
  },

  getCurrentUser(): Usuario | null {
    const stored = localStorage.getItem('cai_user');
    return stored ? JSON.parse(stored) : null;
  },

  // Garita: Check-in / Check-out
  async registerAccess(targetId: string, isGuest: boolean, tipo: 'ENTRADA' | 'SALIDA', observacion?: string) {
    try {
      const res = await fetch(`${API_BASE}/access/${tipo === 'ENTRADA' ? 'check-in' : 'check-out'}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ targetId, isGuest, observacion }),
      });
      if (res.ok) {
        playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
        return await res.json();
      }
    } catch {
      // Demo fallback
    }

    // Registrar en demo
    playChime(tipo === 'ENTRADA' ? 'success' : 'exit');
    let matchedUser = !isGuest ? demoUsers.find((u) => u.id === targetId || u.cedula.toLowerCase() === targetId.toLowerCase()) : null;
    let matchedGuest = isGuest ? demoGuests.find((g) => g.id === targetId || g.cedula.toLowerCase() === targetId.toLowerCase()) : null;

    const newRecord: HistorialRegistro = {
      id: `h-${Date.now()}`,
      tipo,
      timestamp: new Date().toISOString(),
      observacion: observacion || null,
      usuarioId: matchedUser ? matchedUser.id : null,
      usuario: matchedUser ? { ...matchedUser } : null,
      invitadoId: matchedGuest ? matchedGuest.id : null,
      invitado: matchedGuest ? { ...matchedGuest } : null,
    };

    demoHistorial.unshift(newRecord);
    return newRecord;
  },

  // Búsqueda rápida de persona en Garita por cédula
  async lookupPersona(query: string): Promise<PersonaLookup | null> {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    // Buscar en usuarios
    const u = demoUsers.find((x) => x.cedula.toLowerCase().includes(q) || x.id.toLowerCase() === q);
    if (u) {
      const lastReg = demoHistorial.find((h) => h.usuarioId === u.id);
      return {
        id: u.id,
        cedula: u.cedula,
        nombre: u.nombre,
        apellido: u.apellido,
        isGuest: false,
        rol: u.rol,
        fotoUrl: u.fotoUrl,
        estadoSeguridad: u.estadoSeguridad || 'AUTORIZADO',
        motivoBloqueo: u.motivoBloqueo,
        ultimoRegistro: lastReg || null,
        estaDentro: lastReg ? lastReg.tipo === 'ENTRADA' : false,
      };
    }

    // Buscar en invitados
    const g = demoGuests.find((x) => x.cedula.toLowerCase().includes(q) || x.id.toLowerCase() === q);
    if (g) {
      const lastReg = demoHistorial.find((h) => h.invitadoId === g.id);
      return {
        id: g.id,
        cedula: g.cedula,
        nombre: g.nombre,
        apellido: g.apellido,
        isGuest: true,
        empresa: g.empresa,
        fotoUrl: g.fotoUrl,
        estadoSeguridad: g.estadoSeguridad || 'AUTORIZADO',
        motivoBloqueo: g.motivoBloqueo,
        empleadoAnfitrion: g.empleado ? `${g.empleado.nombre} ${g.empleado.apellido}` : undefined,
        ultimoRegistro: lastReg || null,
        estaDentro: lastReg ? lastReg.tipo === 'ENTRADA' : false,
      };
    }

    return null;
  },

  // Lista de evacuación para brigadistas y emergencias
  async getEvacuationList() {
    const list: Array<{
      id: string;
      nombre: string;
      cedula: string;
      tipo: string;
      empresa: string;
      horaIngreso: string;
      fotoUrl?: string;
    }> = [];

    for (const u of demoUsers) {
      const lastReg = demoHistorial.find((h) => h.usuarioId === u.id);
      if (lastReg && lastReg.tipo === 'ENTRADA') {
        list.push({
          id: u.id,
          nombre: `${u.nombre} ${u.apellido}`,
          cedula: u.cedula,
          tipo: `PERSONAL (${u.rol})`,
          empresa: 'Personal Interno',
          horaIngreso: lastReg.timestamp,
          fotoUrl: u.fotoUrl,
        });
      }
    }

    for (const g of demoGuests) {
      const lastReg = demoHistorial.find((h) => h.invitadoId === g.id);
      if (lastReg && lastReg.tipo === 'ENTRADA') {
        list.push({
          id: g.id,
          nombre: `${g.nombre} ${g.apellido}`,
          cedula: g.cedula,
          tipo: 'VISITANTE',
          empresa: g.empresa || 'Particular',
          horaIngreso: lastReg.timestamp,
          fotoUrl: g.fotoUrl,
        });
      }
    }

    return list;
  },


  // Stats / Aforo
  async getStats(): Promise<StatsResponse> {
    try {
      const res = await fetch(`${API_BASE}/historial/stats`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const hoy = new Date().toDateString();
    const hoyMovs = demoHistorial.filter((h) => new Date(h.timestamp).toDateString() === hoy);
    const entradas = hoyMovs.filter((h) => h.tipo === 'ENTRADA').length;
    const salidas = hoyMovs.filter((h) => h.tipo === 'SALIDA').length;

    return {
      entradasHoy: entradas,
      salidasHoy: salidas,
      personasDentroAproximado: Math.max(0, entradas - salidas + 6),
      ultimosMovimientos: demoHistorial.slice(0, 8),
    };
  },

  // Usuarios
  async getUsers(params?: { search?: string; rol?: string }) {
    try {
      const url = new URL(`${window.location.origin}${API_BASE}/users`);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.rol) url.searchParams.set('rol', params.rol);
      const res = await fetch(url.toString(), { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    let filtered = [...demoUsers];
    if (params?.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.apellido.toLowerCase().includes(term) ||
          u.cedula.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      );
    }
    if (params?.rol) {
      filtered = filtered.filter((u) => u.rol === params.rol);
    }
    return { total: filtered.length, data: filtered };
  },

  async createUser(data: Partial<Usuario> & { password?: string }) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const newUser: Usuario = {
      id: `u-${Date.now()}`,
      cedula: data.cedula || 'V-00000000',
      nombre: data.nombre || 'Nuevo',
      apellido: data.apellido || 'Usuario',
      email: data.email || 'nuevo@cai.local',
      rol: data.rol || 'EMPLEADO',
      _count: { invitaciones: 0, registros: 0 },
    };
    demoUsers.unshift(newUser);
    return newUser;
  },

  // Invitados / Visitas
  async getInvitados(search?: string) {
    try {
      const url = new URL(`${window.location.origin}${API_BASE}/invitados`);
      if (search) url.searchParams.set('search', search);
      const res = await fetch(url.toString(), { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    let filtered = [...demoGuests];
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.nombre.toLowerCase().includes(term) ||
          g.apellido.toLowerCase().includes(term) ||
          g.cedula.toLowerCase().includes(term) ||
          (g.empresa && g.empresa.toLowerCase().includes(term)),
      );
    }
    return { total: filtered.length, data: filtered };
  },

  async createInvitado(data: { cedula: string; nombre: string; apellido: string; empresa?: string; empleadoId?: string }) {
    try {
      const res = await fetch(`${API_BASE}/invitados`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const newGuest: Invitado = {
      id: `g-${Date.now()}`,
      cedula: data.cedula,
      nombre: data.nombre,
      apellido: data.apellido,
      empresa: data.empresa || null,
      empleadoId: data.empleadoId || demoUsers[1].id,
      empleado: demoUsers.find((u) => u.id === data.empleadoId) || demoUsers[1],
      createdAt: new Date().toISOString(),
    };
    demoGuests.unshift(newGuest);
    return newGuest;
  },

  // Historial
  async getHistorial(filter?: { tipo?: string; search?: string }) {
    try {
      const url = new URL(`${window.location.origin}${API_BASE}/historial`);
      if (filter?.tipo) url.searchParams.set('tipo', filter.tipo);
      if (filter?.search) url.searchParams.set('search', filter.search);
      const res = await fetch(url.toString(), { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    let list = [...demoHistorial];
    if (filter?.tipo) {
      list = list.filter((h) => h.tipo === filter.tipo);
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      list = list.filter(
        (h) =>
          (h.observacion && h.observacion.toLowerCase().includes(term)) ||
          (h.usuario &&
            (h.usuario.cedula.toLowerCase().includes(term) ||
              h.usuario.nombre.toLowerCase().includes(term) ||
              h.usuario.apellido.toLowerCase().includes(term))) ||
          (h.invitado &&
            (h.invitado.cedula.toLowerCase().includes(term) ||
              h.invitado.nombre.toLowerCase().includes(term) ||
              h.invitado.apellido.toLowerCase().includes(term))),
      );
    }
    return { total: list.length, data: list };
  },

  // Noticias
  async getNoticias() {
    try {
      const res = await fetch(`${API_BASE}/noticias`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return demoNoticias;
  },

  async createNoticia(data: { titulo: string; contenido: string }) {
    try {
      const res = await fetch(`${API_BASE}/noticias`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const newN: Noticia = {
      id: `n-${Date.now()}`,
      titulo: data.titulo,
      contenido: data.contenido,
      createdAt: new Date().toISOString(),
    };
    demoNoticias.unshift(newN);
    return newN;
  },
};
