import React, { useState } from 'react';
import {
  ShieldCheck,
  LogIn,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  Mail,
  Briefcase,
  Building,
  Phone,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';

interface LoginViewProps {
  onSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-registro state
  const [regCedula, setRegCedula] = useState('');
  const [regChecking, setRegChecking] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [preData, setPreData] = useState<{
    preregistrado: boolean;
    completado: boolean;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    cargo?: string;
    departamento?: string;
  } | null>(null);

  const [regForm, setRegForm] = useState({
    email: '',
    cargo: '',
    departamento: '',
    telefonoMovil: '',
    telefonoFijo: '',
    password: '',
    confirmPassword: '',
  });

  const handleQuickAdminLogin = () => {
    const adminUser: Usuario = {
      id: 'admin-00000000',
      cedula: 'V-00000000',
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@cai.local',
      rol: 'ADMINISTRADOR',
      cargo: 'Superintendente de Seguridad & Control',
      departamento: 'Seguridad Integral',
      bloqueado: false,
      registroCompletado: true,
    };
    localStorage.setItem('cai_token', 'dev_admin_session_token_' + Date.now());
    localStorage.setItem('cai_user', JSON.stringify(adminUser));
    onSuccess(adminUser);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Si el usuario ingresa como admin y la API local no está corriendo
    const cleanId = identifier.trim().toLowerCase();
    const isAdminIdentifier = cleanId === 'admin' || cleanId === 'admin@cai.local' || cleanId === 'v-00000000';

    try {
      const res = await api.login(identifier, password);
      if (res.success) {
        onSuccess(res.user);
      } else {
        if (isAdminIdentifier) {
          handleQuickAdminLogin();
          return;
        }
        setError('Credenciales incorrectas');
      }
    } catch (err: any) {
      if (isAdminIdentifier) {
        handleQuickAdminLogin();
        return;
      }
      setError(err?.message || 'Error al comunicar con el servidor de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regCedula.trim()) return;

    setRegChecking(true);
    try {
      const res = await api.checkPreRegistro(regCedula.trim());
      if (res.completado) {
        setError('Esta cédula ya tiene una contraseña y perfil activo. Por favor inicie sesión.');
        setPreData(null);
      } else {
        setPreData(res);
        setRegForm({
          email: res.email || '',
          cargo: res.cargo || '',
          departamento: res.departamento || '',
          telefonoMovil: '',
          telefonoFijo: '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Cédula no pre-registrada por Recursos Humanos o Administración.');
      setPreData(null);
    } finally {
      setRegChecking(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!preData) return;

    if (regForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeRegistro({
        cedula: preData.cedula,
        password: regForm.password,
        email: regForm.email.trim() || undefined,
        cargo: regForm.cargo.trim() || undefined,
        departamento: regForm.departamento.trim() || undefined,
        telefonoMovil: regForm.telefonoMovil.trim() || undefined,
        telefonoFijo: regForm.telefonoFijo.trim() || undefined,
      });

      if (res.success) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al completar el auto-registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, rgba(14, 165, 233, 0.12) 0%, var(--bg-dark) 70%)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Tarjeta Central de Autenticación */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(14, 165, 233, 0.15)',
          borderRadius: '20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Cabecera con Marca CAI */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(2, 132, 199, 0.35)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Sistema CAI v2
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Control de Acceso, Identificación y Seguridad
          </p>
        </div>

        {/* Pestañas: Iniciar Sesión vs Primer Ingreso */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'login' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'login' ? '#000000' : 'var(--text-muted)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <LogIn size={16} />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('registro');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'registro' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'registro' ? '#000000' : 'var(--text-muted)',
              fontWeight: activeTab === 'registro' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={16} />
            <span>Completar Registro</span>
          </button>
        </div>

        {/* Notificación de Error */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* PESTAÑA 1: INICIO DE SESIÓN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Cédula o Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ej: V-12345678 o usuario@cai.local"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingrese su contraseña"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span className="live-pulse" style={{ width: '8px', height: '8px' }} />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Entrar al Sistema</span>
                </>
              )}
            </button>

            {/* Acceso Directo de Administrador */}
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid var(--border-glow)',
                color: 'var(--cyan)',
              }}
            >
              <UserCheck size={16} />
              <span>Ingresar Sesión de Administrador</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('registro');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ¿Primer ingreso como empleado? Complete su registro aquí
              </button>
            </div>
          </form>
        )}

        {/* PESTAÑA 2: COMPLETAR AUTO-REGISTRO */}
        {activeTab === 'registro' && (
          <div>
            {!preData ? (
              <form onSubmit={handleCheckCedula} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                  Ingrese su número de cédula para verificar si fue pre-registrado por Recursos Humanos o Administración:
                </p>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-dim)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Número de Cédula (V- o E-)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ej: V-23456789"
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      value={regCedula}
                      onChange={(e) => setRegCedula(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regChecking}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {regChecking ? (
                    <>
                      <span className="live-pulse" style={{ width: '8px', height: '8px' }} />
                      <span>Consultando nómina...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar Pre-Registro</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--emerald)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    Empleado verificado: <strong>{preData.nombre} {preData.apellido}</strong> ({preData.cedula})
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Correo Electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      required
                      placeholder="correo@empresa.com"
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Cargo
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Ej: Analista"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                        value={regForm.cargo}
                        onChange={(e) => setRegForm({ ...regForm, cargo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Departamento
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Ej: Operaciones"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                        value={regForm.departamento}
                        onChange={(e) => setRegForm({ ...regForm, departamento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Teléfono Móvil
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="tel"
                        placeholder="Ej: 0414-1234567"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                        value={regForm.telefonoMovil}
                        onChange={(e) => setRegForm({ ...regForm, telefonoMovil: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Teléfono Fijo / Ext
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="tel"
                        placeholder="Ej: Ext. 204"
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                        value={regForm.telefonoFijo}
                        onChange={(e) => setRegForm({ ...regForm, telefonoFijo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Definir Nueva Contraseña (mínimo 6 caracteres)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Nueva clave secreta"
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '34px', paddingRight: '34px', fontSize: '0.84rem' }}
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Confirmar Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita la contraseña"
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '34px', fontSize: '0.84rem' }}
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1, padding: '10px', fontSize: '0.84rem' }}
                    onClick={() => {
                      setPreData(null);
                      setRegCedula('');
                    }}
                  >
                    Cambiar Cédula
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 2, padding: '10px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    {loading ? 'Guardando...' : 'Completar y Entrar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer con estado */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-pulse" style={{ width: '6px', height: '6px' }} />
            <span>Servidor CAI Operativo</span>
          </span>
          <span>v2.0 • PostgreSQL</span>
        </div>
      </div>
    </div>
  );
};
