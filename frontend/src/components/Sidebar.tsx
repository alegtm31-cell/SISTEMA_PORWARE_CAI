import React, { useState } from 'react';
import {
  LayoutDashboard,
  Terminal,
  History,
  UserPlus,
  Users,
  Newspaper,
  Settings,
  ChevronDown,
  ChevronRight,
  Shield,
  Circle,
  X,
} from 'lucide-react';
import type { Role } from '../types';

export type ActiveTab = 'dashboard' | 'garita' | 'historial' | 'invitados' | 'users' | 'noticias' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole?: Role;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'ADMINISTRADOR',
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Estado para colapsar / expandir grupos de menú
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    Favorites: false,
    'Operación & Control': false,
    'Administración & Red': false,
  });

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Favorites',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
        },
        {
          id: 'garita',
          label: 'Control Garita',
          icon: <Terminal size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD'],
          badge: 'En vivo',
        },
      ],
    },
    {
      title: 'Operación & Control',
      items: [
        {
          id: 'historial',
          label: 'Bitácora de Accesos',
          icon: <History size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD'],
        },
        {
          id: 'invitados',
          label: 'Visitas e Invitados',
          icon: <UserPlus size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
        },
      ],
    },
    {
      title: 'Administración & Red',
      items: [
        {
          id: 'users',
          label: 'Personal & Usuarios',
          icon: <Users size={16} />,
          roles: ['ADMINISTRADOR'],
        },
        {
          id: 'noticias',
          label: 'Cartelera Informativa',
          icon: <Newspaper size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
        },
        {
          id: 'settings',
          label: 'Ajustes del Sistema',
          icon: <Settings size={16} />,
          roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'],
        },
      ],
    },
  ];

  const handleItemClick = (id: ActiveTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop oscuro para móvil cuando el menú está abierto */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 98,
          }}
        />
      )}

      {/* Sidebar (Desktop fijado o Cajón Móvil flotante) */}
      <aside
        className={`desktop-sidebar ${isOpenMobile ? 'mobile-sidebar-open' : ''}`}
        style={{
          width: '240px',
          minWidth: '240px',
          background: 'var(--bg-sidebar)',
          color: 'var(--text-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          userSelect: 'none',
          flexShrink: 0,
          height: isOpenMobile ? '100vh' : 'calc(100vh - 52px)',
          position: isOpenMobile ? 'fixed' : 'sticky',
          top: isOpenMobile ? 0 : '52px',
          left: 0,
          zIndex: isOpenMobile ? 99 : 30,
          boxShadow: isOpenMobile ? '4px 0 25px rgba(0, 0, 0, 0.5)' : 'none',
          transition: 'transform 0.25s ease, background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Cabecera del Drawer si está en Móvil */}
        {isOpenMobile && (
          <div
            style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                P
              </div>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>PORWARE CAI</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-sidebar-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Menú de Navegación Jerárquico */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedGroups[group.title];

            return (
              <div key={group.title} style={{ marginBottom: '8px' }}>
                {/* Título de Sección con Chevron Desplegable */}
                <div
                  onClick={() => toggleGroup(group.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px 4px 16px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--text-sidebar-muted)',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-sidebar-muted)')}
                >
                  <span>{group.title}</span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </span>
                </div>

                {/* Lista de Ítems del Grupo */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {visibleItems.map((item) => {
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 16px 8px 18px',
                            width: '100%',
                            border: 'none',
                            borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                            background: isActive ? 'var(--primary)' : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--text-sidebar)',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-sidebar)';
                            }
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isActive ? 1 : 0.85,
                            }}
                          >
                            {item.icon}
                          </span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>

                          {item.badge && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '10px',
                                background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                                color: isActive ? '#ffffff' : 'var(--emerald)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie de Sidebar: Identidad y Estado de Cluster */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '11.5px',
          }}
        >
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
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <Shield size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--text-main)',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {userRole}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-sidebar-muted)',
                fontSize: '10.5px',
              }}
            >
              <Circle size={6} fill="var(--emerald)" color="var(--emerald)" />
              <span>Cluster Sincronizado</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
