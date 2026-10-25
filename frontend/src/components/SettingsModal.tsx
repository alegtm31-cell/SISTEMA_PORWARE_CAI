import React, { useState, useEffect } from 'react';
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
  Edit3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
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

  // Edición de perfil (Paridad modificar_perfil.php del sistema original)
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    cargo: user?.cargo || '',
    departamento: user?.departamento || '',
    telefonoMovil: user?.telefonoMovil || '',
    telefonoFijo: user?.telefonoFijo || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        cargo: user.cargo || '',
        departamento: user.departamento || '',
        telefonoMovil: user.telefonoMovil || '',
        telefonoFijo: user.telefonoFijo || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
      });
    }
  }, [user]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.updateProfile({
        cargo: profileForm.cargo.trim() || undefined,
        departamento: profileForm.departamento.trim() || undefined,
        telefonoMovil: profileForm.telefonoMovil.trim() || undefined,
        telefonoFijo: profileForm.telefonoFijo.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      });
      setProfileMsg({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setTimeout(() => {
        setEditingProfile(false);
        setProfileMsg(null);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Error al actualizar perfil' });
    } finally {
      setProfileSaving(false);
    }
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
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-modal)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
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
              Modo actual: <strong>{resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}</strong>
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
          </div>

          {/* USUARIO Y PERFIL */}
          {user && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mi Perfil y Cuenta
                </label>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.76rem', gap: '4px' }}
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit3 size={13} />
                  <span>{editingProfile ? 'Cancelar' : 'Modificar Perfil'}</span>
                </button>
              </div>

              {!editingProfile ? (
                <div
                  style={{
                    padding: '12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

                  {(user.cargo || user.departamento || user.telefonoMovil) && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {user.cargo && <span>💼 {user.cargo}</span>}
                      {user.departamento && <span>🏢 {user.departamento}</span>}
                      {user.telefonoMovil && <span>📱 {user.telefonoMovil}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleSaveProfile}
                  style={{
                    padding: '14px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {profileMsg && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: profileMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        border: `1px solid ${profileMsg.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        color: profileMsg.type === 'success' ? '#4ade80' : '#fb7185',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {profileMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        Cargo
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Supervisor"
                        value={profileForm.cargo}
                        onChange={(e) => setProfileForm({ ...profileForm, cargo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        Departamento
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Mantenimiento"
                        value={profileForm.departamento}
                        onChange={(e) => setProfileForm({ ...profileForm, departamento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        Teléfono Móvil
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="0414-1234567"
                        value={profileForm.telefonoMovil}
                        onChange={(e) => setProfileForm({ ...profileForm, telefonoMovil: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        Teléfono Fijo
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="0241-1234567"
                        value={profileForm.telefonoFijo}
                        onChange={(e) => setProfileForm({ ...profileForm, telefonoFijo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Cambio de Contraseña (Opcional)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Clave actual"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Nueva clave"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ flex: 1, padding: '7px' }}
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ flex: 1, padding: '7px' }}
                      disabled={profileSaving}
                    >
                      <Check size={15} />
                      <span>{profileSaving ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </div>
                </form>
              )}
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
