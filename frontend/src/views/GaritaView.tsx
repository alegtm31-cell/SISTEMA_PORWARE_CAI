import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanLine,
  Search,
  LogIn,
  LogOut,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Clock,
  ShieldAlert,
  Camera,
  X,
  Volume2,
  VolumeX,
  Car,
  Users,
  RefreshCw,
  CloudOff,
  Trash2,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { offlineQueue, type OfflineMovementItem } from '../services/offlineQueue';
import { isSignedQrString } from '../utils/qrPass';
import type { PersonaLookup, TipoAcceso, Usuario, EventoGaritaHoy } from '../types';

interface GaritaViewProps {
  user?: Usuario | null;
}

interface PersonaDentroItem {
  historialId: string;
  horaEntrada: string;
  observacion?: string;
  tipoPersona: 'USUARIO' | 'INVITADO';
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  detalle: string;
}

export const GaritaView: React.FC<GaritaViewProps> = () => {
  const [cedulaInput, setCedulaInput] = useState('');
  const [scannedQrToken, setScannedQrToken] = useState<string | undefined>(undefined);
  const [persona, setPersona] = useState<PersonaLookup | null>(null);
  const [observacion, setObservacion] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);

  // Lista de personas actualmente dentro (GET /historial/dentro)
  const [personasDentro, setPersonasDentro] = useState<PersonaDentroItem[]>([]);
  const [dentroSearch, setDentroSearch] = useState('');
  const [loadingDentro, setLoadingDentro] = useState(true);

  // Cola offline real (IndexedDB)
  const [offlineItems, setOfflineItems] = useState<OfflineMovementItem[]>([]);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Eventos activos del día en Garita (GET /eventos/garita/hoy)
  const [eventosHoy, setEventosHoy] = useState<EventoGaritaHoy[]>([]);
  const [eventoSearch, setEventoSearch] = useState('');
  const [altaEventoId, setAltaEventoId] = useState<string | null>(null);
  const [altaCedula, setAltaCedula] = useState('');
  const [altaNombre, setAltaNombre] = useState('');
  const [altaApellido, setAltaApellido] = useState('');
  const [altaPlaca, setAltaPlaca] = useState('');
  const [savingAltaGarita, setSavingAltaGarita] = useState(false);

  // Estados para cámara escáner QR en vivo y sonido de confirmación
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Sintetizador Web Audio API para sonido en garita (solo cuando el servidor confirma o rechaza)
  const playFeedbackSound = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Ignorar si el navegador bloquea autoplay de audio
    }
  };

  const loadPersonasDentro = useCallback(async () => {
    try {
      const res = await api.getEvacuationList();
      setPersonasDentro(res.personasDentro || []);
    } catch {
      // Silencioso en refresco periódico si la red cae
    } finally {
      setLoadingDentro(false);
    }
  }, []);

  const loadEventosHoy = useCallback(async (searchTerm?: string) => {
    try {
      const list = await api.getEventosGaritaHoy(searchTerm);
      setEventosHoy(list || []);
    } catch {
      // Silencioso si no hay red
    }
  }, []);

  const handleAltaRapidaGarita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!altaEventoId) return;
    setSavingAltaGarita(true);
    setFeedback(null);
    try {
      const res = await api.altaRapidaEventoGarita(altaEventoId, {
        cedula: altaCedula.trim().toUpperCase(),
        nombre: altaNombre.trim(),
        apellido: altaApellido.trim(),
        placa: altaPlaca.trim().toUpperCase() || undefined,
      });
      setAltaEventoId(null);
      setAltaCedula('');
      setAltaNombre('');
      setAltaApellido('');
      setAltaPlaca('');
      await loadEventosHoy(eventoSearch);
      setFeedback({
        type: 'warning',
        msg: res.mensaje || 'Visitante registrado en garita como PENDIENTE de aprobación por el anfitrión.',
      });
    } catch (err: any) {
      playFeedbackSound('error');
      setFeedback({
        type: 'error',
        msg: err?.message || 'No se pudo registrar el alta rápida en garita.',
      });
    } finally {
      setSavingAltaGarita(false);
    }
  };

  const refreshOfflineQueue = useCallback(async () => {
    const list = await offlineQueue.listAll();
    setOfflineItems(list);
  }, []);

  const handleSyncOfflineQueue = useCallback(async () => {
    setSyncingOffline(true);
    try {
      const result = await api.syncOfflineQueue();
      await refreshOfflineQueue();
      if (result.synced > 0) {
        await loadPersonasDentro();
        setFeedback({
          type: result.rejected > 0 ? 'warning' : 'success',
          msg:
            result.rejected > 0
              ? `Sincronizados ${result.synced} movimiento(s). Atención: ${result.rejected} movimiento(s) fueron rechazados por el servidor.`
              : `Se sincronizaron ${result.synced} movimiento(s) pendientes con el servidor.`,
        });
      } else if (result.rejected > 0) {
        setFeedback({
          type: 'error',
          msg: `${result.rejected} movimiento(s) en cola fueron rechazados por el servidor. Revise el detalle abajo.`,
        });
      }
    } finally {
      setSyncingOffline(false);
    }
  }, [loadPersonasDentro, refreshOfflineQueue]);

  useEffect(() => {
    loadPersonasDentro();
    loadEventosHoy();
    refreshOfflineQueue();
    inputRef.current?.focus();

    const interval = setInterval(() => {
      loadPersonasDentro();
      loadEventosHoy(eventoSearch);
    }, 15000);
    const onQueueUpdate = () => {
      refreshOfflineQueue();
    };
    const onNetworkOnline = () => {
      handleSyncOfflineQueue();
    };

    window.addEventListener('cai:offline-queue-updated', onQueueUpdate);
    window.addEventListener('online', onNetworkOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cai:offline-queue-updated', onQueueUpdate);
      window.removeEventListener('online', onNetworkOnline);
    };
  }, [loadPersonasDentro, refreshOfflineQueue, handleSyncOfflineQueue]);

  // Apagar cámara al desmontar o cerrar modal
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // Ignorar errores al detener cámara
      }
      html5QrCodeRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Iniciar escáner de cámara real
  const startCameraScanner = async () => {
    setCameraError(null);
    setCameraOpen(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('cai-qr-reader');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
          },
          async (decodedText) => {
            await stopCamera();
            await executeLookupByCode(decodedText);
          },
          () => {
            // Frame sin QR detectado
          }
        );
      } catch (err: any) {
        setCameraError(
          err?.message ||
            'No se pudo acceder a la cámara. Verifique permisos del navegador o utilice el lector USB/teclado.'
        );
      }
    }, 150);
  };

  // Búsqueda unificada por Cédula o Token QR firmado en el backend (CAI2)
  const executeLookupByCode = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    setLoading(true);
    setFeedback(null);
    setPersona(null);
    setScannedQrToken(undefined);

    try {
      const signedQr = isSignedQrString(trimmed);
      const found = await api.lookupPersona(trimmed);
      setCedulaInput(found.cedula);
      setPersona(found);
      setPlacaVehiculo(found.placa || '');
      if (signedQr) {
        setScannedQrToken(trimmed);
      }

      if (found.bloqueado) {
        playFeedbackSound('error');
        setFeedback({
          type: 'error',
          msg: `ALERTA DE SEGURIDAD: Persona en LISTA NEGRA (${found.motivoBloqueo || 'Acceso restringido por administración'}).`,
        });
      } else if (signedQr && found.paseFirmado) {
        setFeedback({
          type: 'success',
          msg: `Pase QR HMAC-SHA256 verificado en el servidor para ${found.nombre} ${found.apellido}.`,
        });
      }
    } catch (err: any) {
      playFeedbackSound('error');
      setFeedback({
        type: 'error',
        msg: err.message || 'Persona o pase QR rechazado por el servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeLookupByCode(cedulaInput);
  };

  const handleRegisterAccess = async (tipo: TipoAcceso) => {
    if (!persona) return;
    setProcessing(true);
    setFeedback(null);

    try {
      const isGuest = persona.tipoPersona === 'INVITADO';
      const notaFinal = [
        placaVehiculo.trim() ? `[Vehículo: ${placaVehiculo.trim().toUpperCase()}]` : '',
        observacion.trim(),
      ]
        .filter(Boolean)
        .join(' — ');

      const result = await api.registerAccess(persona.id, isGuest, tipo, notaFinal || undefined, {
        qrToken: scannedQrToken,
        personaNombre: `${persona.nombre} ${persona.apellido}`,
        personaCedula: persona.cedula,
        allowOfflineQueue: true,
      });

      if (result.confirmed) {
        // SOLO reproducir sonido y mensaje de éxito cuando el servidor confirmó HTTP 200/201
        playFeedbackSound('success');
        setFeedback({
          type: 'success',
          msg: `✓ ${tipo} CONFIRMADA EN SERVIDOR para ${persona.nombre} ${persona.apellido} (${persona.cedula})`,
        });

        setPersona(null);
        setCedulaInput('');
        setObservacion('');
        setPlacaVehiculo('');
        setScannedQrToken(undefined);
        await loadPersonasDentro();
        await loadEventosHoy(eventoSearch);
        inputRef.current?.focus();
      } else if (result.queuedOffline) {
        // NUNCA reproducir sonido de éxito ni presentar como confirmado si quedó en cola offline
        setFeedback({
          type: 'warning',
          msg: `SIN CONEXIÓN AL SERVIDOR: El movimiento de ${tipo} para ${persona.nombre} ${persona.apellido} (${persona.cedula}) fue guardado en la cola local como PENDIENTE DE SINCRONIZAR. No está confirmado aún.`,
        });
        setPersona(null);
        setCedulaInput('');
        setObservacion('');
        setPlacaVehiculo('');
        setScannedQrToken(undefined);
        await refreshOfflineQueue();
        inputRef.current?.focus();
      }
    } catch (err: any) {
      playFeedbackSound('error');
      setFeedback({
        type: 'error',
        msg: err.message || 'El servidor rechazó el registro del movimiento.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredPersonasDentro = personasDentro.filter((p) => {
    if (!dentroSearch.trim()) return true;
    const q = dentroSearch.toLowerCase();
    return (
      p.cedula.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.detalle.toLowerCase().includes(q)
    );
  });

  const pendingCount = offlineItems.filter((i) => i.status === 'PENDING').length;
  const rejectedCount = offlineItems.filter((i) => i.status === 'REJECTED').length;

  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      {/* Encabezado de Garita */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Consola de Garita & Control de Acceso
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Escaneo de código QR o Cédula para registrar entrada/salida y listado en vivo de personas dentro.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
            style={{ padding: '10px 14px' }}
          >
            {soundEnabled ? <Volume2 size={18} color="var(--accent-cyan)" /> : <VolumeX size={18} color="var(--text-dim)" />}
            <span style={{ fontSize: '0.82rem' }}>{soundEnabled ? 'Audio Activo' : 'Silenciado'}</span>
          </button>

          <div
            className="glass-panel"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderColor: 'rgba(14, 165, 233, 0.3)',
            }}
          >
            <Users size={18} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Personas Dentro:</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {personasDentro.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Aviso Visible de Cola Offline (IndexedDB) cuando hay movimientos pendientes o rechazados */}
      {offlineItems.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            border: rejectedCount > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
            background: rejectedCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudOff size={20} color={rejectedCount > 0 ? 'var(--rose)' : 'var(--amber)'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  COLA OFFLINE DE GARITA — {pendingCount} PENDIENTE(S) DE SINCRONIZAR
                  {rejectedCount > 0 ? ` • ${rejectedCount} RECHAZADO(S) POR EL SERVIDOR` : ''}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Los movimientos en esta cola NO están confirmados hasta que el servidor los valide.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncOfflineQueue}
              disabled={syncingOffline || pendingCount === 0}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={15} />
              <span>{syncingOffline ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {offlineItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border:
                    item.status === 'REJECTED'
                      ? '1px solid rgba(239, 68, 68, 0.45)'
                      : '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className={`badge ${item.status === 'REJECTED' ? 'badge-salida' : 'badge-seguridad'}`}
                      style={{
                        background: item.status === 'REJECTED' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)',
                        color: item.status === 'REJECTED' ? 'var(--rose)' : 'var(--amber)',
                      }}
                    >
                      {item.status === 'REJECTED' ? 'RECHAZADO POR SERVIDOR' : 'PENDIENTE DE SINCRONIZAR'}
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      {item.tipo} — {item.personaNombre} ({item.personaCedula})
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(item.queuedAt).toLocaleTimeString('es-VE')}
                    </span>
                  </div>
                  {item.errorMsg && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '4px', fontWeight: 600 }}>
                      Motivo del rechazo: {item.errorMsg}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.status === 'REJECTED' && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      onClick={async () => {
                        await offlineQueue.resetToPending(item.id);
                        await handleSyncOfflineQueue();
                      }}
                    >
                      Reintentar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--rose)' }}
                    onClick={async () => {
                      await offlineQueue.remove(item.id);
                      await refreshOfflineQueue();
                    }}
                    title="Descartar movimiento de la cola offline"
                  >
                    <Trash2 size={14} />
                    <span>Descartar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensajes de Alerta / Confirmación */}
      {feedback && (
        <div
          className="animate-fade-in"
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background:
              feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.14)'
                : feedback.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(244, 63, 94, 0.14)',
            border:
              feedback.type === 'success'
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : feedback.type === 'warning'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(244, 63, 94, 0.35)',
            color:
              feedback.type === 'success'
                ? '#34d399'
                : feedback.type === 'warning'
                  ? '#fbbf24'
                  : '#fb7185',
            fontWeight: 600,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="responsive-two-col">
        {/* Panel Izquierdo: Escáner QR / Cédula */}
        <div className="glass-panel" style={{ padding: '28px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.14)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScanLine size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Identificación QR / Cédula
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lector óptico USB, cámara o ingreso manual
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cameraOpen ? stopCamera : startCameraScanner}
              className="btn-ghost"
              style={{
                borderColor: cameraOpen ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.35)',
                color: cameraOpen ? '#fb7185' : 'var(--accent-cyan)',
                padding: '8px 12px',
                fontSize: '0.8rem',
              }}
            >
              {cameraOpen ? <X size={16} /> : <Camera size={16} />}
              <span>{cameraOpen ? 'Cerrar Cámara' : 'Escanear con Cámara'}</span>
            </button>
          </div>

          {cameraOpen && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-glow)',
              }}
            >
              <div id="cai-qr-reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }} />
              {cameraError && (
                <p style={{ color: '#fb7185', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                  {cameraError}
                </p>
              )}
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px', textAlign: 'center' }}>
                Apunte la cámara al Pase QR firmado (CAI2) o código de identificación del visitante
              </p>
            </div>
          )}

          <form onSubmit={handleLookup}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Número de Cédula o Token Pase QR (CAI2)
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Ej: V-10000001 o escanee el código QR..."
                value={cedulaInput}
                onChange={(e) => setCedulaInput(e.target.value)}
                style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}
              />
              <button type="submit" className="btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
                <Search size={18} />
                <span>{loading ? 'Verificando...' : 'Verificar'}</span>
              </button>
            </div>
          </form>

          {/* Ficha de Persona Verificada */}
          {persona && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${
                        persona.tipoPersona === 'USUARIO' ? 'badge-empleado' : 'badge-seguridad'
                      }`}
                    >
                      {persona.tipoPersona === 'USUARIO' ? `PERSONAL (${persona.rol})` : 'VISITANTE / INVITADO'}
                    </span>

                    {persona.paseFirmado && (
                      <span className="badge badge-entrada" title="Firma HMAC-SHA256 verificada en el servidor">
                        PASE QR VERIFICADO
                      </span>
                    )}

                    {persona.bloqueado && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(244, 63, 94, 0.2)',
                          color: '#fb7185',
                          border: '1px solid rgba(244, 63, 94, 0.45)',
                        }}
                      >
                        VETADO / LISTA NEGRA
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-main)' }}>
                    {persona.nombre} {persona.apellido}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.95rem', marginTop: '2px' }}>
                    C.I: {persona.cedula}
                  </p>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: persona.estaDentro ? 'rgba(16, 185, 129, 0.14)' : 'rgba(148, 163, 184, 0.12)',
                    border: persona.estaDentro ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)',
                    color: persona.estaDentro ? '#34d399' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {persona.estaDentro ? 'DENTRO DE PLANTA' : 'FUERA DE PLANTA'}
                </div>
              </div>

              {persona.tipoPersona === 'INVITADO' && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    border: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Empresa / Procedencia
                    </span>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={14} color="var(--accent-cyan)" />
                      {persona.empresa || 'Particular'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Autorizado por
                    </span>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                      {persona.anfitrion ? `${persona.anfitrion.nombre} ${persona.anfitrion.apellido}` : 'Administración'}
                    </div>
                  </div>
                  {persona.vigenciaHasta && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Vigencia del Pase
                      </span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--emerald)', fontWeight: 600, marginTop: '2px' }}>
                        Válido hasta: {new Date(persona.vigenciaHasta).toLocaleString('es-VE')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {persona.ultimoMovimiento && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '16px',
                  }}
                >
                  <Clock size={14} />
                  <span>
                    Último registro: <strong>{persona.ultimoMovimiento.tipo}</strong> el{' '}
                    {new Date(persona.ultimoMovimiento.timestamp).toLocaleString('es-ES')}
                  </span>
                </div>
              )}

              <div className="form-grid-2" style={{ marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <Car size={14} color="var(--accent-cyan)" />
                    <span>Placa Vehículo (Opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: AB123CD"
                    value={placaVehiculo}
                    onChange={(e) => setPlacaVehiculo(e.target.value.toUpperCase())}
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Observación de Garita (Opcional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Entrega de material, bolso revisado..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              </div>

              {persona.bloqueado ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.14)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#fb7185',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <div>ACCESO BLOQUEADO POR SEGURIDAD</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '2px' }}>
                      Motivo: {persona.motivoBloqueo || 'Restricción administrativa activa.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-emerald"
                    disabled={processing || persona.estaDentro}
                    onClick={() => handleRegisterAccess('ENTRADA')}
                    style={{
                      padding: '13px',
                      fontSize: '0.92rem',
                      opacity: persona.estaDentro ? 0.35 : 1,
                      cursor: persona.estaDentro ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <LogIn size={18} />
                    <span>Registrar ENTRADA</span>
                  </button>

                  <button
                    type="button"
                    className="btn-amber"
                    disabled={processing || !persona.estaDentro}
                    onClick={() => handleRegisterAccess('SALIDA')}
                    style={{
                      padding: '13px',
                      fontSize: '0.92rem',
                      opacity: !persona.estaDentro ? 0.35 : 1,
                      cursor: !persona.estaDentro ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <LogOut size={18} />
                    <span>Registrar SALIDA</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Derecho: Lista en Vivo de Visitantes y Personas Dentro (GET /historial/dentro) */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={22} color="var(--accent-emerald)" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Personas y Visitantes Dentro ({personasDentro.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Personal y visitantes con entrada activa sin salida registrada
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadPersonasDentro}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <RefreshCw size={14} />
              <span>Actualizar</span>
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.86rem' }}
              placeholder="Buscar en planta por cédula, nombre o empresa..."
              value={dentroSearch}
              onChange={(e) => setDentroSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="forti-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th>Clasificación</th>
                  <th>Hora Entrada</th>
                  <th style={{ textAlign: 'right' }}>Acción Rápida</th>
                </tr>
              </thead>
              <tbody>
                {loadingDentro ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                      Cargando lista de personas en planta...
                    </td>
                  </tr>
                ) : filteredPersonasDentro.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No hay personas dentro de las instalaciones que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredPersonasDentro.map((item) => (
                    <tr key={`${item.tipoPersona}-${item.id}`}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                        {item.cedula}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.nombre} {item.apellido}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{item.detalle}</div>
                      </td>
                      <td>
                        <span className={`badge ${item.tipoPersona === 'INVITADO' ? 'badge-seguridad' : 'badge-empleado'}`}>
                          {item.tipoPersona}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(item.horaEntrada).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                          onClick={() => executeLookupByCode(item.cedula)}
                          title="Seleccionar en el escáner para registrar su salida"
                        >
                          <LogOut size={13} />
                          <span>Seleccionar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sección Eventos de Hoy en Garita (Invitados APROBADOS + Alta Rápida en Puerta) */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={22} color="var(--cyan)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Eventos de Hoy — Invitados Autorizados ({eventosHoy.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Lista de visitantes con estado APROBADO en eventos activos hoy y solicitud de alta en puerta
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 260px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '7px 10px 7px 32px' }}
                placeholder="Buscar invitado por cédula..."
                value={eventoSearch}
                onChange={(e) => {
                  setEventoSearch(e.target.value);
                  loadEventosHoy(e.target.value);
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => loadEventosHoy(eventoSearch)}
              className="btn-ghost"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            >
              <RefreshCw size={14} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {eventosHoy.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
            No hay eventos activos programados para este momento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {eventosHoy.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>{ev.nombre}</strong>
                      <span className="badge badge-entrada">
                        Cupos libres: {ev.cuposDisponibles} / {ev.aforo}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Anfitrión: <strong>{ev.anfitrion}</strong> • Hasta: {new Date(ev.fin).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--cyan)', borderColor: 'rgba(14, 165, 233, 0.35)' }}
                    onClick={() => setAltaEventoId(ev.id)}
                    disabled={ev.cuposDisponibles <= 0}
                  >
                    <UserPlus size={14} />
                    <span>Anunciar en Puerta (Pendiente Anfitrión)</span>
                  </button>
                </div>

                {ev.invitadosAprobados.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', padding: '8px 0' }}>
                    Sin invitados aprobados que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="forti-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Cédula</th>
                          <th>Invitado Aprobado</th>
                          <th>Placa</th>
                          <th>Estado en Planta</th>
                          <th style={{ textAlign: 'right' }}>Control Acceso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ev.invitadosAprobados.map((inv) => (
                          <tr key={inv.eventoInvitadoId}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                              {inv.cedula}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {inv.nombre} {inv.apellido}
                              </div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                              {inv.placa || '—'}
                            </td>
                            <td>
                              <span className={`badge ${inv.estaDentro ? 'badge-entrada' : 'badge-seguridad'}`}>
                                {inv.estaDentro ? 'DENTRO' : 'POR INGRESAR'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                onClick={() => executeLookupByCode(inv.cedula)}
                              >
                                <ScanLine size={13} />
                                <span>Cargar en Escáner</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Alta Rápida en Puerta (Origen: GARITA -> PENDIENTE) */}
      {altaEventoId && (
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Anunciar Visitante de Evento en Garita
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              El visitante quedará con origen <strong>GARITA</strong> en estado <strong>PENDIENTE</strong> hasta que el anfitrión lo apruebe desde su panel.
            </p>

            <form onSubmit={handleAltaRapidaGarita} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Cédula *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="V-24555666"
                  value={altaCedula}
                  onChange={(e) => setAltaCedula(e.target.value.toUpperCase())}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={altaNombre}
                    onChange={(e) => setAltaNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={altaApellido}
                    onChange={(e) => setAltaApellido(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Placa Vehículo (Opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={altaPlaca}
                  onChange={(e) => setAltaPlaca(e.target.value.toUpperCase())}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setAltaEventoId(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingAltaGarita}>
                  <span>{savingAltaGarita ? 'Enviando...' : 'Solicitar Aprobación al Anfitrión'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
