import React from 'react';
import {
  Users,
  UserPlus,
  History,
  Newspaper,
  Terminal,
  Settings,
} from 'lucide-react';

import type { Role } from '../types';

export type ActiveTab = 'garita' | 'dashboard' | 'users' | 'invitados' | 'historial' | 'noticias' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole?: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, userRole = 'ADMINISTRADOR' }) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; roles: Role[] }[] = [
    {
      id: 'garita',
      label: 'Garita de Acceso',
      icon: <Terminal size={18} />,
      roles: ['ADMINISTRADOR', 'SEGURIDAD'],
    },
    {
      id: 'invitados',
      label: 'Visitas e Invitados',
      icon: <UserPlus size={18} />,
      roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
    },
    {
      id: 'users',
      label: 'Personal & Usuarios',
      icon: <Users size={18} />,
      roles: ['ADMINISTRADOR'],
    },
    {
      id: 'historial',
      label: 'Bitácora de Accesos',
      icon: <History size={18} />,
      roles: ['ADMINISTRADOR', 'SEGURIDAD'],
    },
    {
      id: 'noticias',
      label: 'Cartelera Informativa',
      icon: <Newspaper size={18} />,
      roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
    },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: '230px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)',
            fontWeight: 700,
            marginBottom: '12px',
            paddingLeft: '12px',
          }}
        >
          Navegación
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(14, 165, 233, 0.14) 0%, rgba(37, 99, 235, 0.06) 100%)'
                    : 'transparent',
                  color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--cyan)' : 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'settings' ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
            background: activeTab === 'settings'
              ? 'linear-gradient(90deg, rgba(14, 165, 233, 0.14) 0%, rgba(37, 99, 235, 0.06) 100%)'
              : 'var(--bg-surface)',
            color: activeTab === 'settings' ? 'var(--cyan)' : 'var(--text-main)',
            fontSize: '0.84rem',
            fontWeight: activeTab === 'settings' ? 700 : 600,
            cursor: 'pointer',
            width: '100%',
            marginBottom: '10px',
            transition: 'all 0.15s ease',
          }}
        >
          <Settings size={18} color={activeTab === 'settings' ? 'var(--cyan)' : 'var(--text-dim)'} />
          <span>Ajustes & Configuración</span>
        </button>
        <div style={{ padding: '0 12px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          Sistema CAI • Mobile v1.0.2
        </div>
      </div>
    </aside>
  );
};

