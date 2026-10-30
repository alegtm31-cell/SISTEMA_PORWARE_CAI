import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  ScanLine,
  Users,
  UserPlus,
  ClipboardList,
  Newspaper,
  LogOut,
  Settings,
} from 'lucide-react';
import type { Usuario, Role } from '../types';

export type NavTab = 'dashboard' | 'garita' | 'historial' | 'invitados' | 'users' | 'noticias' | 'settings';

export const ALLOWED_TABS_BY_ROLE: Record<Role, NavTab[]> = {
  ADMINISTRADOR: ['dashboard', 'garita', 'historial', 'invitados', 'users', 'noticias', 'settings'],
  SEGURIDAD: ['garita', 'settings'],
  EMPLEADO: ['invitados', 'noticias', 'settings'],
};

export function getDefaultTabForRole(role: Role): NavTab {
  switch (role) {
    case 'ADMINISTRADOR':
      return 'dashboard';
    case 'SEGURIDAD':
      return 'garita';
    case 'EMPLEADO':
      return 'invitados';
  }
}

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: Usuario | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, user, onLogout }) => {
  const allMenuItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    roles: Role[];
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMINISTRADOR'] },
    { id: 'garita', label: 'Control Garita', icon: ScanLine, roles: ['ADMINISTRADOR', 'SEGURIDAD'] },
    { id: 'invitados', label: 'Visitas / Invitados', icon: UserPlus, roles: ['ADMINISTRADOR', 'EMPLEADO'] },
    { id: 'historial', label: 'Bitácora de Accesos', icon: ClipboardList, roles: ['ADMINISTRADOR'] },
    { id: 'users', label: 'Usuarios & Personal', icon: Users, roles: ['ADMINISTRADOR'] },
    { id: 'noticias', label: 'Cartelera Informativa', icon: Newspaper, roles: ['ADMINISTRADOR', 'EMPLEADO'] },
    { id: 'settings', label: 'Ajustes', icon: Settings, roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'] },
  ];

  const userRole: Role = user?.rol || 'EMPLEADO';
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const getRoleDisplayLabel = (rol?: Role) => {
    if (rol === 'ADMINISTRADOR') return 'ADMINISTRADOR';
    if (rol === 'SEGURIDAD') return 'VIGILANTE (GARITA)';
    return 'PROPIETARIO / EMPLEADO';
  };

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      <div>
        {/* Cabecera estilo consola de seguridad */}
        <div
          style={{
            height: 'var(--header-h)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={19} color="#fff" strokeWidth={2.3} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: 'var(--text-main)',
                }}
              >
                PORWARE
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'var(--cyan)',
                  color: '#fff',
                  letterSpacing: '0.04em',
                }}
              >
                CAI
              </span>
            </div>
            <p
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-dim)',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Security Fabric v2.4
            </p>
          </div>
        </div>

        {/* Sección etiqueta */}
        <div
          style={{
            padding: '16px 18px 6px',
            fontSize: '0.66rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)',
          }}
        >
          Módulos Permitidos
        </div>

        {/* Navegación Principal */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 10px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
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
                  borderRadius: '5px',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--emerald)' : '3px solid transparent',
                  background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: isActive ? 'var(--emerald)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pie con Usuario Activo y Cerrar Sesión */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.12)',
        }}
      >
        {user && (
          <div
            style={{
              padding: '8px 10px',
              marginBottom: '8px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.nombre} {user.apellido}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--emerald)',
                }}
              />
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--cyan)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {getRoleDisplayLabel(user.rol)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            color: 'var(--rose)',
            borderColor: 'rgba(239, 68, 68, 0.22)',
            padding: '7px 10px',
            fontSize: '0.78rem',
          }}
        >
          <LogOut size={15} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
