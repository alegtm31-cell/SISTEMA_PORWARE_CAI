import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Bell, X, Check } from 'lucide-react';
import { api } from '../services/api';
import type { Noticia, Role } from '../types';

interface NoticiasViewProps {
  userRole?: Role;
}

export const NoticiasView: React.FC<NoticiasViewProps> = ({ userRole }) => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', contenido: '', imagenUrl: '' });

  const loadNoticias = async () => {
    setLoading(true);
    try {
      const data = await api.getNoticias();
      setNoticias(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNoticias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.contenido) return;

    await api.createNoticia({
      titulo: form.titulo.trim(),
      contenido: form.contenido.trim(),
      imagenUrl: form.imagenUrl.trim() || undefined,
    });
    setIsModalOpen(false);
    setForm({ titulo: '', contenido: '', imagenUrl: '' });
    loadNoticias();
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Cartelera Informativa & Comunicados
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Avisos de seguridad interna, protocolos de garita y comunicados institucionales.
          </p>
        </div>

        {userRole === 'ADMINISTRADOR' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Publicar Comunicado</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Cargando comunicados...
          </div>
        ) : noticias.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: 'var(--text-dim)' }} className="glass-panel">
            No hay publicaciones en la cartelera por el momento.
          </div>
        ) : (
          noticias.map((n) => (
            <div
              key={n.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bell size={16} />
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} />
                    <span>{new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {n.imagenUrl && (
                  <div style={{ marginBottom: '14px', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={n.imagenUrl}
                      alt={n.titulo}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35, marginBottom: '10px' }}>
                  {n.titulo}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {n.contenido}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Comunicado Oficial • CAI Seguridad
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nueva Noticia */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              padding: '28px',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 25px rgba(14, 165, 233, 0.15)',
              border: '1px solid var(--border-glow)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Publicar Comunicado</h3>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '6px' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Título del Comunicado
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: Nuevos horarios de acceso vehicular"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  URL de Imagen Ilustrativa (Opcional - Paridad sistema original)
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://ejemplo.com/comunicado.jpg"
                  value={form.imagenUrl}
                  onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Contenido Detallado
                </label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  placeholder="Escribe el mensaje institucional..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
