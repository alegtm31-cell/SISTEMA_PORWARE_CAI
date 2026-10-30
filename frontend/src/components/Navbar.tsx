import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
  Menu,
} from 'lucide-react';
import type { Usuario } from '../types';
import { useTheme } from '../hooks/useTheme';

interface NavbarProps {
  user: Usuario | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
  activeTabLabel?: string;
  onQuickAction?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenSettings,
  activeTabLabel = 'Dashboard',
  onQuickAction,
  onToggleMobileMenu,
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('es-ES'));
  const { resolvedTheme, cycleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--navbar-shadow)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Lado Izquierdo: Botón Menú Móvil, Brand y Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Botón Hamburguesa para Móvil */}
        <button
          type="button"
          className="mobile-only"
          onClick={onToggleMobileMenu}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '6px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
          title="Menú de Navegación"
        >
          <Menu size={20} />
        </button>

        {/* Identificador Brand Porware CAI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.4)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-main)',
              }}
            >
              PORWARE
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: '3px',
                background: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              CAI
            </span>
          </div>
        </div>

        {/* Separador vertical */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} className="desktop-only" />

        {/* Breadcrumb Contextual */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Sistema</span>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activeTabLabel}</span>
        </div>

        {/* Caja de Búsqueda Estilo Fortinet (Desktop) */}
        <div
          className="desktop-only"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '8px',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar torniquete, usuario o IP..."
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '5px 12px 5px 30px',
              fontSize: '12px',
              color: 'var(--text-main)',
              width: '210px',
              outline: 'none',
              transition: 'border-color 0.15s ease, width 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.width = '270px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.width = '210px';
            }}
          />
        </div>
      </div>

      {/* Lado Derecho: Telemetría, Switch de Tema, Botón + Add widget, y Perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Reloj y Telemetría en vivo (Desktop) */}
        <div
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Clock size={12} />
          <span>{time}</span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>CPU 14%</span>
        </div>

        {/* Switch Rápido de Tema Claro / Oscuro */}
        <button
          type="button"
          onClick={cycleTheme}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '5px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'background-color 0.15s ease',
          }}
          title={`Tema actual: ${resolvedTheme}. Clic para alternar.`}
        >
          {resolvedTheme === 'dark' ? <Moon size={14} color="#60a5fa" /> : <Sun size={14} color="#f59e0b" />}
          <span className="desktop-only" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
            {resolvedTheme}
          </span>
        </button>

        {/* Botón Destacado '+ Add widget' (Desktop) */}
        <button
          type="button"
          className="btn-primary desktop-only"
          onClick={onQuickAction || onOpenSettings}
          style={{
            padding: '5px 11px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '4px',
            gap: '5px',
          }}
        >
          <Plus size={14} />
          <span>Add widget</span>
        </button>

        {/* Botón de Ajustes */}
        <button
          type="button"
          className="widget-action-btn"
          style={{ width: '28px', height: '28px', borderRadius: '4px' }}
          title="Ajustes de Sistema"
          onClick={onOpenSettings}
        >
          <Settings size={15} />
        </button>

        {/* Usuario y Cierre de Sesión */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '6px',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={user.nombre || user.cedula}
            >
              {(user.nombre || user.cedula || 'A').charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              className="widget-action-btn"
              style={{ width: '28px', height: '28px', borderRadius: '4px', color: 'var(--rose)' }}
              title="Cerrar Sesión"
              onClick={onLogout}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
