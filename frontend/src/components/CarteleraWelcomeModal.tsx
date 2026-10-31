import React, { useState } from 'react';
import {
  Bell,
  X,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { Noticia } from '../types';

interface CarteleraWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticias: Noticia[];
}

export const CarteleraWelcomeModal: React.FC<CarteleraWelcomeModalProps> = ({
  isOpen,
  onClose,
  noticias,
}) => {
  const [dontShowToday, setDontShowToday] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('cai_hide_cartelera_date', today);
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop-anim"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.86)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 170,
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        className="glass-panel modal-content-anim"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          background: 'var(--bg-modal)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con Badge Institucional */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
              }}
            >
              <Bell size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Cartelera Informativa
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--cyan)',
                  }}
                >
                  Oficial
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Comunicados y protocolos de seguridad al ingresar
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px' }}
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Noticias / Comunicados con Scroll */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '4px',
            marginBottom: '18px',
          }}
        >
          {noticias.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Info size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
              <div>No hay avisos urgentes publicados para el día de hoy.</div>
            </div>
          ) : (
            noticias.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: idx === 0 ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-surface)',
                  border: idx === 0 ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.titulo}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    <Calendar size={12} />
                    {new Date(item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {item.contenido}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer con Checkbox y Botón de Acción Principal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              style={{ accentColor: 'var(--cyan)' }}
            />
            <span>No volver a mostrar hoy</span>
          </label>

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.86rem' }}
            onClick={handleClose}
          >
            <span>Entendido, continuar</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
