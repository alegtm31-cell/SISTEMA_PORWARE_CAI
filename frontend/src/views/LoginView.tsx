import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera de marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.45)',
              marginBottom: '16px',
            }}
          >
            <Shield size={28} color="#fff" />
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
            }}
          >
            PORWARE <span className="text-gradient">CAI</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Control de Acceso e Identificación Institucional
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fb7185',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Cédula o Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="Ej: V-10000001 o correo@institucion.com"
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
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Contraseña de Seguridad
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '42px' }}
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
            style={{ width: '100%', padding: '13px', marginTop: '6px', fontSize: '0.95rem' }}
          >
            <span>{loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
          }}
        >
          <CheckCircle2 size={14} color="var(--accent-emerald)" />
          <span>Autenticación JWT verificada contra servidor central</span>
        </div>
      </div>
    </div>
  );
};
