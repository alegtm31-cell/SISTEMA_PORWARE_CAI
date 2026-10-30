import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Car,
  Phone,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import type { EventoPublicoInfo } from '../types';

interface UnirseEventoPublicViewProps {
  initialToken?: string;
}

export const UnirseEventoPublicView: React.FC<UnirseEventoPublicViewProps> = ({ initialToken = '' }) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [eventInfo, setEventInfo] = useState<EventoPublicoInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(Boolean(initialToken));
  const [infoError, setInfoError] = useState<string>('');

  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [placa, setPlaca] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<{
    ok: boolean;
    eventoNombre: string;
    estado: 'PENDIENTE' | 'APROBADO';
    mensaje: string;
  } | null>(null);

  const loadEventByToken = async (rawToken: string) => {
    const clean = rawToken.trim();
    if (!clean) return;
    setLoadingInfo(true);
    setInfoError('');
    try {
      const info = await api.getInfoPublicaEvento(clean);
      setEventInfo(info);
    } catch (err: any) {
      setEventInfo(null);
      setInfoError(err?.message || 'El enlace o código del evento no es válido o ha expirado.');
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      loadEventByToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await api.unirseEventoPublico({
        token: tokenInput.trim(),
        cedula: cedula.trim().toUpperCase(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || undefined,
        empresa: empresa.trim() || undefined,
        placa: placa.trim().toUpperCase() || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setSubmitError(err?.message || 'No se pudo completar su solicitud de inscripción.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg-app)',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '32px 28px',
        }}
      >
        {/* Encabezado institucional sin navegación al sistema interno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              PORWARE CAI • Registro de Invitados a Evento
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Inscripción a Evento Autorizado
            </h1>
          </div>
        </div>

        {/* Si aún no se cargó un token válido, permitir ingresarlo */}
        {!eventInfo && !loadingInfo && (
          <div style={{ marginBottom: '20px' }}>
            {infoError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--rose)',
                  fontSize: '0.84rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{infoError}</span>
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Código de Invitación del Evento (CAI-EVT:...)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Pegue el código CAI-EVT:..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => loadEventByToken(tokenInput)}
                disabled={!tokenInput.trim()}
              >
                Verificar
              </button>
            </div>
          </div>
        )}

        {loadingInfo && (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
            Verificando vigencia y disponibilidad del evento...
          </div>
        )}

        {eventInfo && (
          <>
            {/* Ficha del Evento */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '22px',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                {eventInfo.nombre}
              </div>
              {eventInfo.descripcion && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.45 }}>
                  {eventInfo.descripcion}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--cyan)" />
                  <span>Inicio: {new Date(eventInfo.inicio).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--amber)" />
                  <span>Fin: {new Date(eventInfo.fin).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={14} color="var(--emerald)" />
                  <span>Anfitrión: {eventInfo.anfitrion}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="var(--cyan)" />
                  <span>Cupos disponibles: {eventInfo.cuposDisponibles} / {eventInfo.aforo}</span>
                </div>
              </div>
            </div>

            {result ? (
              <div
                style={{
                  padding: '22px',
                  borderRadius: '12px',
                  background:
                    result.estado === 'APROBADO'
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(245, 158, 11, 0.14)',
                  border:
                    result.estado === 'APROBADO'
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(245, 158, 11, 0.4)',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2
                  size={38}
                  color={result.estado === 'APROBADO' ? 'var(--emerald)' : 'var(--amber)'}
                  style={{ margin: '0 auto 10px' }}
                />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {result.estado === 'APROBADO'
                    ? 'Inscripción Aprobada'
                    : 'Solicitud Pendiente de Aprobación'}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {result.mensaje}
                </p>
                <div
                  style={{
                    marginTop: '14px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  Nota de seguridad: Recuerde presentar su documento de identidad físico (Cédula) al llegar a la garita.
                </div>
              </div>
            ) : eventInfo.lleno ? (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: 'var(--rose)',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                El evento ha alcanzado su cupo máximo permitido ({eventInfo.aforo} invitados) y no admite más registros.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {submitError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'var(--rose)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: V-19888777"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.toUpperCase())}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Su nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Su apellido"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      <Phone size={13} color="var(--cyan)" />
                      <span>Teléfono</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: 0414-1234567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      <Car size={13} color="var(--cyan)" />
                      <span>Placa Vehículo (Opcional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: AB123CD"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <Building2 size={13} color="var(--cyan)" />
                    <span>Empresa / Procedencia (Opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Particular o nombre de empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '0.92rem' }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {submitting
                      ? 'Enviando solicitud...'
                      : eventInfo.requiereAprobacion
                        ? 'Solicitar Inscripción al Evento'
                        : 'Confirmar Asistencia al Evento'}
                  </span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

