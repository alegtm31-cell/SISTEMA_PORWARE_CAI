import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  UserPlus,
  ClipboardList,
  Newspaper,
  Settings,
} from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { Role } from '../types';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole?: Role;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab, userRole = 'EMPLEADO' }) => {
  const allItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    roles: Role[];
  }> = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['ADMINISTRADOR'] },
    { id: 'garita', label: 'Garita', icon: ScanLine, roles: ['ADMINISTRADOR', 'SEGURIDAD'] },
    { id: 'invitados', label: 'Visitas', icon: UserPlus, roles: ['ADMINISTRADOR', 'EMPLEADO'] },
    { id: 'historial', label: 'Bitácora', icon: ClipboardList, roles: ['ADMINISTRADOR'] },
    { id: 'users', label: 'Personal', icon: Users, roles: ['ADMINISTRADOR'] },
    { id: 'noticias', label: 'Cartelera', icon: Newspaper, roles: ['ADMINISTRADOR', 'EMPLEADO'] },
    { id: 'settings', label: 'Ajustes', icon: Settings, roles: ['ADMINISTRADOR', 'SEGURIDAD', 'EMPLEADO'] },
  ];

  const items = allItems.filter((item) => item.roles.includes(userRole));

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación principal móvil">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
