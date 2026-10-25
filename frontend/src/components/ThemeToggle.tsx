import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '../hooks/useTheme';

interface ThemeToggleProps {
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onSetTheme: (mode: ThemeMode) => void;
  onCycleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  themeMode,
  resolvedTheme,
  onSetTheme,
}) => {
  const options: { mode: ThemeMode; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      mode: 'light',
      label: 'Claro',
      icon: <Sun size={15} />,
      tooltip: 'Tema Claro (Modo diurno)',
    },
    {
      mode: 'dark',
      label: 'Oscuro',
      icon: <Moon size={15} />,
      tooltip: 'Tema Oscuro (Modo táctico)',
    },
    {
      mode: 'system',
      label: 'Sistema',
      icon: <Monitor size={15} />,
      tooltip: `Modo Sistema (Detectado: ${resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'})`,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Selector de tema visual"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        gap: '2px',
      }}
    >
      {options.map((opt) => {
        const isSelected = themeMode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onSetTheme(opt.mode)}
            title={opt.tooltip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 11px',
              borderRadius: '9px',
              border: isSelected ? '1px solid var(--border-glow)' : '1px solid transparent',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, rgba(37, 99, 235, 0.1) 100%)'
                : 'transparent',
              color: isSelected ? 'var(--cyan)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isSelected ? '0 2px 8px -2px rgba(14, 165, 233, 0.25)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
