import type {
  Usuario,
  Invitado,
  HistorialRegistro,
  Noticia,
  PersonaLookup,
  StatsSummary,
  TipoAcceso,
  PaseQrInfo,
} from '../types';
import { offlineQueue, type OfflineMovementItem } from './offlineQueue';

// Limpieza preventiva de cualquier clave residual del antiguo modo demo local
const LEGACY_KEYS = ['cai_local_users', 'cai_local_guests', 'cai_local_historial', 'cai_local_noticias'];
if (typeof window !== 'undefined') {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}

const getBaseApiUrl = () => {
  const custom = localStorage.getItem('cai_custom_api_url');
  if (custom && custom.trim()) {
    const clean = custom.trim().replace(/\/$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  return '/api/v1';
};

function getAuthHeaders(includeJson = true): Record<string, string> {
  const token = localStorage.getItem('cai_token');
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function clearSessionAndNotifyUnauthorized() {
  localStorage.removeItem('cai_token');
  localStorage.removeItem('cai_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cai:unauthorized'));
  }
}

async function parseErrorMessage(res: Response, fallbackMessage: string): Promise<{ message: string; code?: string }> {
  const errData = await res.json().catch(() => null);
  const rawMessage = errData?.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join('. ')
    : typeof rawMessage === 'string' && rawMessage.trim()
      ? rawMessage
      : fallbackMessage;
  return { message, code: errData?.code };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  fallbackError = 'Error en la solicitud al servidor',
): Promise<T> {
  const API_URL = getBaseApiUrl();
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body !== undefined),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Error de red: No se pudo conectar con el servidor CAI.');
  }

  if (res.status === 401) {
    clearSessionAndNotifyUnauthorized();
    throw new Error('Sesión vencida o no autorizada. Por favor inicie sesión nuevamente.');
  }

  if (!res.ok) {
    const { message, code } = await parseErrorMessage(res, fallbackError);
    if (res.status === 403 && code === 'CAMBIO_CLAVE_REQUERIDO' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cai:must-change-password'));
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

function normalizeGuest(raw: any): Invitado {
  const anfitrion = raw.anfitrion || raw.empleado;
  return {
    ...raw,
    anfitrionId: raw.anfitrionId || raw.empleadoId || anfitrion?.id || '',
    anfitrion: anfitrion
      ? {
          id: anfitrion.id,
          nombre: anfitrion.nombre,
          apellido: anfitrion.apellido,
          cedula: anfitrion.cedula,
        }
      : undefined,
  };
}

export interface RegisterAccessResult {
  confirmed: boolean;
  queuedOffline?: boolean;
  pendingItem?: OfflineMovementItem;
  registro?: HistorialRegistro;
}

export const api = {
  // Salud real del servidor y base de datos
  async checkHealth(): Promise<{ status: string; database?: string; latencyMs?: string; uptimeSeconds?: number }> {
    const API_URL = getBaseApiUrl();
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      throw new Error('Servidor o base de datos no disponible');
    }
    const raw = await res.json();
    const dbObj = typeof raw.database === 'object' && raw.database !== null ? raw.database : null;
    return {
      status: raw.status,
      database: dbObj ? (dbObj.status === 'up' ? 'conectado' : dbObj.status) : raw.database || 'conectado',
      latencyMs:
        dbObj && dbObj.latencyMs !== null && dbObj.latencyMs !== undefined
          ? `${dbObj.latencyMs} ms`
          : raw.latencyMs || '0 ms',
      uptimeSeconds: raw.uptimeSeconds,
    };
  },

  // Autenticación estricta contra el backend (LoginDto: { identifier, password })
  async login(identificador: string, password: string): Promise<{ access_token: string; user: Usuario }> {
    const API_URL = getBaseApiUrl();
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identificador.trim(), password }),
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor de autenticación.');
    }

    if (!res.ok) {
      const { message } = await parseErrorMessage(res, 'Credenciales inválidas o acceso denegado.');
      throw new Error(message);
    }

    const data = await res.json();
    if (!data?.access_token || !data?.user) {
      throw new Error('Respuesta de autenticación inválida del servidor.');
    }

    localStorage.setItem('cai_token', data.access_token);
    localStorage.setItem('cai_user', JSON.stringify(data.user));
    return data;
  },

  // Cambio obligatorio o voluntario de contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; user: Usuario }> {
    const data = await apiFetch<{ message: string; user: Usuario }>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      'Error al actualizar la contraseña.',
    );

    const saved = localStorage.getItem('cai_user');
    const existing = saved ? JSON.parse(saved) : {};
    const mergedUser: Usuario = { ...existing, ...data.user, debeCambiarClave: false };
    localStorage.setItem('cai_user', JSON.stringify(mergedUser));

    return { message: data.message, user: mergedUser };
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('cai_token');
    if (token) {
      try {
        const API_URL = getBaseApiUrl();
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(false),
        });
      } catch {
        // Ignorar fallo de red al cerrar sesión localmente
      }
    }
    localStorage.removeItem('cai_token');
    localStorage.removeItem('cai_user');
  },

  // Perfil del usuario autenticado
  async getProfile(): Promise<Usuario> {
    const data = await apiFetch<Usuario>('/auth/profile', { method: 'GET' }, 'Error al obtener perfil');
    localStorage.setItem('cai_user', JSON.stringify(data));
    return data;
  },

  async updateProfile(profileData: {
    cargo?: string;
    departamento?: string;
    telefonoMovil?: string;
    telefonoFijo?: string;
    email?: string;
    fotoUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<Usuario> {
    const updated = await apiFetch<Usuario>(
      '/auth/profile',
      {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      },
      'Error al actualizar perfil',
    );
    const saved = localStorage.getItem('cai_user');
    const current = saved ? JSON.parse(saved) : {};
    const merged = { ...current, ...updated };
    localStorage.setItem('cai_user', JSON.stringify(merged));
    return merged;
  },

  // Estadísticas del Dashboard (Solo ADMINISTRADOR)
  async getStats(): Promise<StatsSummary> {
    const raw = await apiFetch<any>('/historial/stats', { method: 'GET' }, 'Error al obtener estadísticas');
    return {
      totalRegistros: raw.totalRegistros ?? raw.totalHoy ?? 0,
      entradasHoy: raw.entradasHoy ?? 0,
      salidasHoy: raw.salidasHoy ?? 0,
      dentroAhora: raw.dentroAhora ?? raw.dentroEstimado ?? raw.personasDentroAproximado ?? 0,
    };
  },

  // Lista de evacuación / personas dentro (ADMINISTRADOR y SEGURIDAD)
  async getEvacuationList(): Promise<{
    totalPersonasDentro: number;
    generadoEn: string;
    personasDentro: Array<{
      historialId: string;
      horaEntrada: string;
      observacion?: string;
      tipoPersona: 'USUARIO' | 'INVITADO';
      id: string;
      cedula: string;
      nombre: string;
      apellido: string;
      detalle: string;
    }>;
  }> {
    const raw = await apiFetch<any>('/historial/dentro', { method: 'GET' }, 'Error al obtener lista de personas en planta');
    const list: any[] = Array.isArray(raw) ? raw : raw?.personasDentro || [];
    const mapped = list.map((item) => {
      if (item.horaEntrada && item.tipoPersona) {
        return item;
      }
      const parts = String(item.nombre || '').trim().split(' ');
      const nombre = parts[0] || '';
      const apellido = parts.slice(1).join(' ');
      const isGuest = String(item.tipo || '').includes('VISITANTE');
      return {
        historialId: item.historialId || item.id,
        horaEntrada: item.horaIngreso || item.horaEntrada || new Date().toISOString(),
        observacion: item.observacion,
        tipoPersona: (isGuest ? 'INVITADO' : 'USUARIO') as 'USUARIO' | 'INVITADO',
        id: item.id,
        cedula: item.cedula,
        nombre,
        apellido,
        detalle: item.empresa || item.tipo || '',
      };
    });

    return {
      totalPersonasDentro: mapped.length,
      generadoEn: new Date().toISOString(),
      personasDentro: mapped,
    };
  },

  // Descargar Acta Oficial de Evacuación en CSV (Solo ADMINISTRADOR)
  async downloadEvacuationCsv(): Promise<void> {
    const acta = await apiFetch<any>(
      '/historial/evacuacion/acta',
      { method: 'GET' },
      'No se pudo generar el acta de evacuación',
    );
    const personas: any[] = acta?.personas || [];
    const headers = ['ID', 'Nombre Completo', 'Cédula', 'Categoría', 'Empresa', 'Hora Ingreso'];
    const rows = personas.map((p) => [
      p.id,
      `"${String(p.nombre || '').replace(/"/g, '""')}"`,
      p.cedula,
      p.tipo,
      `"${String(p.empresa || '').replace(/"/g, '""')}"`,
      new Date(p.horaIngreso).toLocaleString('es-VE'),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta_evacuacion_cai_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Historial general (Solo ADMINISTRADOR)
  async getHistorial(params?: {
    tipo?: string;
    search?: string;
    desde?: string;
    hasta?: string;
  }): Promise<{ data: HistorialRegistro[]; total: number }> {
    const q = new URLSearchParams({ take: '100' });
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.search) q.set('search', params.search);
    if (params?.desde) q.set('startDate', params.desde);
    if (params?.hasta) q.set('endDate', params.hasta);

    return apiFetch<{ data: HistorialRegistro[]; total: number }>(
      `/historial?${q.toString()}`,
      { method: 'GET' },
      'Error al consultar la bitácora de accesos',
    );
  },

  // Exportar Bitácora CSV desde el servidor (Solo ADMINISTRADOR)
  async downloadHistorialCsv(params?: {
    tipo?: string;
    search?: string;
    desde?: string;
    hasta?: string;
  }): Promise<void> {
    const API_URL = getBaseApiUrl();
    const q = new URLSearchParams();
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.search) q.set('search', params.search);
    if (params?.desde) q.set('startDate', params.desde);
    if (params?.hasta) q.set('endDate', params.hasta);

    let res: Response;
    try {
      res = await fetch(`${API_URL}/historial/export/csv?${q.toString()}`, {
        headers: getAuthHeaders(false),
      });
    } catch {
      throw new Error('Error de red al exportar bitácora CSV.');
    }

    if (res.status === 401) {
      clearSessionAndNotifyUnauthorized();
      throw new Error('Sesión vencida. Inicie sesión nuevamente.');
    }

    if (!res.ok) {
      const { message } = await parseErrorMessage(res, 'Error exportando bitácora CSV');
      throw new Error(message);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitacora_cai_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Editar nota/observación en la bitácora (Solo ADMINISTRADOR)
  async updateHistorialObservacion(id: string, observacion: string): Promise<HistorialRegistro> {
    return apiFetch<HistorialRegistro>(
      `/historial/${id}/observacion`,
      {
        method: 'PATCH',
        body: JSON.stringify({ observacion }),
      },
      'Error al actualizar observación en bitácora',
    );
  },

  // Búsqueda inteligente por Cédula o Token QR firmado CAI2 (ADMINISTRADOR y SEGURIDAD)
  async lookupPersona(identifierOrQr: string): Promise<PersonaLookup> {
    const clean = identifierOrQr.trim();
    const raw = await apiFetch<any>(
      `/access/lookup/${encodeURIComponent(clean)}`,
      { method: 'GET' },
      `No se encontró ninguna persona ni pase válido para: ${clean}`,
    );

    const isGuest = raw.tipoPersona === 'INVITADO' || raw.isGuest === true;
    const ultimoMovimiento = raw.ultimoMovimiento ?? raw.ultimoRegistro ?? null;
    const estaDentro = Boolean(raw.estaDentro);

    return {
      id: raw.id,
      cedula: raw.cedula,
      nombre: raw.nombre,
      apellido: raw.apellido,
      tipoPersona: isGuest ? 'INVITADO' : 'USUARIO',
      rol: raw.rol,
      empresa: raw.empresa,
      motivo: raw.motivo,
      placa: raw.placa,
      fotoUrl: raw.fotoUrl,
      bloqueado: Boolean(raw.bloqueado),
      motivoBloqueo: raw.motivoBloqueo,
      anfitrion:
        raw.anfitrion ||
        (raw.empleadoAnfitrion
          ? { id: '', nombre: String(raw.empleadoAnfitrion), apellido: '' }
          : undefined),
      ultimoMovimiento,
      estaDentro,
      accionSugerida: estaDentro ? 'SALIDA' : 'ENTRADA',
      paseFirmado: Boolean(raw.paseFirmado),
      visitaId: raw.visitaId,
      vigenciaHasta: raw.vigenciaHasta,
    };
  },

  // Registrar Entrada o Salida en Garita con soporte de cola offline real (IndexedDB)
  async registerAccess(
    targetId: string,
    isGuest: boolean,
    tipo: TipoAcceso,
    observacion?: string,
    options?: {
      qrToken?: string;
      personaNombre?: string;
      personaCedula?: string;
      allowOfflineQueue?: boolean;
    },
  ): Promise<RegisterAccessResult> {
    const API_URL = getBaseApiUrl();
    const endpoint = tipo === 'ENTRADA' ? 'check-in' : 'check-out';
    const bodyPayload: Record<string, unknown> = {
      targetId,
      isGuest,
      ...(observacion ? { observacion } : {}),
      ...(options?.qrToken ? { qrToken: options.qrToken } : {}),
    };

    let res: Response;
    try {
      res = await fetch(`${API_URL}/access/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(bodyPayload),
      });
    } catch {
      if (options?.allowOfflineQueue) {
        const pendingItem = await offlineQueue.enqueue({
          targetId,
          personaNombre: options.personaNombre || 'Persona',
          personaCedula: options.personaCedula || targetId,
          isGuest,
          tipo,
          observacion,
          qrToken: options.qrToken,
        });
        return {
          confirmed: false,
          queuedOffline: true,
          pendingItem,
        };
      }
      throw new Error('Error de red: No se pudo conectar con el servidor para registrar el movimiento.');
    }

    if (res.status === 401) {
      clearSessionAndNotifyUnauthorized();
      throw new Error('Sesión vencida. Inicie sesión nuevamente.');
    }

    if (!res.ok) {
      const { message, code } = await parseErrorMessage(res, 'El servidor rechazó el registro de acceso.');
      if (res.status === 403 && code === 'CAMBIO_CLAVE_REQUERIDO' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cai:must-change-password'));
      }
      throw new Error(message);
    }

    const registro = (await res.json()) as HistorialRegistro;
    return {
      confirmed: true,
      registro,
    };
  },

  // Sincronizar movimientos pendientes en IndexedDB con el backend
  async syncOfflineQueue(): Promise<{ synced: number; rejected: number; remaining: number }> {
    const API_URL = getBaseApiUrl();
    const allItems = await offlineQueue.listAll();
    const pendingItems = allItems.filter((item) => item.status === 'PENDING');

    let synced = 0;
    let rejected = 0;

    for (const item of pendingItems) {
      const endpoint = item.tipo === 'ENTRADA' ? 'check-in' : 'check-out';
      const bodyPayload: Record<string, unknown> = {
        targetId: item.targetId,
        isGuest: item.isGuest,
        observacion: item.observacion
          ? `${item.observacion} [Sincronizado de cola offline ${item.queuedAt}]`
          : `[Sincronizado de cola offline ${item.queuedAt}]`,
        ...(item.qrToken ? { qrToken: item.qrToken } : {}),
      };

      try {
        const res = await fetch(`${API_URL}/access/${endpoint}`, {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify(bodyPayload),
        });

        if (res.status === 401) {
          clearSessionAndNotifyUnauthorized();
          break;
        }

        if (res.ok) {
          await offlineQueue.remove(item.id);
          synced++;
        } else if (res.status >= 400 && res.status < 500) {
          const { message } = await parseErrorMessage(res, `Rechazado por el servidor (HTTP ${res.status})`);
          await offlineQueue.markRejected(item.id, message);
          rejected++;
        }
      } catch {
        // Si la red sigue caída, detenemos el ciclo hasta el próximo reintento
        break;
      }
    }

    const updated = await offlineQueue.listAll();
    return {
      synced,
      rejected,
      remaining: updated.filter((i) => i.status === 'PENDING').length,
    };
  },

  // Usuarios (Solo ADMINISTRADOR)
  async getUsers(params?: { search?: string; rol?: string }): Promise<{ data: Usuario[]; total: number }> {
    const q = new URLSearchParams({ take: '100' });
    if (params?.search) q.set('search', params.search);
    if (params?.rol) q.set('rol', params.rol);

    return apiFetch<{ data: Usuario[]; total: number }>(
      `/users?${q.toString()}`,
      { method: 'GET' },
      'Error al obtener directorio de usuarios',
    );
  },

  async createUser(userData: Partial<Usuario> & { password?: string }): Promise<Usuario> {
    return apiFetch<Usuario>(
      '/users',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      'Error al crear usuario',
    );
  },

  async toggleBloqueoUsuario(id: string, bloqueado: boolean, motivoBloqueo?: string): Promise<Usuario> {
    return apiFetch<Usuario>(
      `/users/${id}/bloquear`,
      {
        method: 'PATCH',
        body: JSON.stringify({ bloqueado, motivoBloqueo }),
      },
      'Error cambiando estado de bloqueo del usuario',
    );
  },

  // Invitados - Listado general (Solo ADMINISTRADOR)
  async getInvitados(search?: string): Promise<{ data: Invitado[]; total: number }> {
    const q = new URLSearchParams({ take: '100' });
    if (search) q.set('search', search);

    const res = await apiFetch<{ data: any[]; total: number }>(
      `/invitados?${q.toString()}`,
      { method: 'GET' },
      'Error al obtener listado de visitantes',
    );
    return {
      total: res.total ?? (res.data?.length || 0),
      data: (res.data || []).map(normalizeGuest),
    };
  },

  // Invitados propios del propietario/empleado (EMPLEADO y ADMINISTRADOR)
  async getMisInvitados(search?: string): Promise<{ data: Invitado[]; total: number }> {
    const raw = await apiFetch<any>(
      '/invitados/mis-invitados',
      { method: 'GET' },
      'Error al obtener sus invitados registrados',
    );
    const list: any[] = Array.isArray(raw) ? raw : raw?.data || [];
    const normalized = list.map(normalizeGuest);
    const filtered = search?.trim()
      ? normalized.filter((inv) => {
          const term = search.trim().toLowerCase();
          return (
            inv.cedula.toLowerCase().includes(term) ||
            inv.nombre.toLowerCase().includes(term) ||
            inv.apellido.toLowerCase().includes(term) ||
            (inv.empresa || '').toLowerCase().includes(term)
          );
        })
      : normalized;

    return {
      total: filtered.length,
      data: filtered,
    };
  },

  async createInvitado(invData: {
    cedula: string;
    nombre: string;
    apellido: string;
    empresa?: string;
    motivo?: string;
    placa?: string;
    anfitrionId?: string;
    vigenciaDias?: number;
  }): Promise<Invitado> {
    const payload: Record<string, unknown> = {
      cedula: invData.cedula,
      nombre: invData.nombre,
      apellido: invData.apellido,
      ...(invData.empresa ? { empresa: invData.empresa } : {}),
      ...(invData.motivo ? { motivo: invData.motivo } : {}),
      ...(invData.placa ? { placa: invData.placa } : {}),
      ...(invData.anfitrionId ? { empleadoId: invData.anfitrionId } : {}),
      ...(invData.vigenciaDias ? { vigenciaDias: invData.vigenciaDias } : {}),
    };

    const raw = await apiFetch<any>(
      '/invitados',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      'Error al registrar invitado',
    );
    return normalizeGuest(raw);
  },

  async updateInvitado(
    id: string,
    invData: {
      cedula?: string;
      nombre?: string;
      apellido?: string;
      empresa?: string;
      motivo?: string;
      placa?: string;
      vigenciaDias?: number;
    },
  ): Promise<Invitado> {
    const payload: Record<string, unknown> = {
      ...(invData.cedula ? { cedula: invData.cedula } : {}),
      ...(invData.nombre ? { nombre: invData.nombre } : {}),
      ...(invData.apellido ? { apellido: invData.apellido } : {}),
      ...(invData.empresa !== undefined ? { empresa: invData.empresa } : {}),
      ...(invData.motivo !== undefined ? { motivo: invData.motivo } : {}),
      ...(invData.placa !== undefined ? { placa: invData.placa } : {}),
      ...(invData.vigenciaDias ? { vigenciaDias: invData.vigenciaDias } : {}),
    };

    const raw = await apiFetch<any>(
      `/invitados/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      'Error al actualizar invitado',
    );
    return normalizeGuest(raw);
  },

  async deleteInvitado(id: string): Promise<{ message?: string; eliminado?: boolean }> {
    return apiFetch<{ message?: string; eliminado?: boolean }>(
      `/invitados/${id}`,
      {
        method: 'DELETE',
      },
      'Error al eliminar o dar de baja al invitado',
    );
  },

  async emitirPaseQr(invitadoId: string, vigenciaDias = 1): Promise<PaseQrInfo> {
    const raw = await apiFetch<any>(
      `/invitados/${invitadoId}/pase`,
      {
        method: 'POST',
        body: JSON.stringify({ vigenciaDias }),
      },
      'Error al emitir pase QR firmado en el servidor',
    );
    return (raw?.paseQr || raw) as PaseQrInfo;
  },

  async toggleBloqueoInvitado(id: string, bloqueado: boolean, motivoBloqueo?: string): Promise<Invitado> {
    const raw = await apiFetch<any>(
      `/invitados/${id}/bloquear`,
      {
        method: 'PATCH',
        body: JSON.stringify({ bloqueado, motivoBloqueo }),
      },
      'Error cambiando estado de bloqueo del visitante',
    );
    return normalizeGuest(raw);
  },

  // Cartelera de Noticias (Lectura: ADMINISTRADOR y EMPLEADO; Escritura: Solo ADMINISTRADOR)
  async getNoticias(): Promise<Noticia[]> {
    const json = await apiFetch<{ data?: Noticia[] } | Noticia[]>(
      '/noticias?take=20',
      { method: 'GET' },
      'Error al obtener comunicados de la cartelera',
    );
    return Array.isArray(json) ? json : json.data || [];
  },

  async createNoticia(noticiaData: { titulo: string; contenido: string; imagenUrl?: string }): Promise<Noticia> {
    return apiFetch<Noticia>(
      '/noticias',
      {
        method: 'POST',
        body: JSON.stringify(noticiaData),
      },
      'Error al publicar comunicado en la cartelera',
    );
  },

  async updateNoticia(
    id: string,
    noticiaData: { titulo?: string; contenido?: string; imagenUrl?: string },
  ): Promise<Noticia> {
    return apiFetch<Noticia>(
      `/noticias/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(noticiaData),
      },
      'Error al editar comunicado en la cartelera',
    );
  },

  async deleteNoticia(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/noticias/${id}`,
      {
        method: 'DELETE',
      },
      'Error al eliminar comunicado de la cartelera',
    );
  },
};
