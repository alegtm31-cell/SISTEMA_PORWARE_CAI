import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Ban,
  QrCode,
  Copy,
  RefreshCw,
  Power,
  Lock,
  AlertCircle,
  Edit3,
  UserPlus,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { generateLocalQrDataUrl } from '../utils/qrPass';
import type { Evento, Usuario } from '../types';

interface EventosViewProps {
  user: Usuario;
}

export const EventosView: React.FC<EventosViewProps> = ({ user }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal de Crear / Editar Evento
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [aforo, setAforo] = useState(20);
  const [requiereAprobacion, setRequiereAprobacion] = useState(true);
  const [savingForm, setSavingForm] = useState(false);

  // Modal de Agregar Invitado Manual por Anfitrión
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [guestCedula, setGuestCedula] = useState('');
  const [guestNombre, setGuestNombre] = useState('');
  const [guestApellido, setGuestApellido] = useState('');
  const [guestTelefono, setGuestTelefono] = useState('');
  const [guestPlaca, setGuestPlaca] = useState('');
  const [guestEmpresa, setGuestEmpresa] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);

  const loadEventos = useCallback(async (keepSelectedId?: string) => {
    setLoading(true);
    try {
      const list = await api.getEventos();
      setEventos(list);
      const targetId = keepSelectedId || selectedEvento?.id;
      if (targetId) {
        const found = list.find((e) => e.id === targetId) || list[0] || null;
        setSelectedEvento(found);
      } else if (list.length > 0) {
        setSelectedEvento(list[0]);
      } else {
        setSelectedEvento(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error al cargar los eventos.' });
    } finally {
      setLoading(false);
    }
  }, [selectedEvento?.id]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  useEffect(() => {
    let active = true;
    const token = selectedEvento?.tokenUnion;
    if (token) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/?eventoToken=${encodeURIComponent(token)}`;
      generateLocalQrDataUrl(url).then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      });
    } else {
      setQrDataUrl('');
    }
    return () => {
      active = false;
    };
  }, [selectedEvento?.tokenUnion]);

  const toLocalDatetimeInput = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openCreateModal = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60 * 1000);
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    setEditingEventoId(null);
    setNombre('');
    setDescripcion('');
    setInicio(toLocalDatetimeInput(start.toISOString()));
    setFin(toLocalDatetimeInput(end.toISOString()));
    setAforo(20);
    setRequiereAprobacion(true);
    setShowFormModal(true);
  };

  const openEditModal = (ev: Evento) => {
    setEditingEventoId(ev.id);
    setNombre(ev.nombre);
    setDescripcion(ev.descripcion || '');
    setInicio(toLocalDatetimeInput(ev.inicio));
    setFin(toLocalDatetimeInput(ev.fin));
    setAforo(ev.aforo);
    setRequiereAprobacion(ev.requiereAprobacion);
    setShowFormModal(true);
  };

  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    setFeedback(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
        aforo: Number(aforo),
        requiereAprobacion,
      };

      if (editingEventoId) {
        const updated = await api.updateEvento(editingEventoId, payload);
        setShowFormModal(false);
        await loadEventos(updated.id);
        setFeedback({ type: 'success', msg: `Evento "${updated.nombre}" actualizado correctamente.` });
      } else {
        const created = await api.createEvento(payload);
        setShowFormModal(false);
        await loadEventos(created.id);
        setFeedback({ type: 'success', msg: `Evento "${created.nombre}" creado con éxito.` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error al guardar el evento.' });
    } finally {
      setSavingForm(false);
    }
  };

  const handleAddGuestByHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento) return;
    setSavingGuest(true);
    setFeedback(null);
    try {
      await api.agregarInvitadoEventoAnfitrion(selectedEvento.id, {
        cedula: guestCedula.trim().toUpperCase(),
        nombre: guestNombre.trim(),
        apellido: guestApellido.trim(),
        telefono: guestTelefono.trim() || undefined,
        placa: guestPlaca.trim().toUpperCase() || undefined,
        empresa: guestEmpresa.trim() || undefined,
      });
      setShowAddGuestModal(false);
      setGuestCedula('');
      setGuestNombre('');
      setGuestApellido('');
      setGuestTelefono('');
      setGuestPlaca('');
      setGuestEmpresa('');
      await loadEventos(selectedEvento.id);
      setFeedback({ type: 'success', msg: 'Invitado agregado y aprobado con visita autorizada.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error al agregar invitado al evento.' });
    } finally {
      setSavingGuest(false);
    }
  };

  const getPublicShareUrl = (tokenUnion?: string | null) => {
    if (!tokenUnion) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?eventoToken=${encodeURIComponent(tokenUnion)}`;
  };

  const copyShareLink = async (tokenUnion?: string | null) => {
    const url = getPublicShareUrl(tokenUnion);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({ type: 'success', msg: 'Enlace de invitación al evento copiado al portapapeles.' });
    } catch {
      setFeedback({ type: 'error', msg: 'No se pudo copiar automáticamente. Copie el código manualmente.' });
    }
  };

  const handleAprobar = async (eventoInvitadoId: string) => {
    if (!selectedEvento) return;
    try {
      await api.aprobarInvitadoEvento(selectedEvento.id, eventoInvitadoId);
      await loadEventos(selectedEvento.id);
      setFeedback({ type: 'success', msg: 'Invitado aprobado y Visita autorizada generada hasta el fin del evento.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'No se pudo aprobar al invitado.' });
    }
  };

  const handleRechazar = async (eventoInvitadoId: string) => {
    if (!selectedEvento) return;
    try {
      await api.rechazarInvitadoEvento(selectedEvento.id, eventoInvitadoId);
      await loadEventos(selectedEvento.id);
      setFeedback({ type: 'success', msg: 'Solicitud rechazada.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'No se pudo rechazar la solicitud.' });
    }
  };

  const handleRevocar = async (eventoInvitadoId: string) => {
    if (!selectedEvento) return;
    try {
      await api.revocarInvitadoEvento(selectedEvento.id, eventoInvitadoId);
      await loadEventos(selectedEvento.id);
      setFeedback({ type: 'success', msg: 'Acceso del invitado revocado y visita cancelada.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'No se pudo revocar al invitado.' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Gestión de Eventos & Cupos Compartidos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            {user.rol === 'ADMINISTRADOR'
              ? 'Administración global de eventos, enlaces HMAC de inscripción y control de aforo.'
              : 'Cree eventos con cupo limitado, comparta el enlace/QR de inscripción y apruebe a sus invitados.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-ghost" onClick={() => loadEventos()}>
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: feedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: feedback.type === 'success' ? 'var(--emerald)' : 'var(--rose)',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="responsive-two-col">
        {/* Columna izquierda: Lista de Eventos */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            {user.rol === 'ADMINISTRADOR' ? 'Todos los Eventos' : 'Mis Eventos'} ({eventos.length})
          </h3>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>Cargando eventos...</div>
          ) : eventos.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
              No hay eventos registrados. Cree uno con el botón "Nuevo Evento".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {eventos.map((ev) => {
                const isSelected = selectedEvento?.id === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvento(ev)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{ev.nombre}</strong>
                      <span
                        className="badge"
                        style={{
                          background:
                            ev.estado === 'ACTIVO'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : ev.estado === 'CANCELADO'
                                ? 'rgba(239, 68, 68, 0.18)'
                                : 'rgba(148, 163, 184, 0.18)',
                          color:
                            ev.estado === 'ACTIVO'
                              ? 'var(--emerald)'
                              : ev.estado === 'CANCELADO'
                                ? 'var(--rose)'
                                : 'var(--text-muted)',
                        }}
                      >
                        {ev.estado}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--cyan)" />
                      <span>
                        {new Date(ev.inicio).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })} —{' '}
                        {new Date(ev.fin).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                        Aprobados: {ev.resumenCupo.aprobados} / {ev.aforo}
                      </span>
                      {ev.resumenCupo.pendientes > 0 && (
                        <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                          {ev.resumenCupo.pendientes} Pendiente(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna derecha: Detalle del Evento, Enlace/QR Compartido y Bandeja de Invitados */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {!selectedEvento ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Seleccione un evento de la lista para gestionar su enlace compartido, aforo y solicitudes de invitados.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {selectedEvento.nombre}
                    </h2>
                    <span className="badge badge-empleado">{selectedEvento.estado}</span>
                  </div>
                  {selectedEvento.descripcion && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedEvento.descripcion}
                    </p>
                  )}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    Anfitrión: <strong>{selectedEvento.anfitrion ? `${selectedEvento.anfitrion.nombre} ${selectedEvento.anfitrion.apellido}` : user.nombre}</strong> •{' '}
                    {selectedEvento.requiereAprobacion ? 'Requiere aprobación del anfitrión' : 'Aprobación automática hasta agotar cupo'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" className="btn-ghost" onClick={() => openEditModal(selectedEvento)} style={{ padding: '7px 12px', fontSize: '0.78rem' }}>
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowAddGuestModal(true)}
                    disabled={selectedEvento.estado !== 'ACTIVO'}
                    style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                  >
                    <UserPlus size={14} />
                    <span>Agregar Invitado</span>
                  </button>
                  {selectedEvento.estado === 'ACTIVO' && (
                    <>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={async () => {
                          await api.cerrarEvento(selectedEvento.id);
                          await loadEventos(selectedEvento.id);
                        }}
                        style={{ padding: '7px 12px', fontSize: '0.78rem', color: 'var(--amber)' }}
                      >
                        <Lock size={14} />
                        <span>Cerrar Evento</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={async () => {
                          await api.cancelarEvento(selectedEvento.id);
                          await loadEventos(selectedEvento.id);
                        }}
                        style={{ padding: '7px 12px', fontSize: '0.78rem', color: 'var(--rose)' }}
                      >
                        <Ban size={14} />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Resumen de Aforo */}
              <div className="eventos-cupo-grid">
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Aforo Máximo</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedEvento.aforo}</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Aprobados</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)' }}>
                    {selectedEvento.resumenCupo.aprobados} / {selectedEvento.aforo}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pendientes</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber)' }}>{selectedEvento.resumenCupo.pendientes}</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cupos Libres</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan)' }}>{selectedEvento.resumenCupo.disponibles}</div>
                </div>
              </div>

              {/* Enlace y QR Compartido del Evento */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <QrCode size={18} color="var(--cyan)" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      Enlace / QR Compartido de Inscripción (CAI-EVT)
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Comparta este enlace por WhatsApp o correo. Permite a sus invitados solicitar inscripción hasta completar el aforo ({selectedEvento.aforo}). Este código <strong>no</strong> abre la garita por sí solo.
                  </p>

                  {selectedEvento.tokenUnion ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => copyShareLink(selectedEvento.tokenUnion)}
                        style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                      >
                        <Copy size={14} />
                        <span>Copiar Enlace de Invitación</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={async () => {
                          await api.toggleCodigoEvento(selectedEvento.id, false);
                          await loadEventos(selectedEvento.id);
                        }}
                        style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                      >
                        <Power size={14} />
                        <span>Desactivar Enlace</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={async () => {
                          await api.regenerarCodigoEvento(selectedEvento.id);
                          await loadEventos(selectedEvento.id);
                          setFeedback({ type: 'success', msg: 'Código regenerado. El enlace anterior quedó invalidado.' });
                        }}
                        style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                      >
                        <RefreshCw size={14} />
                        <span>Regenerar Código</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 600 }}>
                        Enlace compartido inactivo
                      </span>
                      {selectedEvento.estado === 'ACTIVO' && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={async () => {
                            await api.toggleCodigoEvento(selectedEvento.id, true);
                            await loadEventos(selectedEvento.id);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--emerald)' }}
                        >
                          <Power size={14} />
                          <span>Activar Enlace</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedEvento.tokenUnion && qrDataUrl && (
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '10px' }}>
                    <img
                      src={qrDataUrl}
                      alt="Código QR de invitación al evento"
                      style={{ width: '110px', height: '110px', display: 'block' }}
                    />
                  </div>
                )}
              </div>

              {/* Tabla de Invitados del Evento */}
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                Solicitudes y Lista de Invitados ({selectedEvento.invitados.length})
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table className="forti-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Cédula</th>
                      <th>Nombre Completo</th>
                      <th>Origen</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones del Anfitrión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvento.invitados.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-dim)' }}>
                          Aún no hay invitados registrados en este evento.
                        </td>
                      </tr>
                    ) : (
                      selectedEvento.invitados.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                            {item.invitado.cedula}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {item.invitado.nombre} {item.invitado.apellido}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                              {item.invitado.empresa || 'Particular'}
                              {item.invitado.placa ? ` • Placa: ${item.invitado.placa}` : ''}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-seguridad">{item.origen}</span>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background:
                                  item.estado === 'APROBADO'
                                    ? 'rgba(16, 185, 129, 0.18)'
                                    : item.estado === 'PENDIENTE'
                                      ? 'rgba(245, 158, 11, 0.18)'
                                      : 'rgba(239, 68, 68, 0.18)',
                                color:
                                  item.estado === 'APROBADO'
                                    ? 'var(--emerald)'
                                    : item.estado === 'PENDIENTE'
                                      ? 'var(--amber)'
                                      : 'var(--rose)',
                              }}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {item.estado === 'PENDIENTE' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-emerald"
                                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                    onClick={() => handleAprobar(item.id)}
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>Aprobar</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-ghost"
                                    style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--rose)' }}
                                    onClick={() => handleRechazar(item.id)}
                                  >
                                    <XCircle size={13} />
                                    <span>Rechazar</span>
                                  </button>
                                </>
                              )}
                              {item.estado === 'APROBADO' && (
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--rose)' }}
                                  onClick={() => handleRevocar(item.id)}
                                >
                                  <Ban size={13} />
                                  <span>Revocar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Evento */}
      {showFormModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '26px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              {editingEventoId ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h3>

            <form onSubmit={handleSaveEvento} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: Reunión de Condominio / Cumpleaños / Proveedores"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Salón o detalles del evento"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={fin}
                    onChange={(e) => setFin(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Cupo Máximo (Aforo) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    className="form-input"
                    value={aforo}
                    onChange={(e) => setAforo(Number(e.target.value))}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', marginTop: '18px' }}>
                  <input
                    type="checkbox"
                    checked={requiereAprobacion}
                    onChange={(e) => setRequiereAprobacion(e.target.checked)}
                  />
                  <span>Requerir mi aprobación antes de autorizar ingreso</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingForm}>
                  <Calendar size={16} />
                  <span>{savingForm ? 'Guardando...' : 'Guardar Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Invitado Manualmente */}
      {showAddGuestModal && selectedEvento && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '26px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
              Agregar Invitado a "{selectedEvento.nombre}"
            </h3>

            <form onSubmit={handleAddGuestByHost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Cédula *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="V-19888777"
                  value={guestCedula}
                  onChange={(e) => setGuestCedula(e.target.value.toUpperCase())}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={guestNombre}
                    onChange={(e) => setGuestNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={guestApellido}
                    onChange={(e) => setGuestApellido(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={guestTelefono}
                    onChange={(e) => setGuestTelefono(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Placa Vehículo
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={guestPlaca}
                    onChange={(e) => setGuestPlaca(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Empresa / Procedencia
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={guestEmpresa}
                  onChange={(e) => setGuestEmpresa(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowAddGuestModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingGuest}>
                  <Users size={16} />
                  <span>{savingGuest ? 'Agregando...' : 'Agregar y Autorizar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

