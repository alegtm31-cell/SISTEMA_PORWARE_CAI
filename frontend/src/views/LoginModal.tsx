import React, { useState } from 'react';
import {
  ShieldCheck,
  LogIn,
  X,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Usuario) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-registro state
  const [regCedula, setRegCedula] = useState('');
  const [regChecking, setRegChecking] = useState(false);
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

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      if (res.success) {
        onSuccess(res.user);
        onClose();
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err: any) {
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
        onClose();
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
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-glow)',
          boxShadow: 'var(--panel-shadow-hover)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Autenticación CAI</h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Control de Acceso e Identificación</span>
            </div>
          </div>

          <button type="button" className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Pestañas: Iniciar Sesión vs Primer Ingreso */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '16px',
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
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'login' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'login' ? '#000' : 'var(--text-muted)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <LogIn size={15} />
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
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'registro' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'registro' ? '#000' : 'var(--text-muted)',
              fontWeight: activeTab === 'registro' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={15} />
            <span>Primer Ingreso</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.83rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Cédula o Correo Electrónico
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: admin@cai.local o V-12345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '6px' }} disabled={loading}>
                <LogIn size={18} />
                <span>{loading ? 'Verificando...' : 'Entrar al Sistema'}</span>
              </button>
            </form>
          </>
        )}

        {/* TAB 2: PRIMER INGRESO (AUTO-REGISTRO POR CÉDULA) */}
        {activeTab === 'registro' && (
          <div>
            {!preData ? (
              <form onSubmit={handleCheckCedula} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Si eres empleado nuevo pre-registrado por Recursos Humanos o Administración, introduce tu cédula de identidad para configurar tu acceso.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: V-12345678"
                    value={regCedula}
                    onChange={(e) => setRegCedula(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={regChecking}>
                  <ArrowRight size={18} />
                  <span>{regChecking ? 'Consultando nómina...' : 'Verificar Pre-Registro'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={20} color="var(--cyan)" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {preData.nombre} {preData.apellido}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Cédula pre-registrada: {preData.cedula}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Cargo
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Supervisor"
                      value={regForm.cargo}
                      onChange={(e) => setRegForm({ ...regForm, cargo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Departamento
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Operaciones"
                      value={regForm.departamento}
                      onChange={(e) => setRegForm({ ...regForm, departamento: e.target.value })}
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
                      value={regForm.telefonoMovil}
                      onChange={(e) => setRegForm({ ...regForm, telefonoMovil: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Teléfono Fijo (Opcional)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="0241-1234567"
                      value={regForm.telefonoFijo}
                      onChange={(e) => setRegForm({ ...regForm, telefonoFijo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="form-input"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repetir clave"
                      className="form-input"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => setPreData(null)}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    <Lock size={16} />
                    <span>{loading ? 'Registrando...' : 'Finalizar Registro'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
