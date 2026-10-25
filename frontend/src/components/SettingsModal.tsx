import React, { useState } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Laptop,
  Wifi,
  User,
  LogOut,
  Newspaper,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { Usuario } from '../types';
import type { ThemeMode } from '../hooks/useTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onSetTheme: (mode: ThemeMode) => void;
  user: Usuario | null;
  onLogout: () => void;
  onOpenCartelera: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  resolvedTheme,
  onSetTheme,
  user,
  onLogout,
  onOpenCartelera,
}) => {
  const currentSavedApi = localStorage.getItem('cai_custom_api_url') || ((import.meta as any).env?.VITE_API_URL || 'http://192.168.10.8:3000');
  const [apiUrl, setApiUrl] = useState(currentSavedApi);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveApi = () => {
    const trimmed = apiUrl.trim().replace(/\/$/, '');
    localStorage.setItem('cai_custom_api_url', trimmed);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 800);
  };

  const handleResetApi = () => {
    localStorage.removeItem('cai_custom_api_url');
    setApiUrl(((import.meta as any).env?.VITE_API_URL || 'http://192.168.10.8:3000'));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 160,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-modal)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Ajustes & Preferencias
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Sistema CAI Control
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* APARIENCIA / TEMA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Apariencia Visual
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: themeMode === 'dark' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                  background: themeMode === 'dark' ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-surface)',
                  color: themeMode === 'dark' ? 'var(--cyan)' : 'var(--text-main)',
                  fontWeight: themeMode === 'dark' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Moon size={15} />
                <span>Oscuro</span>
              </button>

              <button
                type="button"
                onClick={() => onSetTheme('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: themeMode === 'light' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                  background: themeMode === 'light' ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-surface)',
                  color: themeMode === 'light' ? 'var(--cyan)' : 'var(--text-main)',
                  fontWeight: themeMode === 'light' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sun size={15} />
                <span>Claro</span>
              </button>

              <button
                type="button"
                onClick={() => onSetTheme('system')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: themeMode === 'system' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                  background: themeMode === 'system' ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-surface)',
                  color: themeMode === 'system' ? 'var(--cyan)' : 'var(--text-main)',
                  fontWeight: themeMode === 'system' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Laptop size={15} />
                <span>Auto</span>
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '5px' }}>
              Actualmente renderizando en modo: <strong>{resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}</strong>
            </div>
          </div>

          {/* SERVIDOR BACKEND / IP */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Servidor Backend (API URL)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Wifi size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}
                  placeholder="http://192.168.10.8:3000"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0 14px', fontSize: '0.82rem' }}
                onClick={handleSaveApi}
              >
                {savedSuccess ? <Check size={16} /> : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0 10px' }}
                title="Restaurar por defecto"
                onClick={handleResetApi}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Modifica la IP si te conectas a otra red Wi-Fi o servidor.
            </span>
          </div>

          {/* USUARIO Y SESIÓN */}
          {user && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sesión Activa
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-main)',
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {user.nombre} {user.apellido}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {user.cedula} • {user.rol}
                    </div>
                  </div>
                </div>
                <span className="badge badge-admin" style={{ fontSize: '0.7rem' }}>
                  {user.rol}
                </span>
              </div>
            </div>
          )}

          {/* ACCIONES COMPACTAS */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ flex: 1, padding: '10px', fontSize: '0.82rem', justifyContent: 'center' }}
              onClick={() => {
                onClose();
                onOpenCartelera();
              }}
            >
              <Newspaper size={16} />
              <span>Ver Cartelera</span>
            </button>

            {user && (
              <button
                type="button"
                className="btn-danger"
                style={{ flex: 1, padding: '10px', fontSize: '0.82rem', justifyContent: 'center' }}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
