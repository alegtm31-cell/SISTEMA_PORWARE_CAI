import React, { useState } from 'react';
import { Shield, Lock, User, Mail, ArrowRight, AlertCircle, CheckCircle2, UserPlus, Wifi, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Estados Login
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');

  // Estados Registro con Correo
  const [regEmail, setRegEmail] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Configuración opcional de servidor desde el login móvil
  const [showServerCfg, setShowServerCfg] = useState(false);
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem('cai_custom_api_url') || 'http://192.168.10.12:3000',
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !password) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.login(identificador.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Credenciales inválidas o servidor no disponible.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regCedula.trim() || !regNombre.trim() || !regApellido.trim() || !regPassword) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.registerAccount({
        email: regEmail.trim().toLowerCase(),
        cedula: regCedula.trim().toUpperCase(),
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        password: regPassword,
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar la cuenta en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    const clean = serverUrl.trim().replace(/\/$/, '');
    if (clean) {
      localStorage.setItem('cai_custom_api_url', clean);
    } else {
      localStorage.removeItem('cai_custom_api_url');
    }
    setShowServerCfg(false);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
      }}
    >
      <div
        className="glass-panel login-panel-enter"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '26px 22px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera de marca */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.45)',
              marginBottom: '10px',
            }}
          >
            <Shield size={24} color="#fff" />
          </div>

          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
            }}
          >
            PORWARE <span className="text-gradient">CAI</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Control de Acceso e Identificación Institucional
          </p>
        </div>

        {/* Selector Iniciar Sesión / Registrar mi Correo con transición fluida */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            padding: '4px',
            borderRadius: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}
          >
            Registrar mi Correo
          </button>
        </div>

        {error && (
          <div
            className="form-error-shake"
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fb7185',
              fontSize: '0.8rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form
            key="login-form"
            onSubmit={handleSubmitLogin}
            className={`login-tab-fade ${error ? 'form-error-shake' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '5px',
                }}
              >
                Correo Electrónico o Cédula
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="tu.correo@empresa.com o V-12345678"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '5px',
                }}
              >
                Contraseña de Seguridad
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '4px', fontSize: '0.88rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spinner-rotate" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            key="register-form"
            onSubmit={handleSubmitRegister}
            className={`login-tab-fade ${error ? 'form-error-shake' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Correo Electrónico *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="ejemplo@correo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Nombre"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Apellido"
                  value={regApellido}
                  onChange={(e) => setRegApellido(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Cédula *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="V-12345678"
                  value={regCedula}
                  onChange={(e) => setRegCedula(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Tipo de Perfil
                </label>
                <div
                  className="form-input"
                  style={{
                    background: 'rgba(14, 165, 233, 0.08)',
                    borderColor: 'rgba(14, 165, 233, 0.3)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shield size={14} />
                  <span>Propietario / Residente</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              ℹ️ Los perfiles con privilegios de Garita o Administración son gestionados exclusivamente por la Administración.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Contraseña (mín. 6 caracteres) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '4px', fontSize: '0.88rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spinner-rotate" />
                  <span>Registrando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Registrar Correo e Ingresar</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Configuración rápida de URL del Servidor */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} color="var(--accent-emerald)" />
              <span>Autenticación JWT activa</span>
            </span>
            <button
              type="button"
              onClick={() => setShowServerCfg(!showServerCfg)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.73rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Wifi size={12} />
              <span>Servidor API</span>
            </button>
          </div>

          {showServerCfg && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                className="form-input"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:3000"
                style={{ fontSize: '0.76rem', padding: '7px 10px' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveServerUrl}
                style={{ padding: '7px 12px', fontSize: '0.75rem' }}
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
