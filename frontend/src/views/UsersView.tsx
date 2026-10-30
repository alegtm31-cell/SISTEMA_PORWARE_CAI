import React, { useState, useEffect } from 'react';
import { UserPlus, Search, X, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Usuario, Role } from '../types';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'EMPLEADO' as Role,
  });

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getUsers({ search, rol: rolFilter || undefined });
      setUsers(res.data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al cargar el directorio de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, rolFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cedula || !form.nombre || !form.apellido || !form.email) return;

    setErrorMsg(null);
    try {
      await api.createUser(form);
      setIsModalOpen(false);
      setForm({ cedula: '', nombre: '', apellido: '', email: '', password: '', rol: 'EMPLEADO' });
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al registrar nuevo usuario.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Directorio de Personal & Usuarios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Gestión de empleados, administradores y operadores de garita con roles del sistema.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            color: 'var(--rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="glass-panel filter-bar-responsive" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Buscar por nombre, cédula o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ flex: '1 1 180px', maxWidth: '240px' }}
          value={rolFilter}
          onChange={(e) => setRolFilter(e.target.value)}
        >
          <option value="">Todos los Roles</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="SEGURIDAD">Seguridad (Garita)</option>
          <option value="EMPLEADO">Empleado / Propietario</option>
        </select>
      </div>

      {/* Tabla de Usuarios */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Usuario / Empleado
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Cédula
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Rol
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Correo Electrónico
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, textAlign: 'center' }}>
                Invitaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {u.nombre[0]}
                        {u.apellido[0]}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {u.nombre} {u.apellido}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>
                    {u.cedula}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span
                      className={`badge ${
                        u.rol === 'ADMINISTRADOR'
                          ? 'badge-admin'
                          : u.rol === 'SEGURIDAD'
                            ? 'badge-seguridad'
                            : 'badge-empleado'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                    {u._count?.invitaciones || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Usuario */}
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Registrar Nuevo Usuario
              </h3>
              <button type="button" className="btn-ghost" style={{ padding: '6px' }} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: V-25123456"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="nombre@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Rol en el Sistema
                </label>
                <select
                  className="form-input"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}
                >
                  <option value="EMPLEADO">Propietario / Empleado (Cartelera y sus propios invitados)</option>
                  <option value="SEGURIDAD">Vigilante / Seguridad (Escáner Garita y personas dentro)</option>
                  <option value="ADMINISTRADOR">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  <span>Crear Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
