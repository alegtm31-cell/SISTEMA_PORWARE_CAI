export type Role = 'ADMINISTRADOR' | 'EMPLEADO' | 'SEGURIDAD';

export type TipoIngreso = 'ENTRADA' | 'SALIDA';

export type EstadoSeguridad = 'AUTORIZADO' | 'BLOQUEADO' | 'EN_REVISION';

export interface Usuario {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Role;
  fotoUrl?: string;
  estadoSeguridad?: EstadoSeguridad;
  motivoBloqueo?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    invitaciones: number;
    registros: number;
  };
}

export interface Invitado {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  empresa?: string | null;
  empleadoId: string;
  fotoUrl?: string;
  estadoSeguridad?: EstadoSeguridad;
  motivoBloqueo?: string;
  empleado?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  createdAt?: string;
}

export interface HistorialRegistro {
  id: string;
  tipo: TipoIngreso;
  timestamp: string;
  observacion?: string | null;
  usuarioId?: string | null;
  usuario?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: Role;
    fotoUrl?: string;
  } | null;
  invitadoId?: string | null;
  invitado?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    empresa?: string | null;
    fotoUrl?: string;
    empleado?: {
      id: string;
      nombre: string;
      apellido: string;
      email: string;
    } | null;
  } | null;
}

export interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  createdAt: string;
}

export interface StatsResponse {
  entradasHoy: number;
  salidasHoy: number;
  personasDentroAproximado: number;
  ultimosMovimientos: HistorialRegistro[];
}

export interface PersonaLookup {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  isGuest: boolean;
  rol?: Role;
  empresa?: string | null;
  fotoUrl?: string;
  estadoSeguridad: EstadoSeguridad;
  motivoBloqueo?: string;
  empleadoAnfitrion?: string;
  ultimoRegistro?: HistorialRegistro | null;
  estaDentro: boolean;
}

