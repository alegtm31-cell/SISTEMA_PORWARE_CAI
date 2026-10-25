import React, { useEffect, useState } from 'react';
import {
  LogIn,
  LogOut,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import { api } from '../services/api';
import type { StatsResponse } from '../types';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalCapacidad = 100;
  const personasDentro = stats?.personasDentroAproximado || 0;
  const ocupacionPorcentaje = Math.min(100, Math.round((personasDentro / totalCapacidad) * 100));
  const espaciosLibres = Math.max(0, totalCapacidad - personasDentro);

  const hourlyData = [
    { hora: '07:00', in: 16, out: 1 },
    { hora: '08:00', in: 38, out: 3 },
    { hora: '09:00', in: 22, out: 6 },
    { hora: '10:00', in: 14, out: 9 },
    { hora: '11:00', in: 10, out: 12 },
    { hora: '12:00', in: 15, out: 34 },
    { hora: '13:00', in: 29, out: 18 },
    { hora: '14:00', in: 12, out: 8 },
    { hora: '15:00', in: 7, out: 14 },
    { hora: '16:00', in: 4, out: 31 },
  ];

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Cabecera Compacta sin espacios muertos */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Aforo y Métricas</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  color: 'var(--emerald)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                <span className="live-pulse" style={{ width: '6px', height: '6px' }} />
                En tiempo real
              </span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', margin: 0 }}>
              Control simultáneo de presencia, afluencia y bitácora de accesos.
            </p>
          </div>
        </div>

        {/* Resumen de Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
          <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} />
            <span>Actualización cada 10s</span>
          </div>
        </div>
      </div>

      {/* FILA 1: 4 KPIs Compactos y Alineados (Todo a la mano) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        {/* KPI 1: Ocupación Actual */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Ocupación en Planta</span>
            <Users size={15} color="var(--cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {loading ? '--' : personasDentro}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              / {totalCapacidad} max
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: ocupacionPorcentaje > 80 ? 'var(--rose)' : 'var(--cyan)',
              }}
            >
              {ocupacionPorcentaje}%
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${ocupacionPorcentaje}%`,
                height: '100%',
                background: ocupacionPorcentaje > 80 ? 'var(--rose)' : 'var(--cyan)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* KPI 2: Ingresos Hoy */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Ingresos Hoy</span>
            <LogIn size={15} color="var(--emerald)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {loading ? '--' : stats?.entradasHoy}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <CheckCircle2 size={12} />
              Accesos concedidos
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Registrados por torniquete
          </div>
        </div>

        {/* KPI 3: Egresos Hoy */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Egresos Hoy</span>
            <LogOut size={15} color="var(--rose)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {loading ? '--' : stats?.salidasHoy}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              salidas
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Flujo de desalojo normal
          </div>
        </div>

        {/* KPI 4: Capacidad Disponible */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Plazas Libres</span>
            <ShieldCheck size={15} color="var(--emerald)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--emerald)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {loading ? '--' : espaciosLibres}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              disponibles
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Capacidad para recibir visitas
          </div>
        </div>
      </div>

      {/* FILA 2: COCKPIT INTEGRADO (Gráfico a la Izquierda + Últimos Movimientos a la Derecha) */}
      {/* Al estar lado a lado, NO HAY QUE BAJAR NADA y NO HAY ESPACIO MUERTO */}
      <div
        className="dashboard-cockpit-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: '14px',
          alignItems: 'stretch',
        }}
      >
        {/* Lado Izquierdo: Gráfico de Tránsito por Horas */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--cyan)" />
                <span>Tránsito Horario</span>
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Ingresos vs salidas por hora
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Entradas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rose)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Salidas</span>
              </div>
            </div>
          </div>

          {/* Barras de datos compactas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '140px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '6px',
              gap: '6px',
            }}
          >
            {hourlyData.map((d) => (
              <div
                key={d.hora}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                  <div
                    title={`Entradas ${d.hora}: ${d.in}`}
                    style={{
                      width: '10px',
                      height: `${Math.max(4, (d.in / 40) * 110)}px`,
                      background: 'var(--emerald)',
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.88,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <div
                    title={`Salidas ${d.hora}: ${d.out}`}
                    style={{
                      width: '10px',
                      height: `${Math.max(4, (d.out / 40) * 110)}px`,
                      background: 'var(--rose)',
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.88,
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                  {d.hora}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>Hora pico matutina: 08:00 (38 accesos)</span>
            <span>Hora pico de egreso: 12:00 (34 salidas)</span>
          </div>
        </div>

        {/* Lado Derecho: Últimos Movimientos (Visible inmediatamente al lado, sin bajar!) */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--cyan)" />
              <span>Últimos Movimientos</span>
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Actividad en vivo
            </span>
          </div>

          {stats?.ultimosMovimientos && stats.ultimosMovimientos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stats.ultimosMovimientos.slice(0, 5).map((m) => {
                const isEntrada = m.tipo === 'ENTRADA';
                const p = m.usuario || m.invitado;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-table-row)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: isEntrada ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: isEntrada ? 'var(--emerald)' : 'var(--rose)',
                          flexShrink: 0,
                        }}
                      >
                        {isEntrada ? <LogIn size={13} /> : <LogOut size={13} />}
                      </span>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p?.nombre} {p?.apellido}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {p?.cedula} {m.observacion ? `• ${m.observacion}` : ''}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      <Clock size={11} />
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              Sin movimientos registrados en este turno.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
