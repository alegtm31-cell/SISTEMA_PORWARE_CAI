import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Building2,
  X,
  Check,
  QrCode,
  ShieldBan,
  ShieldCheck,
  Download,
  Car,
  FileText,
  Edit3,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { generateLocalQrDataUrl } from '../utils/qrPass';
import type { Invitado, Usuario } from '../types';

interface InvitadosViewProps {
  user?: Usuario | null;
}

export const InvitadosView: React.FC<InvitadosViewProps> = ({ user }) => {
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Invitado | null>(null);

  // Estado para Pase Digital QR firmado por el Backend
  const [activePass, setActivePass] = useState<Invitado | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [issuingPass, setIssuingPass] = useState(false);

  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    empresa: '',
    motivo: '',
    placa: '',
    anfitrionId: '',
    vigenciaDias: 1,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isAdmin) {
        const [invRes, usrRes] = await Promise.all([api.getInvitados(search), api.getUsers()]);
        setInvitados(invRes.data);
        setUsers(usrRes.data);
        if (!form.anfitrionId && usrRes.data.length > 0) {
          setForm((prev) => ({ ...prev, anfitrionId: user?.id || usrRes.data[0].id }));
        }
      } else {
        const invRes = await api.getMisInvitados(search);
        setInvitados(invRes.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al cargar la lista de visitantes.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, search, user?.id, form.anfitrionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Renderizar QR local a partir del token HMAC-SHA256 emitido por el backend
  useEffect(() => {
    if (!activePass) {
      setQrImageUrl('');
      return;
    }

    const ensureBackendTokenAndRender = async () => {
      try {
        let token = activePass.paseQr?.token;
        if (!token) {
          setIssuingPass(true);
          const pase = await api.emitirPaseQr(activePass.id, 1);
          token = pase.token;
          setActivePass((prev) => (prev ? { ...prev, paseQr: pase } : null));
        }
        if (token) {
          const url = await generateLocalQrDataUrl(token);
          setQrImageUrl(url);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'No se pudo obtener el pase QR firmado del servidor.');
      } finally {
        setIssuingPass(false);
      }
    };

    ensureBackendTokenAndRender();
  }, [activePass]);

  const handleRenewPass = async (vigenciaDias = 1) => {
    if (!activePass) return;
    setIssuingPass(true);
    try {
      const pase = await api.emitirPaseQr(activePass.id, vigenciaDias);
      const url = await generateLocalQrDataUrl(pase.token);
      setQrImageUrl(url);
      setActivePass((prev) => (prev ? { ...prev, paseQr: pase } : null));
      loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al renovar pase QR en el servidor.');
    } finally {
      setIssuingPass(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingGuest(null);
    setForm({
      cedula: '',
      nombre: '',
      apellido: '',
      empresa: '',
      motivo: '',
      placa: '',
      anfitrionId: user?.id || (users[0]?.id ?? ''),
      vigenciaDias: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invitado) => {
    setEditingGuest(inv);
    setForm({
      cedula: inv.cedula,
      nombre: inv.nombre,
      apellido: inv.apellido,
      empresa: inv.empresa || '',
      motivo: inv.motivo || '',
      placa: inv.placa || '',
      anfitrionId: inv.anfitrionId || user?.id || '',
      vigenciaDias: 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cedula || !form.nombre || !form.apellido) return;

    setErrorMsg(null);
    try {
      if (editingGuest) {
        await api.updateInvitado(editingGuest.id, {
          cedula: form.cedula.trim(),
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          empresa: form.empresa.trim() || undefined,
          motivo: form.motivo.trim() || undefined,
          placa: form.placa.trim().toUpperCase() || undefined,
          vigenciaDias: Number(form.vigenciaDias) || 1,
        });
        setIsModalOpen(false);
        setEditingGuest(null);
        await loadData();
      } else {
        const created = await api.createInvitado({
          cedula: form.cedula.trim(),
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          empresa: form.empresa.trim() || undefined,
          motivo: form.motivo.trim() || undefined,
          placa: form.placa.trim().toUpperCase() || undefined,
          anfitrionId: isAdmin ? form.anfitrionId || user?.id : undefined,
          vigenciaDias: Number(form.vigenciaDias) || 1,
        });
        setIsModalOpen(false);
        await loadData();
        setActivePass(created);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar los datos del invitado.');
    }
  };

  const handleDeleteGuest = async (inv: Invitado) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar/dar de baja al visitante ${inv.nombre} ${inv.apellido} (${inv.cedula})?`,
    );
    if (!confirmDelete) return;

    setErrorMsg(null);
    try {
      await api.deleteInvitado(inv.id);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo eliminar el invitado.');
    }
  };

  const handleToggleBloqueo = async (inv: Invitado) => {
    if (!isAdmin) return;
    const nuevoEstado = !inv.bloqueado;
    let motivo: string | undefined;
    if (nuevoEstado) {
      const promptMotivo = window.prompt(
        `Ingrese el motivo para bloquear el acceso a ${inv.nombre} ${inv.apellido}:`,
        'Restricción de seguridad administrativa',
      );
      if (promptMotivo === null) return;
      motivo = promptMotivo;
    }

    try {
      await api.toggleBloqueoInvitado(inv.id, nuevoEstado, motivo);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al cambiar el estado de bloqueo del invitado.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {isAdmin ? 'Visitas, Invitados & Pases Digitales QR' : 'Mis Invitados & Pases de Visita'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isAdmin
              ? 'Gestión global de visitantes, pases QR firmados con HMAC-SHA256 y lista de restricción.'
              : 'Agregue y gestione sus propios visitantes autorizados y descargue sus pases QR firmados.'}
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenNewModal}>
          <UserPlus size={18} />
          <span>Autorizar Nuevo Visitante</span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            color: 'var(--rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Buscar visitante por nombre, apellido, cédula o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Invitados */}
      <div className="cards-auto-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Cargando listado de visitantes...
          </div>
        ) : invitados.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: 'var(--text-dim)' }} className="glass-panel">
            No tiene visitantes registrados que coincidan con la búsqueda.
          </div>
        ) : (
          invitados.map((inv) => (
            <div
              key={inv.id}
              className="glass-panel"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: inv.bloqueado ? '1px solid rgba(244, 63, 94, 0.45)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-seguridad">VISITANTE</span>
                    {inv.bloqueado && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(244, 63, 94, 0.18)',
                          color: '#fb7185',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                        }}
                      >
                        VETADO
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {inv.cedula}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '12px' }}>
                  {inv.nombre} {inv.apellido}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                  <Building2 size={14} color="var(--accent-cyan)" />
                  <span>{inv.empresa || 'Visita Particular'}</span>
                </div>

                {(inv.motivo || inv.placa) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {inv.motivo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px' }}>
                        <FileText size={12} color="var(--accent-cyan)" />
                        {inv.motivo}
                      </span>
                    )}
                    {inv.placa && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        <Car size={12} />
                        {inv.placa}
                      </span>
                    )}
                  </div>
                )}

                {inv.paseQr?.vigenciaHasta && (
                  <div style={{ marginTop: '8px', fontSize: '0.76rem', color: 'var(--emerald)' }}>
                    Pase vigente hasta: {new Date(inv.paseQr.vigenciaHasta).toLocaleString('es-VE')}
                  </div>
                )}

                {inv.bloqueado && inv.motivoBloqueo && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: '#fb7185',
                      fontSize: '0.78rem',
                    }}
                  >
                    Motivo bloqueo: {inv.motivoBloqueo}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Autorizado por:</span>
                  <strong style={{ color: 'var(--text-muted)' }}>
                    {inv.anfitrion ? `${inv.anfitrion.nombre} ${inv.anfitrion.apellido}` : `${user?.nombre || ''} ${user?.apellido || ''}`}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.78rem' }}
                    onClick={() => setActivePass(inv)}
                    disabled={inv.bloqueado}
                  >
                    <QrCode size={15} color="var(--accent-cyan)" />
                    <span>Pase QR</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '8px 10px', fontSize: '0.78rem' }}
                    onClick={() => handleOpenEditModal(inv)}
                    title="Editar datos del visitante"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '8px 10px', fontSize: '0.78rem', color: 'var(--rose)' }}
                    onClick={() => handleDeleteGuest(inv)}
                    title="Eliminar o dar de baja al visitante"
                  >
                    <Trash2 size={15} />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        color: inv.bloqueado ? '#34d399' : '#fb7185',
                        borderColor: inv.bloqueado ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.3)',
                      }}
                      onClick={() => handleToggleBloqueo(inv)}
                      title={inv.bloqueado ? 'Quitar restricción' : 'Bloquear en Lista Negra'}
                    >
                      {inv.bloqueado ? <ShieldCheck size={15} /> : <ShieldBan size={15} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pase Digital QR Firmado en Backend */}
      {activePass && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 10, 19, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              textAlign: 'center',
              border: '1px solid var(--border-glow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-admin">PASE QR HMAC-SHA256</span>
              <button className="btn-ghost" style={{ padding: '6px' }} onClick={() => setActivePass(null)}>
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {activePass.nombre} {activePass.apellido}
            </h3>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.92rem', marginTop: '2px' }}>
              {activePass.cedula} • {activePass.empresa || 'Particular'}
            </p>

            <div
              style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '14px',
                display: 'inline-block',
                margin: '18px 0 12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              }}
            >
              {issuingPass || !qrImageUrl ? (
                <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: '0.82rem' }}>
                  Firmando pase en servidor...
                </div>
              ) : (
                <img
                  src={qrImageUrl}
                  alt={`QR ${activePass.cedula}`}
                  style={{ width: '210px', height: '210px', display: 'block' }}
                />
              )}
            </div>

            {activePass.paseQr?.vigenciaHasta && (
              <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', marginBottom: '8px', fontWeight: 600 }}>
                Vigencia hasta: {new Date(activePass.paseQr.vigenciaHasta).toLocaleString('es-VE')}
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '10px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                wordBreak: 'break-all',
              }}
            >
              {activePass.paseQr?.token || 'Solicitando firma al servidor...'}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {qrImageUrl && (
                <a
                  href={qrImageUrl}
                  download={`Pase_QR_${activePass.cedula}.png`}
                  className="btn-ghost"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <Download size={16} />
                  <span>Descargar PNG</span>
                </a>
              )}
              <button
                type="button"
                className="btn-ghost"
                disabled={issuingPass}
                onClick={() => handleRenewPass(1)}
                style={{ flex: 1 }}
                title="Emitir nueva visita con vigencia de 24 horas"
              >
                <RefreshCw size={16} />
                <span>Renovar 24h</span>
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setActivePass(null)}>
                <Check size={16} />
                <span>Listo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo / Editar Invitado */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              padding: '28px',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 25px rgba(14, 165, 233, 0.15)',
              border: '1px solid var(--border-glow)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {editingGuest ? 'Editar Datos del Visitante' : 'Autorizar Nuevo Visitante'}
              </h3>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '6px' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: V-19888777"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Empresa o Institución (Opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Proveedores C.A. o Particular"
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Motivo de la Visita
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Reunión técnica, Entrega..."
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Placa Vehículo (Opc.)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: AA123BB"
                    value={form.placa}
                    onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Vigencia del Pase QR (días)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="form-input"
                  value={form.vigenciaDias}
                  onChange={(e) => setForm({ ...form, vigenciaDias: Number(e.target.value) || 1 })}
                />
              </div>

              {isAdmin && !editingGuest && users.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Anfitrión que Autoriza
                  </label>
                  <select
                    className="form-input"
                    value={form.anfitrionId}
                    onChange={(e) => setForm({ ...form, anfitrionId: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} ({u.rol})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  <span>{editingGuest ? 'Guardar Cambios' : 'Registrar y Emitir QR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
