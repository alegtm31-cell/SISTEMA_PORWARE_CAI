import React, { useState } from 'react';
import {
  UserPlus,
  Terminal,
  Newspaper,
  X,
  Users,
  History,
  Settings,
} from 'lucide-react';
import type { ActiveTab } from './Sidebar';
import type { Role } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole?: Role;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'ADMINISTRADOR',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGuardOrAdmin = userRole === 'ADMINISTRADOR' || userRole === 'SEGURIDAD';

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Drawer desplegable para módulos adicionales */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-medium)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px 20px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
                Todos los Módulos
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '6px' }}
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {isGuardOrAdmin && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleSelect('garita')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeTab === 'garita' ? 'var(--border-subtle)' : 'var(--bg-card)',
                    color: activeTab === 'garita' ? 'var(--cyan)' : 'var(--text-main)',
                  }}
                >
                  <Terminal size={22} color="var(--cyan)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Garita</span>
                </button>
              )}

              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleSelect('invitados')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'invitados' ? 'var(--border-subtle)' : 'var(--bg-card)',
                  color: activeTab === 'invitados' ? 'var(--amber)' : 'var(--text-main)',
                }}
              >
                <UserPlus size={22} color="var(--amber)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Visitas y Pases</span>
              </button>

              {userRole === 'ADMINISTRADOR' && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleSelect('users')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeTab === 'users' ? 'var(--border-subtle)' : 'var(--bg-card)',
                    color: activeTab === 'users' ? 'var(--violet)' : 'var(--text-main)',
                  }}
                >
                  <Users size={22} color="var(--violet)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Personal</span>
                </button>
              )}

              {isGuardOrAdmin && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleSelect('historial')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeTab === 'historial' ? 'var(--border-subtle)' : 'var(--bg-card)',
                    color: activeTab === 'historial' ? 'var(--cyan)' : 'var(--text-main)',
                  }}
                >
                  <History size={22} color="var(--cyan)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Bitácora</span>
                </button>
              )}

              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleSelect('noticias')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'noticias' ? 'var(--border-subtle)' : 'var(--bg-card)',
                  color: activeTab === 'noticias' ? 'var(--blue)' : 'var(--text-main)',
                }}
              >
                <Newspaper size={22} color="var(--blue)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cartelera</span>
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleSelect('settings')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'settings' ? 'var(--border-subtle)' : 'var(--bg-card)',
                  color: activeTab === 'settings' ? 'var(--cyan)' : 'var(--text-main)',
                }}
              >
                <Settings size={22} color="var(--cyan)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Ajustes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegación Inferior Fija para Móvil */}
      <nav
        className="mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-navbar)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '8px 12px 14px 12px',
          zIndex: 80,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {isGuardOrAdmin && (
          <button
            type="button"
            onClick={() => onSelectTab('garita')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'garita' ? 'var(--cyan)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: activeTab === 'garita' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <Terminal size={20} />
            <span>Garita</span>
          </button>
        )}

        {/* Botón Principal: Anunciar Visitas */}
        <button
          type="button"
          onClick={() => onSelectTab('invitados')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'invitados' ? 'var(--amber)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: activeTab === 'invitados' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <UserPlus size={20} />
          <span>Visitas</span>
        </button>

        {/* Noticias / Cartelera */}
        <button
          type="button"
          onClick={() => onSelectTab('noticias')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'noticias' ? 'var(--blue)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: activeTab === 'noticias' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Newspaper size={20} />
          <span>Avisos</span>
        </button>

        {/* Ajustes y Preferencias */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'settings' ? 'var(--cyan)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: activeTab === 'settings' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </nav>
    </>
  );
};
