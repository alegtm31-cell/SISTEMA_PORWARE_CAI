import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Shield, Sun, Moon, Laptop } from 'lucide-react';
import { api } from '../services/api';
import type { NavTab } from './Sidebar';
import type { ThemeMode } from '../hooks/useTheme';

interface NavbarProps {
  activeTab: NavTab;
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Security Fabric Status', subtitle: 'Monitoreo en tiempo real de garitas y control de acceso' },
  garita: { title: 'Control de Garita & Escáner', subtitle: 'Verificación de identidad QR / Cédula y personal en planta' },
  historial: { title: 'Bitácora de Auditoría', subtitle: 'Registro histórico inmutable de movimientos' },
  invitados: { title: 'Visitas & Pases QR', subtitle: 'Autorización de visitantes y emisión de pases firmados' },
  eventos: { title: 'Eventos & Cupos', subtitle: 'Gestión de eventos, enlaces HMAC compartidos y aprobación de invitados' },
  users: { title: 'Directorio de Personal', subtitle: 'Gestión de empleados y operadores de seguridad' },
  noticias: { title: 'Cartelera Informativa', subtitle: 'Avisos operativos y protocolos vigentes' },
  settings: { title: 'Ajustes del Sistema', subtitle: 'Preferencias de apariencia, sesión y seguridad de cuenta' },
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, themeMode, onToggleTheme }) => {
  const [online, setOnline] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<string>('conectado');
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const verifyStatus = async () => {
      try {
        const res = await api.checkHealth();
        if (mounted) {
          setOnline(res.status === 'ok');
          setDbStatus(res.database || 'conectado');
        }
      } catch {
        if (mounted) {
          setOnline(false);
          setDbStatus('desconectado');
        }
      }
    };
    verifyStatus();
    const interval = setInterval(verifyStatus, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const info = TAB_TITLES[activeTab] || TAB_TITLES.garita;

  const getThemeLabel = () => {
    if (themeMode === 'dark') return { icon: Moon, text: 'Oscuro' };
    if (themeMode === 'light') return { icon: Sun, text: 'Claro' };
    return { icon: Laptop, text: 'Auto' };
  };

  const themeInfo = getThemeLabel();
  const ThemeIcon = themeInfo.icon;

  return (
    <header
      style={{
        height: 'var(--header-h)',
        minHeight: 'var(--header-h)',
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Izquierda: Migas de pan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            color: 'var(--cyan)',
            fontSize: '0.74rem',
            fontWeight: 700,
          }}
        >
          <Shield size={13} />
          <span>CAI-CORE</span>
        </div>

        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>/</span>

        <div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {info.title}
          </span>
          <span
            className="navbar-subtitle"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              marginLeft: '10px',
            }}
          >
            — {info.subtitle}
          </span>
        </div>
      </div>

      {/* Derecha: Telemetría real de conexión, Reloj y Conmutador de Tema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Selector de Tema (Dark / Light / Auto) */}
        <button
          onClick={onToggleTheme}
          title={`Tema actual: ${themeInfo.text}. Clic para alternar (Oscuro / Claro / Sistema)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ThemeIcon size={13} color="var(--cyan)" />
          <span>{themeInfo.text}</span>
        </button>

        {/* Estado Backend Real */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)',
            border: online
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.35)',
            color: online ? 'var(--emerald)' : 'var(--rose)',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{online ? `API ONLINE (${dbStatus.toUpperCase()})` : 'SIN CONEXIÓN AL SERVIDOR'}</span>
        </div>

        {/* Reloj del sistema */}
        <div
          className="navbar-clock"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            color: 'var(--text-main)',
          }}
        >
          <Clock size={12} color="var(--cyan)" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
