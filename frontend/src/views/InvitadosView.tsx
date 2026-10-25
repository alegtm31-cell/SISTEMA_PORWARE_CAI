import React, { useState, useEffect } from 'react';
import {
  Search,
  QrCode,
  Check,
  Copy,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import type { Invitado, Usuario } from '../types';

interface InvitadosViewProps {
  currentUser?: Usuario | null;
}

export const InvitadosView: React.FC<InvitadosViewProps> = ({ currentUser }) => {
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [employees, setEmployees] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePass, setActivePass] = useState<Invitado | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'anunciar' | 'pases'>('anunciar');

  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    empresa: '',
    empleadoId: currentUser?.id || '',
    telefono: '',
    motivo: 'Familiar',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, empRes] = await Promise.all([
        api.getInvitados(search || undefined),
        api.getUsers(),
      ]);
      setInvitados(invRes.data);
      setEmployees(empRes.data);
      if (invRes.data.length > 0 && !activePass) {
        setActivePass(invRes.data[0]);
      }
      if (empRes.data.length > 0 && !form.empleadoId) {
        setForm((prev) => ({
          ...prev,
          empleadoId: currentUser?.id || empRes.data[0].id,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cedula || !form.nombre || !form.apellido) return;

    const payload = {
      cedula: form.cedula.trim(),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      empresa: form.empresa.trim() || form.motivo,
      empleadoId: form.empleadoId || currentUser?.id || employees[0]?.id || '',
    };

    const res = await api.createInvitado(payload);
    if (res) {
      setActivePass(res);
      setMobileTab('pases'); // en móvil pasar a ver el pase generado
    }

    setForm({
      cedula: '',
      nombre: '',
      apellido: '',
      empresa: '',
      empleadoId: currentUser?.id || employees[0]?.id || '',
      telefono: '',
      motivo: 'Familiar',
    });
    loadData();
  };

  const handleShareWhatsApp = (inv: Invitado) => {
    const hostName = inv.empleado
      ? `${inv.empleado.nombre} ${inv.empleado.apellido}`
      : currentUser
      ? `${currentUser.nombre} ${currentUser.apellido}`
      : 'Propietario / Residente';

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const mensaje = `🏢 *PASE DE ACCESO - SISTEMA CAI*\n\n` +
      `¡Hola *${inv.nombre}*! Se ha generado tu pase de acceso:\n\n` +
      `👤 *Visitante:* ${inv.nombre} ${inv.apellido}\n` +
      `🪪 *Código de Acceso / Cédula:* ${inv.cedula}\n` +
      `🏡 *Anfitrión:* ${hostName}\n` +
      `📅 *Fecha:* ${fechaHoy}\n` +
      `📍 *Motivo:* ${inv.empresa || 'Visita Autorizada'}\n\n` +
      `*Instrucciones:* Muestra tu cédula (${inv.cedula}) o este mensaje en la garita de seguridad para habilitar tu ingreso.`;

    const cleanPhone = form.telefono.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

    window.open(waUrl, '_blank');
  };

  const handleCopyPass = async (inv: Invitado) => {
    const hostName = inv.empleado
      ? `${inv.empleado.nombre} ${inv.empleado.apellido}`
      : currentUser
      ? `${currentUser.nombre} ${currentUser.apellido}`
      : 'Propietario';

    const text = `🏢 PASE DE ACCESO - SISTEMA CAI\n` +
      `Visitante: ${inv.nombre} ${inv.apellido}\n` +
      `Código de Entrada: ${inv.cedula}\n` +
      `Anfitrión: ${hostName}\n` +
      `Presenta este código en la garita para acceder.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      prompt('Copia tu código de acceso:', inv.cedula);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Selector de pestañas para móvil (Anunciar vs Pases) */}
      <div
        className="mobile-only"
        style={{
          display: 'flex',
          marginBottom: '14px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          padding: '3px',
          border: '1px solid var(--border-subtle)',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab('anunciar')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '7px',
            border: 'none',
            background: mobileTab === 'anunciar' ? 'var(--cyan)' : 'transparent',
            color: mobileTab === 'anunciar' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          ✍️ Anunciar Visita
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('pases')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '7px',
            border: 'none',
            background: mobileTab === 'pases' ? 'var(--cyan)' : 'transparent',
            color: mobileTab === 'pases' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          🎟️ Pases y Códigos ({invitados.length})
        </button>
      </div>

      {/* Grid Todo a la Mano: Columna Izquierda (Formulario) + Columna Derecha (Pases y WhatsApp) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '18px',
          alignItems: 'start',
        }}
        className="invitados-grid"
      >
        {/* Columna 1: Formulario Rápido de Anuncio (Siempre a la mano) */}
        <div
          className={`glass-panel ${mobileTab === 'anunciar' ? '' : 'desktop-only'}`}
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Anunciar Visitante
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Genera el código de acceso en segundos
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mariana"
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ruiz"
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                Cédula / Código de Acceso
              </label>
              <input
                type="text"
                required
                placeholder="V-19876543"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                WhatsApp del Visitante (Para envío directo)
              </label>
              <input
                type="tel"
                placeholder="+58 412 1234567"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Motivo / Relación
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                {['Familiar', 'Delivery', 'Reunión', 'Amigo', 'Técnico'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setForm({ ...form, motivo: chip, empresa: chip })}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: form.motivo === chip ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      background: form.motivo === chip ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                      color: form.motivo === chip ? 'var(--cyan)' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: form.motivo === chip ? 700 : 500,
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {employees.length > 0 && currentUser?.rol === 'ADMINISTRADOR' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Anfitrión Responsable
                </label>
                <select
                  className="form-input"
                  style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                  value={form.empleadoId}
                  onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido} ({emp.rol})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '6px', padding: '10px', fontSize: '0.88rem', width: '100%' }}
            >
              <Plus size={16} />
              <span>Generar Código y Pase</span>
            </button>
          </form>
        </div>

        {/* Columna 2: Pase Activo para Envío Inmediato + Lista Rápida */}
        <div
          className={`${mobileTab === 'pases' ? '' : 'desktop-only'}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Tarjeta del Pase Seleccionado / Último Generado (TODO A LA MANO) */}
          {activePass ? (
            <div
              className="glass-panel"
              style={{
                padding: '18px 20px',
                border: '1px solid var(--border-glow)',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(37, 99, 235, 0.03) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-entrada" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    AUTORIZADO
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    Pase de Acceso Listo
                  </span>
                </div>

                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  ID: {activePass.cedula}
                </span>
              </div>

              {/* Contenido del Pase en fila compacta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                {/* QR Code Escaneable */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '10px',
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(activePass.cedula)}`}
                    alt={activePass.cedula}
                    style={{ width: '84px', height: '84px' }}
                  />
                </div>

                {/* Datos del Visitante */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {activePass.nombre} {activePass.apellido}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginTop: '2px' }}>
                    {activePass.cedula}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {activePass.empresa || 'Visita Personal'}
                  </div>
                  {activePass.empleado && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Anfitrión: {activePass.empleado.nombre} {activePass.empleado.apellido}
                    </div>
                  )}
                </div>

                {/* Botones de Envío Inmediato */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '170px' }}>
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() => handleShareWhatsApp(activePass)}
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', gap: '8px' }}
                  >
                    <MessageCircle size={16} />
                    <span>Mandar por WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleCopyPass(activePass)}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', gap: '6px' }}
                  >
                    {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Buscador y Lista de Pases Anteriores */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Historial de Visitantes ({invitados.length})
              </h3>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={14}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem', height: '32px' }}
                  placeholder="Filtrar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                Cargando...
              </div>
            ) : invitados.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                No hay visitantes registrados todavía.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {invitados.map((inv) => {
                  const isSelected = activePass?.id === inv.id;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setActivePass(inv)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--border-subtle)' : 'var(--bg-table-row)',
                        border: isSelected ? '1px solid var(--border-glow)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--cyan)' : 'var(--border-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          {inv.nombre[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {inv.nombre} {inv.apellido}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {inv.cedula} {inv.empresa ? `• ${inv.empresa}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '5px 8px', fontSize: '0.74rem', color: 'var(--emerald)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareWhatsApp(inv);
                          }}
                          title="Mandar WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePass(inv);
                          }}
                        >
                          <QrCode size={13} />
                          <span>QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
