export type Role = 'ADMINISTRADOR' | 'SEGURIDAD' | 'EMPLEADO';
export type TipoAcceso = 'ENTRADA' | 'SALIDA';

export interface Usuario {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  rol: Role;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  cargo?: string;
  departamento?: string;
  telefonoMovil?: string;
  telefonoFijo?: string;
  fotoUrl?: string;
  registroCompletado?: boolean;
  debeCambiarClave?: boolean;
  createdAt?: string;
  _count?: {
    invitaciones: number;
  };
}

export interface PaseQrInfo {
  visitaId: string;
  token: string;
  vigenciaHasta: string | null;
  estado: 'AUTORIZADA' | 'COMPLETADA' | 'CANCELADA';
}

export interface Invitado {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  empresa?: string;
  motivo?: string;
  placa?: string;
  fotoUrl?: string;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  eliminado?: boolean;
  anfitrionId: string;
  anfitrion?: {
    id: string;
    nombre: string;
    apellido: string;
    cedula?: string;
  };
  paseQr?: PaseQrInfo | null;
  createdAt: string;
}

export interface HistorialRegistro {
  id: string;
  tipo: TipoAcceso;
  observacion?: string;
  timestamp: string;
  usuario?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    rol: Role;
  };
  invitado?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    empresa?: string;
  };
}

export interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  createdAt: string;
}

export interface PersonaLookup {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  tipoPersona: 'USUARIO' | 'INVITADO';
  rol?: Role;
  empresa?: string;
  motivo?: string;
  placa?: string;
  fotoUrl?: string;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  anfitrion?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  ultimoMovimiento: {
    id: string;
    tipo: TipoAcceso;
    timestamp: string;
    observacion?: string;
  } | null;
  estaDentro: boolean;
  accionSugerida: TipoAcceso;
  paseFirmado?: boolean;
  visitaId?: string;
  vigenciaHasta?: string | null;
}

export interface StatsSummary {
  totalRegistros: number;
  entradasHoy: number;
  salidasHoy: number;
  dentroAhora: number;
}
