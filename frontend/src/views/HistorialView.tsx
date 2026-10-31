import React, { useState, useEffect } from 'react';
import { Search, Download, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import type { HistorialRegistro } from '../types';

export const HistorialView: React.FC = () => {
  const [registros, setRegistros] = useState<HistorialRegistro[]>([]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHistorial = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getHistorial({
        tipo: tipoFilter || undefined,
        search: search || undefined,
      });
      setRegistros(res.data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al consultar la bitácora de accesos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorial();
  }, [tipoFilter, search]);

  // Exportar a CSV estrictamente desde el servidor
  const handleExportCSV = async () => {
    setErrorMsg(null);
    try {
      await api.downloadHistorialCsv({
        tipo: tipoFilter || undefined,
        search: search || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo exportar la bitácora CSV desde el servidor.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Bitácora de Auditoría & Accesos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Registro cronológico inmutable de entradas y salidas de garitas con observaciones de seguridad.
          </p>
        </div>

        <button className="btn-ghost" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} />
          <span>Exportar CSV</span>
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
            placeholder="Filtrar por cédula, nombre, empresa u observación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ flex: '1 1 180px', maxWidth: '240px' }}
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">Todos los Movimientos</option>
          <option value="ENTRADA">Solo Entradas</option>
          <option value="SALIDA">Solo Salidas</option>
        </select>
      </div>

      {/* Tabla de Bitácora */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Movimiento
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Fecha / Hora
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Persona Identificada
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Cédula
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Observación / Nota Garita
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-hist-${idx}`}>
                  <td colSpan={5} style={{ padding: '16px 20px' }}>
                    <Skeleton height="1.4rem" borderRadius="6px" />
                  </td>
                </tr>
              ))
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No se encontraron registros para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              registros.map((reg) => {
                const p = reg.usuario || reg.invitado;
                const isEntrada = reg.tipo === 'ENTRADA';

                return (
                  <tr
                    key={reg.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-table-row-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${isEntrada ? 'badge-entrada' : 'badge-salida'}`}>
                        {isEntrada ? <LogIn size={13} /> : <LogOut size={13} />}
                        {reg.tipo}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '0.84rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(reg.timestamp).toLocaleString('es-ES')}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {p?.nombre} {p?.apellido}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {reg.invitado ? `Visitante • ${reg.invitado.empresa || 'Particular'}` : `Personal • ${reg.usuario?.rol}`}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>
                      {p?.cedula}
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '0.86rem', color: reg.observacion ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                      {reg.observacion || <span style={{ fontStyle: 'italic' }}>Sin observación</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
