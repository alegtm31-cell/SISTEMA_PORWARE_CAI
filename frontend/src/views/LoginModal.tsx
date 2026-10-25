import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Usuario } from '../types';


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Usuario) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch {
      setError('Error al comunicar con el servidor de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
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
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '440px',
          padding: '34px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-glow)',
          boxShadow: 'var(--panel-shadow-hover)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Autenticación CAI</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Control de Acceso e Identificación</span>
            </div>
          </div>

          <button type="button" className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
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
              fontSize: '0.85rem',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            <LogIn size={18} />
            <span>{loading ? 'Verificando...' : 'Entrar al Sistema'}</span>
          </button>
        </form>

        {/* Cuentas Rápidas de Demostración */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '10px' }}>
            Acceso Rápido de Prueba (Roles del CSV)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => quickLogin('admin@cai.local', 'admin123')}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>Carlos Rodríguez</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>admin@cai.local</span>
              </div>
              <span className="badge badge-admin">ADMIN</span>
            </button>

            <button
              type="button"
              className="btn-ghost"
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => quickLogin('seguridad@cai.local', 'guardiaPass1')}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>José Hernández</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>seguridad@cai.local</span>
              </div>
              <span className="badge badge-seguridad">GARITA</span>
            </button>

            <button
              type="button"
              className="btn-ghost"
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => quickLogin('mfernandez@cai.local', 'empleado2024')}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>María Fernández</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>mfernandez@cai.local</span>
              </div>
              <span className="badge badge-empleado">EMPLEADO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
