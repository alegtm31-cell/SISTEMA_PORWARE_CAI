import React, { useState, useEffect } from 'react';
import {
  Settings,
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
  Lock,
  Phone,
  Mail,
  Building,
  Briefcase,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';
import type { ThemeMode } from '../hooks/useTheme';

interface SettingsViewProps {
  themeMode: ThemeMode;
  resolvedTheme?: 'dark' | 'light';
  onSetTheme: (mode: ThemeMode) => void;
  user: Usuario | null;
  onLogout: () => void;
  onOpenCartelera: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onSetTheme,
  user,
  onLogout,
  onOpenCartelera,
}) => {
  const currentSavedApi =
    localStorage.getItem('cai_custom_api_url') ||
    ((import.meta as any).env?.VITE_API_URL || 'http://192.168.10.8:3000');
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
    setApiUrl((import.meta as any).env?.VITE_API_URL || 'http://192.168.10.8:3000');
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
      if (profileForm.newPassword && profileForm.newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      await api.updateProfile({
        cargo: profileForm.cargo.trim() || undefined,
        departamento: profileForm.departamento.trim() || undefined,
        telefonoMovil: profileForm.telefonoMovil.trim() || undefined,
        telefonoFijo: profileForm.telefonoFijo.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      });

      setProfileMsg({
        type: 'success',
        text: 'Perfil y preferencias actualizadas exitosamente en el servidor.',
      });
      setEditingProfile(false);
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err?.message || 'Error al guardar los cambios del perfil',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Encabezado Principal de la Sección */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
              }}
            >
              <Settings size={22} />
            </div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Ajustes y Configuración
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Personalice la apariencia visual del sistema, conectividad de red y credenciales de usuario.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={onLogout}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              color: 'var(--rose)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECCIÓN 1: APARIENCIA Y TEMA */}
        <section
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Sun size={20} color="var(--amber)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Apariencia y Tema Visual
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Seleccione el esquema de contraste visual que mejor se adapte a su entorno de iluminación en garita u oficina.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Opción Dark */}
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: themeMode === 'dark' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                background: themeMode === 'dark' ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-card)',
                color: themeMode === 'dark' ? 'var(--cyan)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#090d16',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Moon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Modo Oscuro</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Alto contraste para noche o interior</div>
              </div>
              {themeMode === 'dark' && <Check size={18} color="var(--cyan)" />}
            </button>

            {/* Opción Light */}
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: themeMode === 'light' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                background: themeMode === 'light' ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-card)',
                color: themeMode === 'light' ? 'var(--cyan)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}
              >
                <Sun size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Modo Claro</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Luminoso para ambientes exteriores</div>
              </div>
              {themeMode === 'light' && <Check size={18} color="var(--cyan)" />}
            </button>

            {/* Opción System */}
            <button
              type="button"
              onClick={() => onSetTheme('system')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: themeMode === 'system' ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                background: themeMode === 'system' ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-card)',
                color: themeMode === 'system' ? 'var(--cyan)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--border-subtle)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                }}
              >
                <Laptop size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Automático</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Sincronizado con el sistema operativo
                </div>
              </div>
              {themeMode === 'system' && <Check size={18} color="var(--cyan)" />}
            </button>
          </div>
        </section>

        {/* SECCIÓN 2: CONECTIVIDAD Y RED */}
        <section
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Wifi size={20} color="var(--cyan)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Servidor API y Red Local
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Configure la dirección URL o IP local del servidor backend de CAI para despliegues de garita o intranet.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://192.168.10.8:3000 o https://cai.empresa.local"
              className="input-field"
              style={{ flex: 1, minWidth: '260px', padding: '10px 14px', fontSize: '0.88rem' }}
            />
            <button
              type="button"
              onClick={handleSaveApi}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>{savedSuccess ? 'Guardado ✓' : 'Guardar y Reconectar'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetApi}
              className="btn-ghost"
              style={{ padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Restablecer a la dirección configurada en .env"
            >
              <RotateCcw size={15} />
              <span>Por Defecto</span>
            </button>
          </div>
        </section>

        {/* SECCIÓN 3: PERFIL DE USUARIO Y SEGURIDAD */}
        {user && (
          <section
            className="glass-panel"
            style={{
              padding: '24px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={20} color="var(--emerald)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Mi Perfil y Credenciales
                </h2>
              </div>

              {!editingProfile ? (
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  <Edit3 size={15} />
                  <span>Editar Datos o Cambiar Clave</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileMsg(null);
                  }}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {profileMsg && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  color: profileMsg.type === 'success' ? 'var(--emerald)' : 'var(--rose)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {!editingProfile ? (
              /* Vista Informativa del Perfil */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Nombre Completo
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {user.nombre} {user.apellido}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Cédula / Identificación
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {user.cedula}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Rol en el Sistema
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cyan)', marginTop: '2px' }}>
                    {user.rol}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Correo Electrónico
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user.email || 'No registrado'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Cargo
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user.cargo || 'No asignado'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Departamento
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user.departamento || 'No asignado'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Teléfono Móvil
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user.telefonoMovil || 'No registrado'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Teléfono Fijo / Ext
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user.telefonoFijo || 'No registrado'}
                  </div>
                </div>
              </div>
            ) : (
              /* Formulario de Edición de Perfil */
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Correo Electrónico
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="email"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Cargo
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={profileForm.cargo}
                        onChange={(e) => setProfileForm({ ...profileForm, cargo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Departamento
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={profileForm.departamento}
                        onChange={(e) => setProfileForm({ ...profileForm, departamento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Teléfono Móvil
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="tel"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={profileForm.telefonoMovil}
                        onChange={(e) => setProfileForm({ ...profileForm, telefonoMovil: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Teléfono Fijo / Ext
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="tel"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={profileForm.telefonoFijo}
                        onChange={(e) => setProfileForm({ ...profileForm, telefonoFijo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    marginTop: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lock size={16} color="var(--amber)" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Cambio de Contraseña (Opcional)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        placeholder="Requerida para confirmar cambios"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Nueva Contraseña (mínimo 6 caracteres)
                      </label>
                      <input
                        type="password"
                        placeholder="Dejar en blanco para mantener la actual"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileMsg(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary"
                    style={{ padding: '10px 24px', fontWeight: 700 }}
                  >
                    {profileSaving ? 'Guardando cambios...' : 'Guardar Perfil'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ACCESO DIRECTO A CARTELERA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onOpenCartelera}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--blue)',
              fontSize: '0.85rem',
            }}
          >
            <Newspaper size={16} />
            <span>Ver Cartelera Informativa y Comunicados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
