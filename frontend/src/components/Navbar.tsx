import React, { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Clock, UserCheck, Settings } from 'lucide-react';
import type { Usuario } from '../types';

interface NavbarProps {
  user: Usuario | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenLogin,
  onOpenSettings,
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('es-ES'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-navbar)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--navbar-shadow)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <ShieldCheck size={20} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
            }}
          >
            CAI
          </span>
          <span className="desktop-only" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Control de Acceso
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              color: 'var(--emerald)',
              marginLeft: '6px',
            }}
          >
            <span className="live-pulse" style={{ width: '6px', height: '6px' }} />
            <span>En línea</span>
          </span>
        </div>
      </div>

      {/* Clock, Theme Switcher & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Digital Clock */}
        <div
          className="desktop-only"
          style={{
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={14} />
          <span>{time}</span>
        </div>

        {/* Botón de Ajustes (Tema, IP, etc.) */}
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: '8px', borderRadius: '10px' }}
          title="Ajustes y Tema"
          onClick={onOpenSettings}
        >
          <Settings size={18} />
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
            {user.fotoUrl ? (
              <img
                src={user.fotoUrl}
                alt={user.nombre}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid var(--border-medium)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {user.nombre[0]}
                {user.apellido[0]}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.nombre} {user.apellido}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {user.rol}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="btn-ghost"
              title="Cerrar Sesión"
              style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--rose)' }}
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <button onClick={onOpenLogin} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <UserCheck size={16} />
            <span>Acceder</span>
          </button>
        )}
      </div>
    </header>
  );
};

