import React, { useEffect, useState } from 'react';
import {
  LogIn,
  LogOut,
  Users,
  ShieldCheck,
  RotateCw,
  MoreVertical,
  Activity,
  Maximize2,
  Server,
  PieChart,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import type { StatsResponse, HistorialRegistro } from '../types';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [historial, setHistorial] = useState<HistorialRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString('es-ES'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, histData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getHistorial().catch(() => ({ total: 0, data: [] })),
      ]);

      if (statsData) setStats(statsData);
      if (histData && histData.data) {
        setHistorial(histData.data.slice(0, 6));
      }
      setLastRefreshed(new Date().toLocaleTimeString('es-ES'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalCapacidad = 150;
  const personasDentro = stats?.personasDentroAproximado || 0;
  const ocupacionPorcentaje = Math.min(100, Math.round((personasDentro / totalCapacidad) * 100));
  const entradasHoy = stats?.entradasHoy || 0;
  const salidasHoy = stats?.salidasHoy || 0;

  // Cálculo para gráfico donut de accesos
  const totalMovs = (entradasHoy + salidasHoy) || 1;
  const pctEntradas = Math.round((entradasHoy / totalMovs) * 100);
  const pctSalidas = 100 - pctEntradas;

  return (
    <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* KPI CARDS (RESUMEN EJECUTIVO SUPERIOR) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card: Aforo Actual */}
        <div className="widget-card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Aforo en Tiempo Real
            </span>
            <Users size={15} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
              {personasDentro}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              / {totalCapacidad} max ({ocupacionPorcentaje}%)
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--chart-track)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${ocupacionPorcentaje}%`,
                background: ocupacionPorcentaje > 85 ? 'var(--rose)' : 'var(--primary)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Card: Entradas Hoy */}
        <div className="widget-card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Check-ins (Entradas)
            </span>
            <LogIn size={15} color="var(--emerald)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--emerald)' }}>
              {entradasHoy}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>accesos validados hoy</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Puertas y torniquetes autorizados
          </div>
        </div>

        {/* Card: Salidas Hoy */}
        <div className="widget-card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Check-outs (Salidas)
            </span>
            <LogOut size={15} color="var(--cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyan)' }}>
              {salidasHoy}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>egresos registrados</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Anti-passback liberado
          </div>
        </div>

        {/* Card: Estado del Cluster */}
        <div className="widget-card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Seguridad & Firmware
            </span>
            <ShieldCheck size={15} color="var(--emerald)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              CAI-OS v2.4.2
            </span>
            <span style={{ fontSize: '10px', color: 'var(--emerald)', fontWeight: 600 }}>ACTIVO</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Actualizado: {lastRefreshed}
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE WIDGETS ESTILO FORTINET */}
      <div className="widgets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        
        {/* WIDGET 1: SYSTEM INFORMATION */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-area">
              <Server size={14} color="var(--primary)" />
              <span className="widget-title">System Information</span>
            </div>
            <div className="widget-actions">
              <button
                type="button"
                className="widget-action-btn"
                title="Refrescar"
                onClick={fetchData}
              >
                <RotateCw size={11} className={loading ? 'animate-spin' : ''} />
              </button>
              <button type="button" className="widget-action-btn" title="Opciones">
                <MoreVertical size={11} />
              </button>
            </div>
          </div>
          <div className="widget-body">
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">Host Name</span>
                <span className="info-val" style={{ fontFamily: 'var(--font-mono)' }}>PORWARE-CAI-01</span>
              </div>
              <div className="info-row">
                <span className="info-label">Firmware</span>
                <span className="info-val" style={{ fontFamily: 'var(--font-mono)' }}>v2.4.2-build068</span>
              </div>
              <div className="info-row">
                <span className="info-label">System Time</span>
                <span className="info-val" style={{ fontFamily: 'var(--font-mono)' }}>{lastRefreshed} GMT-4</span>
              </div>
              <div className="info-row">
                <span className="info-label">Uptime</span>
                <span className="info-val" style={{ fontFamily: 'var(--font-mono)' }}>18d 04h 45m</span>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={12} />
                    <span>CPU Utilization</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>14%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--chart-track)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '14%', height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={12} />
                    <span>Memory Usage (RAM)</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>38%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--chart-track)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: 'var(--emerald)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 2: DISTRIBUCIÓN DE ACCESOS (DONUT CHART SVG) */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-area">
              <PieChart size={14} color="var(--primary)" />
              <span className="widget-title">Flujo de Accesos (Hoy)</span>
            </div>
            <div className="widget-actions">
              <button type="button" className="widget-action-btn" title="Refrescar" onClick={fetchData}>
                <RotateCw size={11} />
              </button>
              <button type="button" className="widget-action-btn" title="Opciones">
                <MoreVertical size={11} />
              </button>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Gráfico Donut SVG */}
              <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                <svg width="110" height="110" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--chart-track)" strokeWidth="5" />
                  {/* Entradas */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="var(--emerald)"
                    strokeWidth="5"
                    strokeDasharray={`${pctEntradas} ${100 - pctEntradas}`}
                    strokeDashoffset="25"
                  />
                  {/* Salidas */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="5"
                    strokeDasharray={`${pctSalidas} ${100 - pctSalidas}`}
                    strokeDashoffset={`${25 - pctEntradas}`}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {entradasHoy + salidasHoy}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>

              {/* Leyenda con datos reales */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--emerald)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Entradas</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {entradasHoy} ({pctEntradas}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--primary)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Salidas</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {salidasHoy} ({pctSalidas}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--amber)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>En Edificio</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {personasDentro} dentro
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3: INTERFACE & GATE CONTROLLER */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-area">
              <Activity size={14} color="var(--primary)" />
              <span className="widget-title">Interface & Gate Controller</span>
            </div>
            <div className="widget-actions">
              <button type="button" className="widget-action-btn" title="Refrescar" onClick={fetchData}>
                <RotateCw size={11} />
              </button>
              <button type="button" className="widget-action-btn" title="Opciones">
                <MoreVertical size={11} />
              </button>
            </div>
          </div>
          <div className="widget-body">
            <div className="port-matrix">
              <div className="port-box">
                <span className="port-led active" />
                <span className="port-name">WAN-1</span>
                <span className="port-meta">1000M Full</span>
              </div>
              <div className="port-box">
                <span className="port-led active" />
                <span className="port-name">Torniquete A</span>
                <span className="port-meta">PoE+ Online</span>
              </div>
              <div className="port-box">
                <span className="port-led active" />
                <span className="port-name">Torniquete B</span>
                <span className="port-meta">PoE+ Online</span>
              </div>
              <div className="port-box">
                <span className="port-led" />
                <span className="port-name">Barrera Veh.</span>
                <span className="port-meta">Standby</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Anti-Passback: <strong style={{ color: 'var(--text-main)' }}>Serializable Strict</strong></span>
              <span>Latencia: <strong style={{ color: 'var(--emerald)' }}>2.4 ms</strong></span>
            </div>
          </div>
        </div>

        {/* WIDGET 4: BITÁCORA DE EVENTOS EN TIEMPO REAL (COL-SPAN 2) */}
        <div className="widget-card col-span-2">
          <div className="widget-header">
            <div className="widget-title-area">
              <ShieldCheck size={14} color="var(--primary)" />
              <span className="widget-title">Eventos Recientes de Acceso (Auditoría en Vivo)</span>
            </div>
            <div className="widget-actions">
              <button type="button" className="widget-action-btn" title="Refrescar" onClick={fetchData}>
                <RotateCw size={11} />
              </button>
              <button type="button" className="widget-action-btn" title="Pantalla completa">
                <Maximize2 size={11} />
              </button>
            </div>
          </div>
          <div className="widget-body" style={{ padding: 0, overflowX: 'auto' }}>
            {historial.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No hay movimientos registrados hoy en la bitácora.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>HORA</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>IDENTIFICACIÓN</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>USUARIO / VISITANTE</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>MOVIMIENTO</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>DETALLE</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((reg) => {
                    const isEntrada = reg.tipo === 'ENTRADA';
                    const target = reg.usuario || reg.invitado;
                    const nombreCompleto = target ? `${target.nombre} ${target.apellido || ''}` : 'Usuario del Sistema';
                    const doc = target?.cedula || 'V-S/N';
                    const horaFormatted = new Date(reg.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {horaFormatted}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {doc}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{nombreCompleto}</span>
                          {reg.invitado && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--amber)', fontWeight: 600 }}>
                              (VISITANTE)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: isEntrada ? 'rgba(16, 185, 129, 0.14)' : 'rgba(37, 99, 235, 0.14)',
                              color: isEntrada ? 'var(--emerald)' : 'var(--primary)',
                            }}
                          >
                            {isEntrada ? '✓ ENTRADA' : '➜ SALIDA'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                          {reg.observacion || (isEntrada ? 'Check-in Torniquete A' : 'Check-out Garita Principal')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
