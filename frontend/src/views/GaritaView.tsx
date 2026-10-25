import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  UserCheck,
  Building2,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Search,
  Camera,
  ShieldBan,
  Flame,
  Printer,
  X,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { api, playChime } from '../services/api';
import type { PersonaLookup, HistorialRegistro } from '../types';
import { parseScannedCode } from '../utils/qrPass';

export const GaritaView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [persona, setPersona] = useState<PersonaLookup | null>(null);
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'blocked'; message: string } | null>(null);
  const [scannedPassInfo, setScannedPassInfo] = useState<{
    isSignedPass: boolean;
    vigencia?: string;
    nombre?: string;
    placa?: string;
    isValid: boolean;
  } | null>(null);
  const [recentMoves, setRecentMoves] = useState<HistorialRegistro[]>([]);
  const [isBitacoraOpen, setIsBitacoraOpen] = useState(window.innerWidth > 1080);
  
  // Estados de escáner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRollCallOpen, setIsRollCallOpen] = useState(false);
  const [evacuationList, setEvacuationList] = useState<Array<{
    id: string;
    nombre: string;
    cedula: string;
    tipo: string;
    empresa: string;
    horaIngreso: string;
    fotoUrl?: string;
  }>>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef<{ text: string; lastTime: number }>({ text: '', lastTime: 0 });

  const quickTags = ['Vehículo', 'Laptop / Equipos', 'Reunión', 'Almuerzo', 'Mantenimiento'];

  // Cargar últimos movimientos
  const loadRecent = async () => {
    try {
      const stats = await api.getStats();
      if (stats && Array.isArray(stats.ultimosMovimientos)) {
        setRecentMoves(stats.ultimosMovimientos);
      }
    } catch {
      // Manejar silenciosamente si aún no hay sesión o si está conectando
    }
  };

  useEffect(() => {
    loadRecent();
    inputRef.current?.focus();

    // LISTENER GLOBAL DE PISTOLA LÁSER USB (Emulación de Teclado HID)
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      const now = Date.now();
      const timeDiff = now - barcodeBuffer.current.lastTime;
      barcodeBuffer.current.lastTime = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.text.length >= 4) {
          const scannedCode = barcodeBuffer.current.text.trim();
          barcodeBuffer.current.text = '';
          playChime('laser');
          setQuery(scannedCode);
          handleSearch(scannedCode);
        }
        return;
      }

      if (timeDiff < 55 || barcodeBuffer.current.text === '') {
        if (e.key.length === 1) {
          barcodeBuffer.current.text += e.key;
        }
      } else {
        if (e.key.length === 1) {
          barcodeBuffer.current.text = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  // Escáner de Cámara con html5-qrcode
  useEffect(() => {
    if (!isCameraActive) return;

    const scanner = new Html5QrcodeScanner(
      'camera-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        playChime('laser');
        setIsCameraActive(false);
        setQuery(decodedText);
        handleSearch(decodedText);
        scanner.clear();
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isCameraActive]);

  // Buscar persona en vivo cuando se presiona Enter o cambia
  const handleSearch = async (val?: string) => {
    const rawTerm = val !== undefined ? val : query;
    if (!rawTerm.trim()) {
      setPersona(null);
      setScannedPassInfo(null);
      return;
    }

    const parsed = parseScannedCode(rawTerm);
    const term = parsed.cedula;

    // Validación de Pase Digital Firmado y Expiración (Auditoría Fase 4)
    if (parsed.isSignedPass) {
      setScannedPassInfo({
        isSignedPass: true,
        vigencia: parsed.vigencia,
        nombre: parsed.nombre,
        placa: parsed.placa,
        isValid: parsed.isValid,
      });

      if (parsed.isExpired) {
        playChime('alert');
        setPersona(null);
        setFeedback({
          type: 'blocked',
          message: `⛔ PASE DIGITAL EXPIRADO: Este pase venció el ${parsed.vigencia}. No se permite el acceso con pases vencidos. Solicite un nuevo pase al anfitrión.`,
        });
        return;
      }

      if (!parsed.isValid && parsed.warning) {
        playChime('alert');
        setPersona(null);
        setFeedback({
          type: 'blocked',
          message: `⛔ SEGURIDAD: ${parsed.warning} El pase digital parece haber sido adulterado o carece de firma auténtica.`,
        });
        return;
      }
    } else {
      setScannedPassInfo(null);
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.lookupPersona(term);
      if (res) {
        setPersona(res);
        // Si el pase digital incluye placa vehicular y no hay observación, auto-completar
        if (parsed.placa && !observacion) {
          setObservacion(`Vehículo autorizado: ${parsed.placa}`);
        }
        if (res.estadoSeguridad === 'BLOQUEADO') {
          playChime('alert');
          setFeedback({
            type: 'blocked',
            message: `⛔ ACCESO RESTRINGIDO: ${res.nombre} ${res.apellido} tiene el ingreso bloqueado por orden de Recursos Humanos.`,
          });
        }
      } else {
        setPersona(null);
        setFeedback({
          type: 'error',
          message: `Identificación '${term}' no encontrada. Verifica la cédula o pre-regístrala en Visitas.`,
        });
      }
    } catch (err: any) {
      setPersona(null);
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al consultar persona en el servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tipo: 'ENTRADA' | 'SALIDA') => {
    if (!persona) return;

    if (persona.estadoSeguridad === 'BLOQUEADO' && tipo === 'ENTRADA') {
      playChime('alert');
      alert(`ACCESO BLOQUEADO: No se permite el ingreso a ${persona.nombre} ${persona.apellido}.\nMotivo: ${persona.motivoBloqueo}`);
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await api.registerAccess(persona.id, persona.isGuest, tipo, observacion);
      setFeedback({
        type: 'success',
        message: `¡${tipo === 'ENTRADA' ? 'Ingreso Autorizado' : 'Egreso Registrado'} con éxito para ${persona.nombre} ${persona.apellido}!`,
      });
      setPersona({
        ...persona,
        estaDentro: tipo === 'ENTRADA',
      });
      setObservacion('');
      await loadRecent();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Ocurrió un error al registrar el acceso en el servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRollCall = async () => {
    try {
      const list = await api.getEvacuationList();
      setEvacuationList(list);
      setIsRollCallOpen(true);
    } catch (err: any) {
      alert(err?.message || 'Error al obtener lista de personal dentro.');
    }
  };

  const handleClearPersona = () => {
    setPersona(null);
    setQuery('');
    setObservacion('');
    setFeedback(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="animate-fade-in garita-grid" style={{ width: '100%', minWidth: 0 }}>
      {/* Columna Principal: Terminal de Garita */}
      <div style={{ minWidth: 0, width: '100%' }}>
        {/* Cabecera Limpia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Control de Garita
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
              Validación y registro de entradas y salidas en torniquetes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              onClick={() => setIsCameraActive(!isCameraActive)}
            >
              <Camera size={15} />
              <span>{isCameraActive ? 'Cerrar Cámara' : 'Cámara Web'}</span>
            </button>

            <button
              type="button"
              className="btn-danger"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              onClick={handleOpenRollCall}
            >
              <Flame size={15} />
              <span>Evacuación</span>
            </button>
          </div>
        </div>

        {/* Visor de Cámara si está activo */}
        {isCameraActive && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid var(--cyan)',
              background: 'var(--bg-card)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan)' }}>
                Lectura Óptica por Cámara Web
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '4px' }}
                onClick={() => setIsCameraActive(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div id="camera-reader" style={{ maxWidth: '380px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }} />
          </div>
        )}

        {/* Caja de Búsqueda / Escáner Limpia */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '14px', width: '100%' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Identificación (Cédula de Identidad o Carnet)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Scan
                  size={20}
                  color="var(--cyan)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  className="form-input"
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    fontSize: '1.15rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                  placeholder="V-12345678 o escanea carnet..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  title={isCameraActive ? 'Cerrar Cámara' : 'Escanear con Cámara'}
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: isCameraActive ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: isCameraActive ? 'var(--cyan)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={18} />
                </button>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0 18px', fontSize: '0.92rem', height: '46px' }} disabled={loading}>
                <Search size={18} />
                <span className="hide-on-mobile">Validar</span>
              </button>
            </div>
          </form>
        </div>

        {/* Mensaje de Feedback */}
        {feedback && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background:
                feedback.type === 'blocked'
                  ? 'rgba(244, 63, 94, 0.25)'
                  : feedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.16)'
                  : 'rgba(244, 63, 94, 0.16)',
              border: `2px solid ${
                feedback.type === 'blocked'
                  ? '#f43f5e'
                  : feedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.5)'
                  : 'rgba(244, 63, 94, 0.5)'
              }`,
              color: feedback.type === 'success' ? '#34d399' : '#fb7185',
              fontWeight: 600,
              boxShadow: feedback.type === 'blocked' ? '0 0 30px rgba(244, 63, 94, 0.4)' : 'none',
            }}
          >
            {feedback.type === 'blocked' ? (
              <ShieldBan size={26} color="#f43f5e" style={{ flexShrink: 0 }} />
            ) : feedback.type === 'success' ? (
              <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.96rem', lineHeight: 1.4 }}>{feedback.message}</span>
          </div>
        )}

        {/* FICHA TIPO CARNET FÍSICO INTELIGENTE (SMART NFC BADGE) */}
        {persona ? (
          <div
            className="smart-badge-card animate-fade-in"
            style={{
              padding: '20px 22px',
              width: '100%',
              border:
                persona.estadoSeguridad === 'BLOQUEADO'
                  ? '2px solid #f43f5e'
                  : '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow:
                persona.estadoSeguridad === 'BLOQUEADO'
                  ? '0 0 40px rgba(244, 63, 94, 0.35)'
                  : '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
            }}
          >
            {/* Animación Láser sobre el carnet */}
            <div className="laser-scanner-line" />

            {/* Cabecera del Carnet con Ranura de Cordón y Chip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-chip" title="Smart RFID / NFC Chip" />
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                  NFC-SEC // ID: {persona.id.slice(0, 8)}
                </span>
                {scannedPassInfo?.isSignedPass && scannedPassInfo.isValid && (
                  <span
                    style={{
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--emerald)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    🔒 Pase Firmado (Vence: {scannedPassInfo.vigencia})
                  </span>
                )}
              </div>

              {/* Ranura simulada de carnet */}
              <div
                style={{
                  width: '54px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />

              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: persona.estaDentro ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${persona.estaDentro ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: persona.estaDentro ? '#34d399' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: persona.estaDentro ? '#10b981' : '#64748b',
                  }}
                />
                {persona.estaDentro ? 'EN INSTALACIONES' : 'FUERA'}
              </div>
            </div>

            {/* Cuerpo del Carnet: Foto, Datos y Holograma Compactos */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              {/* Fotografía HD enmarcada */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {persona.fotoUrl ? (
                  <img
                    src={persona.fotoUrl}
                    alt={persona.nombre}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border:
                        persona.estadoSeguridad === 'BLOQUEADO'
                          ? '3px solid #f43f5e'
                          : '3px solid #38bdf8',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      color: '#ffffff',
                    }}
                  >
                    {persona.nombre[0]}
                    {persona.apellido[0]}
                  </div>
                )}

                <span
                  style={{
                    position: 'absolute',
                    bottom: '-3px',
                    right: '-3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: persona.estadoSeguridad === 'BLOQUEADO' ? '#f43f5e' : '#10b981',
                    border: '2px solid var(--bg-surface)',
                  }}
                  title={persona.estadoSeguridad}
                />
              </div>

              {/* Datos de Identidad */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                    {persona.nombre} {persona.apellido}
                  </h2>
                  <span
                    className={`badge ${
                      persona.estadoSeguridad === 'BLOQUEADO'
                        ? 'badge-salida'
                        : persona.isGuest
                        ? 'badge-empleado'
                        : persona.rol === 'ADMINISTRADOR'
                        ? 'badge-admin'
                        : persona.rol === 'SEGURIDAD'
                        ? 'badge-seguridad'
                        : 'badge-entrada'
                    }`}
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    {persona.estadoSeguridad === 'BLOQUEADO' ? 'BLOQUEADO' : persona.isGuest ? 'VISITANTE' : persona.rol}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700 }}>
                    {persona.cedula}
                  </span>
                  {persona.empresa && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={14} /> {persona.empresa}
                    </span>
                  )}
                  {persona.empleadoAnfitrion && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: 600 }}>
                      <UserCheck size={14} /> Anfitrión: {persona.empleadoAnfitrion}
                    </span>
                  )}
                </div>

                {/* Motivo de bloqueo si aplica */}
                {persona.estadoSeguridad === 'BLOQUEADO' && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '6px', fontSize: '0.78rem', color: '#fb7185' }}>
                    <strong>Motivo de Restricción:</strong> {persona.motivoBloqueo}
                  </div>
                )}
              </div>
            </div>

            {/* Observación / Motivo Compacto */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.86rem' }}
                placeholder="Observación opcional (vehículo, entrega, etc.)..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />

              {/* Quick observation tags */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {quickTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px' }}
                    onClick={() => setObservacion((prev) => (prev ? `${prev}, ${t}` : t))}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTONES TÁCTICOS ERGONÓMICOS CON ICONOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
              <button
                type="button"
                className="btn-success"
                onClick={() => handleRegister('ENTRADA')}
                disabled={loading || persona.estadoSeguridad === 'BLOQUEADO'}
                title="Registrar Entrada"
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: persona.estadoSeguridad === 'BLOQUEADO' ? 0.4 : 1,
                  cursor: persona.estadoSeguridad === 'BLOQUEADO' ? 'not-allowed' : 'pointer',
                  boxShadow: !persona.estaDentro ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                  border: !persona.estaDentro ? '1.5px solid #34d399' : undefined,
                }}
              >
                <LogIn size={20} />
                <span>ENTRADA</span>
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() => handleRegister('SALIDA')}
                disabled={loading}
                title="Registrar Salida"
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: persona.estaDentro ? '0 0 16px rgba(244, 63, 94, 0.4)' : 'none',
                  border: persona.estaDentro ? '1.5px solid #fb7185' : undefined,
                }}
              >
                <LogOut size={20} />
                <span>SALIDA</span>
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={handleClearPersona}
                title="Limpiar y Escanear Siguiente"
                style={{
                  height: '46px',
                  width: '46px',
                  borderRadius: '10px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Estado Vacío: Esperando escaneo */
          <div
            className="glass-panel"
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
              }}
            >
              <Fingerprint size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Terminal Lista para Identificación
              </h3>
              <p style={{ fontSize: '0.84rem', maxWidth: '440px', lineHeight: 1.5, color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                Dispara con el lector láser o introduce la cédula para validar permisos de acceso y foto de seguridad.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha / Sección Inferior: Bitácora Acordeón Retráctil */}
      <div style={{ minWidth: 0, width: '100%' }}>
        <div
          onClick={() => setIsBitacoraOpen(!isBitacoraOpen)}
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            userSelect: 'none',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Bitácora de Garita
            </h2>
            <span
              className="badge"
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--cyan)',
              }}
            >
              {recentMoves.length}
            </span>

            {/* Mini preview del último movimiento cuando está colapsado */}
            {!isBitacoraOpen && recentMoves.length > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px',
                }}
              >
                • Último: {recentMoves[0].usuario?.nombre || recentMoves[0].invitado?.nombre || 'Persona'} ({recentMoves[0].tipo})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.78rem' }}>{isBitacoraOpen ? 'Contraer' : 'Expandir'}</span>
            {isBitacoraOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {isBitacoraOpen && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxHeight: '420px',
              overflowY: 'auto',
            }}
          >
            {recentMoves.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No hay movimientos registrados hoy.
              </div>
            ) : (
              recentMoves.map((mov) => {
                const nombre = mov.usuario
                  ? `${mov.usuario.nombre} ${mov.usuario.apellido}`
                  : mov.invitado
                  ? `${mov.invitado.nombre} ${mov.invitado.apellido}`
                  : 'Desconocido';

                const cedula = mov.usuario?.cedula || mov.invitado?.cedula || '---';
                const isEntrada = mov.tipo === 'ENTRADA';
                const foto = mov.usuario?.fotoUrl || mov.invitado?.fotoUrl;

                return (
                  <div
                    key={mov.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {foto ? (
                        <img
                          src={foto}
                          alt={nombre}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: `1px solid ${isEntrada ? '#10b981' : '#f43f5e'}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isEntrada ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isEntrada ? '#34d399' : '#fb7185',
                          }}
                        >
                          {isEntrada ? <LogIn size={16} /> : <LogOut size={16} />}
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {cedula} • {mov.invitado ? 'Visitante' : 'Personal'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${isEntrada ? 'badge-entrada' : 'badge-salida'}`} style={{ padding: '2px 7px', fontSize: '0.68rem' }}>
                        {mov.tipo}
                      </span>
                      <div style={{ fontSize: '0.70rem', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {new Date(mov.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL DE EMERGENCIA / ROLL CALL */}
      {isRollCallOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
          }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '780px',
              maxHeight: '85vh',
              padding: '32px',
              background: 'var(--bg-modal)',
              border: '2px solid #f43f5e',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 60px rgba(244, 63, 94, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#f43f5e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 0 20px rgba(244, 63, 94, 0.5)',
                  }}
                >
                  <Flame size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    Lista de Evacuación de Emergencia (Roll Call)
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Censo oficial en tiempo real de personas dentro de las instalaciones
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  <span>Imprimir Acta</span>
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '6px' }}
                  onClick={() => setIsRollCallOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '0.92rem',
                color: '#fb7185',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
              }}
            >
              <span>TOTAL DE PERSONAS FÍSICAMENTE EN SITIO:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>{evacuationList.length} Personas</span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Persona</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Cédula</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Categoría</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Empresa</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Hora de Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {evacuationList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.nombre}</td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{item.cedula}</td>
                      <td style={{ padding: '12px 18px' }}>{item.tipo}</td>
                      <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>{item.empresa}</td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)' }}>
                        {new Date(item.horaIngreso).toLocaleTimeString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
