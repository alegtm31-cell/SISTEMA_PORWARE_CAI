import React, { useEffect, useState } from 'react';
import {
  Activity,
  LogIn,
  LogOut,
  Users,
  Shield,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Server,
  RefreshCw,
  FileSpreadsheet,
  Siren,
  Database,
} from 'lucide-react';
import { api } from '../services/api';
import type { StatsSummary, HistorialRegistro } from '../types';
import type { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<StatsSummary>({
    totalRegistros: 0,
    entradasHoy: 0,
    salidasHoy: 0,
    dentroAhora: 0,
  });
  const [recentLogs, setRecentLogs] = useState<HistorialRegistro[]>([]);
  const [healthInfo, setHealthInfo] = useState<{
    status: string;
    database?: string;
    latencyMs?: string;
    uptimeSeconds?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal de Evacuación / Lista de Personas en Planta
  const [showEvacuationModal, setShowEvacuationModal] = useState(false);
  const [evacuationLoading, setEvacuationLoading] = useState(false);
  const [personasDentro, setPersonasDentro] = useState<any[]>([]);

  const loadData = async () => {
    setErrorMsg(null);
    try {
      const [s, h, health] = await Promise.all([
        api.getStats(),
        api.getHistorial(),
        api.checkHealth().catch(() => ({ status: 'offline' })),
      ]);
      setStats(s);
      setRecentLogs(h.data.slice(0, 8));
      setHealthInfo(health);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al cargar las métricas del panel.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvacuation = async () => {
    setShowEvacuationModal(true);
    setEvacuationLoading(true);
    try {
      const res = await api.getEvacuationList();
      setPersonasDentro(res.personasDentro || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al cargar la lista de personas en planta.');
    } finally {
      setEvacuationLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds?: number) => {
    if (typeof seconds !== 'number' || Number.isNaN(seconds)) return 'N/D';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const totalHoy = stats.entradasHoy + stats.salidasHoy || 1;
  const pctEntradas = Math.round((stats.entradasHoy / totalHoy) * 100);
  const pctSalidas = 100 - pctEntradas;

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Barra superior de acciones rápidas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: healthInfo?.status === 'ok' ? 'var(--emerald)' : 'var(--rose)',
              boxShadow:
                healthInfo?.status === 'ok'
                  ? '0 0 10px var(--emerald)'
                  : '0 0 10px var(--rose)',
            }}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            PANEL DE CONTROL ADMINISTRATIVO • MÉTRICAS EN TIEMPO REAL
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadData}
            className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
          >
            <RefreshCw size={13} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleOpenEvacuation}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: '0.76rem',
              borderColor: 'rgba(245, 158, 11, 0.45)',
              color: 'var(--amber)',
              background: 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <Siren size={14} />
            <span>Personas en Planta / Evacuación ({stats.dentroAhora})</span>
          </button>
          <button
            onClick={() => onNavigate('garita')}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.76rem' }}
          >
            <ScanLine size={14} />
            <span>Ir a Consola de Garita</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: 'var(--rose)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FILA 1: 4 Tarjetas KPI reales */}
      <div className="dashboard-kpi-grid">
        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <Users size={14} color="var(--cyan)" />
              Personas en Planta Ahora
            </span>
            <span className="badge badge-admin">EN VIVO</span>
          </div>
          <div className="forti-card-body" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {loading ? '—' : stats.dentroAhora}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Ocupación activa verificada
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 700 }}>
                Control Anti-Passback
              </span>
            </div>
          </div>
        </div>

        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <LogIn size={14} color="var(--emerald)" />
              Entradas Registradas Hoy
            </span>
            <span className="badge badge-entrada">CHECK-IN</span>
          </div>
          <div className="forti-card-body" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {loading ? '—' : stats.entradasHoy}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Ingresos confirmados hoy
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              {pctEntradas}% del flujo
            </div>
          </div>
        </div>

        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <LogOut size={14} color="var(--amber)" />
              Salidas Registradas Hoy
            </span>
            <span className="badge badge-salida">CHECK-OUT</span>
          </div>
          <div className="forti-card-body" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {loading ? '—' : stats.salidasHoy}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Egresos confirmados hoy
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              {pctSalidas}% del flujo
            </div>
          </div>
        </div>

        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <Activity size={14} color="var(--purple)" />
              Total Histórico Bitácora
            </span>
            <span className="badge badge-seguridad">AUDITORÍA</span>
          </div>
          <div className="forti-card-body" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {loading ? '—' : stats.totalRegistros}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Eventos registrados en PostgreSQL
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', fontWeight: 700 }}>
              100% Trazable
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2: Estado real del Backend + Distribución de Flujo + Accesos Rápidos */}
      <div className="dashboard-widgets-grid">
        {/* WIDGET 1: Estado Real del Servidor y Base de Datos */}
        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <Server size={14} color="var(--emerald)" />
              Estado del Backend & Base de Datos
            </span>
          </div>
          <div className="forti-card-body">
            <div className="kv-row">
              <span className="kv-label">Estado API</span>
              <span className="kv-value" style={{ color: healthInfo?.status === 'ok' ? 'var(--emerald)' : 'var(--rose)' }}>
                {healthInfo?.status === 'ok' ? 'OPERATIVO (OK)' : 'DESCONECTADO'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Motor PostgreSQL</span>
              <span className="kv-value" style={{ color: 'var(--cyan)' }}>
                {healthInfo?.database || 'N/D'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Latencia SQL</span>
              <span className="kv-value">{healthInfo?.latencyMs || 'N/D'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Tiempo Activo (Uptime)</span>
              <span className="kv-value">{formatUptime(healthInfo?.uptimeSeconds)}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Firma Pases QR</span>
              <span className="kv-value" style={{ color: 'var(--emerald)' }}>HMAC-SHA256 (Backend)</span>
            </div>
          </div>
        </div>

        {/* WIDGET 2: Distribución Real de Movimientos del Día */}
        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <Database size={14} color="var(--cyan)" />
              Balance Operativo del Día
            </span>
          </div>
          <div className="forti-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>Entradas ({stats.entradasHoy})</span>
                <span style={{ color: 'var(--amber)', fontWeight: 700 }}>Salidas ({stats.salidasHoy})</span>
              </div>
              <div
                style={{
                  height: '12px',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${pctEntradas}%`,
                    background: 'var(--emerald)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Movimientos Hoy</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {stats.entradasHoy + stats.salidasHoy}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Permanencia Activa</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {stats.dentroAhora}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3: Políticas Activas y Accesos Directos */}
        <div className="forti-card">
          <div className="forti-card-header">
            <span className="forti-card-title">
              <Shield size={14} color="var(--emerald)" />
              Políticas de Seguridad Activas
            </span>
            <CheckCircle2 size={14} color="var(--emerald)" />
          </div>
          <div className="forti-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <div>• Control Anti-Passback estricto en garita</div>
              <div>• Pases QR con firma HMAC-SHA256 y vigencia en tabla Visita</div>
              <div>• Bloqueo inmediato de personas vetadas (Lista Negra)</div>
              <div>• Registro de autor en bitácora de auditoría</div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                onClick={() => onNavigate('invitados')}
                className="btn-ghost"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.74rem' }}
              >
                <span>Visitas</span>
              </button>
              <button
                onClick={() => onNavigate('users')}
                className="btn-ghost"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.74rem' }}
              >
                <span>Usuarios</span>
              </button>
              <button
                onClick={() => onNavigate('noticias')}
                className="btn-ghost"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.74rem' }}
              >
                <span>Cartelera</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 3: Tabla de Eventos de Acceso en Tiempo Real */}
      <div className="forti-card">
        <div className="forti-card-header">
          <span className="forti-card-title">
            <Activity size={14} color="var(--cyan)" />
            Últimos Movimientos Registrados en Garita
          </span>
          <button
            onClick={() => onNavigate('historial')}
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            <span>Ver Bitácora Completa</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="forti-table">
            <thead>
              <tr>
                <th>Estado / Acción</th>
                <th>Hora Registro</th>
                <th>Identificación (Cédula)</th>
                <th>Nombre Completo</th>
                <th>Clasificación</th>
                <th>Observación de Garita</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    Consultando bitácora del servidor...
                  </td>
                </tr>
              ) : recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    Sin movimientos registrados todavía.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => {
                  const persona = log.usuario || log.invitado;
                  const isEntrada = log.tipo === 'ENTRADA';
                  return (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${isEntrada ? 'badge-entrada' : 'badge-salida'}`}>
                          {isEntrada ? <LogIn size={11} /> : <LogOut size={11} />}
                          {log.tipo}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString('es-VE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                        {persona?.cedula || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido'}
                      </td>
                      <td>
                        {log.invitado ? (
                          <span className="badge badge-seguridad">
                            VISITANTE ({log.invitado.empresa || 'Particular'})
                          </span>
                        ) : (
                          <span className="badge badge-empleado">
                            PERSONAL ({log.usuario?.rol})
                          </span>
                        )}
                      </td>
                      <td style={{ color: log.observacion ? 'var(--text-main)' : 'var(--text-dim)', fontSize: '0.76rem' }}>
                        {log.observacion || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Emergencia / Lista de Evacuación en Planta */}
      {showEvacuationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowEvacuationModal(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              border: '1px solid rgba(245, 158, 11, 0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Siren size={22} color="var(--amber)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Reporte en Vivo: Personas Actualmente en Planta ({personasDentro.length})
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Listado nominal para protocolo de seguridad o evacuación inmediata.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => api.downloadEvacuationCsv()}
                  className="btn-primary"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Descargar Acta CSV</span>
                </button>
                <button
                  onClick={() => setShowEvacuationModal(false)}
                  className="btn-ghost"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <table className="forti-table">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Tipo</th>
                    <th>Detalle / Empresa</th>
                    <th>Hora Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {evacuationLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        Calculando ocupación activa...
                      </td>
                    </tr>
                  ) : personasDentro.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        No se registran personas dentro de las instalaciones en este momento.
                      </td>
                    </tr>
                  ) : (
                    personasDentro.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>{p.cedula}</td>
                        <td style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</td>
                        <td>
                          <span className={`badge ${p.tipoPersona === 'INVITADO' ? 'badge-seguridad' : 'badge-empleado'}`}>
                            {p.tipoPersona}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.detalle}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                          {new Date(p.horaEntrada).toLocaleTimeString('es-VE')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
