import React, { useState, useEffect } from 'react';
import {
  Search,
  QrCode,
  Check,
  Copy,
  MessageCircle,
  Plus,
  Share2,
  Download,
  Calendar,
  Car,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import type { Invitado, Usuario } from '../types';
import { createDigitalPassPayload, generateLocalQrDataUrl } from '../utils/qrPass';

interface InvitadosViewProps {
  currentUser?: Usuario | null;
}

export const InvitadosView: React.FC<InvitadosViewProps> = ({ currentUser }) => {
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [employees, setEmployees] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePass, setActivePass] = useState<Invitado | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [passVigencia, setPassVigencia] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'anunciar' | 'pases'>('anunciar');

  useEffect(() => {
    if (activePass) {
      const { encoded, vigencia } = createDigitalPassPayload({
        cedula: activePass.cedula,
        nombre: activePass.nombre,
        apellido: activePass.apellido,
        placa: activePass.placa || undefined,
      });
      setPassVigencia(vigencia);
      generateLocalQrDataUrl(encoded)
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [activePass]);

  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    empresa: '',
    empleadoId: currentUser?.id || '',
    telefono: '',
    placa: '',
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
      placa: form.placa.trim().toUpperCase() || undefined,
      telefono: form.telefono.trim() || undefined,
      motivo: form.motivo.trim() || undefined,
      empleadoId: form.empleadoId || currentUser?.id || employees[0]?.id || '',
    };

    const res = await api.createInvitado(payload);
    if (res) {
      setActivePass(res);
      setMobileTab('pases'); // En móvil pasar directamente a visualizar y compartir el pase
    }

    setForm({
      cedula: '',
      nombre: '',
      apellido: '',
      empresa: '',
      empleadoId: currentUser?.id || employees[0]?.id || '',
      telefono: '',
      placa: '',
      motivo: 'Familiar',
    });
    loadData();
  };

  const getShareText = (inv: Invitado) => {
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

    const vehicleText = inv.placa ? `🚗 *Vehículo / Placa:* ${inv.placa}\n` : '';
    const vigenciaText = passVigencia ? `⏳ *Vigencia:* Válido hasta el ${passVigencia}\n` : '';

    return (
      `🏢 *PASE DE ACCESO - PORWARE CAI*\n\n` +
      `¡Hola *${inv.nombre}*! Tu anfitrión ha generado tu pase de acceso seguro:\n\n` +
      `👤 *Visitante:* ${inv.nombre} ${inv.apellido}\n` +
      `🪪 *Cédula / Documento:* ${inv.cedula}\n` +
      vehicleText +
      `🏡 *Anfitrión:* ${hostName}\n` +
      `📅 *Fecha:* ${fechaHoy}\n` +
      vigenciaText +
      `📍 *Motivo:* ${inv.empresa || inv.motivo || 'Visita Autorizada'}\n\n` +
      `*Instrucciones:* Muestra este código o tu cédula al oficial de garita para habilitar el torniquete o la barrera vehicular.`
    );
  };

  const handleShareWhatsApp = (inv: Invitado) => {
    const mensaje = getShareText(inv);
    const targetPhone = inv.telefono || form.telefono;
    const cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async (inv: Invitado) => {
    const mensaje = getShareText(inv);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Pase de Acceso - ${inv.nombre} ${inv.apellido}`,
          text: mensaje,
        });
        return;
      } catch {
        // Fallback a WhatsApp si el usuario cancela o falla
      }
    }
    handleShareWhatsApp(inv);
  };

  const handleCopyPass = async (inv: Invitado) => {
    const text = getShareText(inv);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copia tu código de acceso:', inv.cedula);
    }
  };

  const handleDownloadQr = (inv: Invitado) => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Pase_CAI_${inv.cedula}_${inv.nombre}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Encabezado Principal Orientado a Propietarios y Residentes */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Pases y Anuncio de Visitantes</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)',
              }}
            >
              App Propietarios
            </span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Pre-registra a tus invitados y envíales su pase con código QR directo por WhatsApp.
          </p>
        </div>
      </div>

      {/* Selector de pestañas para vista móvil (Anunciar vs Pases) */}
      <div
        className="mobile-only"
        style={{
          display: 'flex',
          background: 'var(--bg-input)',
          borderRadius: '6px',
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
            padding: '9px 12px',
            borderRadius: '4px',
            border: 'none',
            background: mobileTab === 'anunciar' ? 'var(--primary)' : 'transparent',
            color: mobileTab === 'anunciar' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>✍️ Anunciar Visita</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('pases')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '4px',
            border: 'none',
            background: mobileTab === 'pases' ? 'var(--primary)' : 'transparent',
            color: mobileTab === 'pases' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>🎟️ Mis Pases ({invitados.length})</span>
        </button>
      </div>

      {/* Cuadrícula Adaptable: Columna 1 (Formulario de Anuncio) + Columna 2 (Pase Activo y Lista) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '16px',
          alignItems: 'start',
        }}
        className="invitados-grid"
      >
        {/* COLUMNA 1: FORMULARIO DE ANUNCIO RÁPIDO */}
        <div
          className={`widget-card ${mobileTab === 'anunciar' ? '' : 'desktop-only'}`}
          style={{ display: mobileTab === 'anunciar' ? 'flex' : undefined }}
        >
          <div className="widget-header">
            <div className="widget-title-area">
              <Sparkles size={14} color="var(--primary)" />
              <span className="widget-title">Anunciar Nuevo Visitante</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paso 1 de 2</span>
          </div>

          <div className="widget-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Nombres y Apellidos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mariana"
                    className="form-input"
                    style={{ padding: '9px 12px', fontSize: '0.88rem' }}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ruiz"
                    className="form-input"
                    style={{ padding: '9px 12px', fontSize: '0.88rem' }}
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  />
                </div>
              </div>

              {/* Cédula / Código de Identificación */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Cédula / Documento de Identidad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-19876543 o Pasaporte"
                  className="form-input"
                  style={{ padding: '9px 12px', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                />
              </div>

              {/* Teléfono WhatsApp y Placa Vehicular */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    WhatsApp del Visitante
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="+58 412 1234567"
                    className="form-input"
                    style={{ padding: '9px 12px', fontSize: '0.88rem' }}
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Placa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="AB123CD"
                    className="form-input"
                    style={{ padding: '9px 12px', fontSize: '0.88rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                    value={form.placa}
                    onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              {/* Chips rápidos de motivo / relación */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Motivo / Tipo de Ingreso
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Familiar', 'Delivery', 'Técnico / Servicio', 'Particular', 'Uber / Taxi', 'Médico'].map((chip) => {
                    const isSelected = form.motivo === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setForm({ ...form, motivo: chip, empresa: chip })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Principal Generar */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  marginTop: '8px',
                  padding: '11px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  width: '100%',
                  borderRadius: '4px',
                  gap: '8px',
                }}
              >
                <Plus size={18} />
                <span>Generar Pase y Código QR</span>
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA 2: PASE DIGITAL ACTIVO & HISTORIAL DE PASES */}
        <div
          className={`${mobileTab === 'pases' ? '' : 'desktop-only'}`}
          style={{ display: mobileTab === 'pases' ? 'flex' : undefined, flexDirection: 'column', gap: '14px' }}
        >
          {/* TARJETA DE PASE DIGITAL INTELIGENTE */}
          {activePass ? (
            <div className="widget-card" style={{ border: '1px solid var(--primary-border)' }}>
              
              <div className="widget-header" style={{ background: 'var(--primary-light)' }}>
                <div className="widget-title-area">
                  <ShieldCheck size={16} color="var(--primary)" />
                  <span className="widget-title" style={{ color: 'var(--primary)' }}>
                    Pase Digital Autorizado
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--emerald)',
                  }}
                >
                  Listo para Enviar
                </span>
              </div>

              <div className="widget-body">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Contenedor del Código QR */}
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '6px',
                      width: '120px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={activePass.cedula}
                        style={{ width: '100px', height: '100px', display: 'block' }}
                      />
                    ) : (
                      <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                        Generando QR...
                      </div>
                    )}
                  </div>

                  {/* Datos del Pase Digital */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      {activePass.nombre} {activePass.apellido}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginTop: '2px' }}>
                      {activePass.cedula}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Motivo: <strong>{activePass.empresa || activePass.motivo || 'Visita Particular'}</strong>
                    </div>

                    {activePass.placa && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Car size={13} color="var(--primary)" />
                        <span>Placa: <strong style={{ fontFamily: 'var(--font-mono)' }}>{activePass.placa}</strong></span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--emerald)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Calendar size={12} />
                        <span>Válido hasta: {passVigencia || 'Hoy 23:59'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Compartir (WhatsApp, Copiar, Descargar) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minWidth: '180px',
                      width: '100%',
                      maxWidth: '240px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(activePass)}
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.35)',
                      }}
                    >
                      <MessageCircle size={16} />
                      <span>Enviar por WhatsApp</span>
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleCopyPass(activePass)}
                        style={{ padding: '7px 8px', fontSize: '0.78rem', justifyContent: 'center', gap: '4px' }}
                        title="Copiar texto del pase"
                      >
                        {copied ? <Check size={13} color="var(--emerald)" /> : <Copy size={13} />}
                        <span>{copied ? '¡Listo!' : 'Copiar'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleDownloadQr(activePass)}
                        style={{ padding: '7px 8px', fontSize: '0.78rem', justifyContent: 'center', gap: '4px' }}
                        title="Descargar imagen QR"
                      >
                        <Download size={13} />
                        <span>Bajar QR</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleNativeShare(activePass)}
                      style={{ padding: '7px 10px', fontSize: '0.78rem', justifyContent: 'center', gap: '6px' }}
                    >
                      <Share2 size={13} />
                      <span>Compartir General</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : null}

          {/* LISTA HISTÓRICA DE VISITANTES ANUNCIADOS */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title-area">
                <User size={14} color="var(--primary)" />
                <span className="widget-title">Mis Visitantes Anunciados ({invitados.length})</span>
              </div>
              <div style={{ position: 'relative', width: '180px' }}>
                <Search
                  size={12}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '4px 8px 4px 26px', fontSize: '0.76rem', height: '28px' }}
                  placeholder="Buscar visitante..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="widget-body" style={{ padding: '8px 12px' }}>
              {loading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Cargando visitantes...
                </div>
              ) : invitados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  No hay visitantes anunciados todavía.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {invitados.map((inv) => {
                    const isSelected = activePass?.id === inv.id;

                    return (
                      <div
                        key={inv.id}
                        onClick={() => {
                          setActivePass(inv);
                          setMobileTab('pases');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                          border: isSelected ? '1px solid var(--primary-border)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              background: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
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
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {inv.cedula} {inv.placa ? `• 🚗 ${inv.placa}` : ''} • {inv.empresa || inv.motivo || 'Visita'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="widget-action-btn"
                            style={{ width: '28px', height: '28px', color: '#25D366' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareWhatsApp(inv);
                            }}
                            title="Reenviar por WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>

                          <button
                            type="button"
                            className="widget-action-btn"
                            style={{ width: '28px', height: '28px', color: 'var(--primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePass(inv);
                              setMobileTab('pases');
                            }}
                            title="Ver Pase QR"
                          >
                            <QrCode size={15} />
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

    </div>
  );
};
