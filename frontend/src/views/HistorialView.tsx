import React, { useState, useEffect } from 'react';
import { Search, Download, LogIn, LogOut } from 'lucide-react';
import { api } from '../services/api';
import type { HistorialRegistro } from '../types';


export const HistorialView: React.FC = () => {
  const [registros, setRegistros] = useState<HistorialRegistro[]>([]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const res = await api.getHistorial({
        tipo: tipoFilter || undefined,
        search: search || undefined,
      });
      setRegistros(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorial();
  }, [tipoFilter, search]);

  // Exportar a CSV
  const handleExportCSV = async () => {
    try {
      await api.downloadHistorialCsv({
        tipo: tipoFilter || undefined,
        search: search || undefined,
      });
    } catch (err: any) {
      if (registros.length === 0) return;
      const headers = ['ID', 'Fecha y Hora', 'Tipo', 'Nombre', 'Apellido', 'Cédula', 'Tipo Persona', 'Observación'];
      const rows = registros.map((r) => {
        const p = r.usuario || r.invitado;
        return [
          r.id,
          new Date(r.timestamp).toLocaleString('es-ES'),
          r.tipo,
          p?.nombre || '',
          p?.apellido || '',
          p?.cedula || '',
          r.invitado ? 'Visitante' : 'Personal',
          `"${(r.observacion || '').replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `bitacora_cai_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className="animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

      {/* Barra de Filtros */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
          style={{ width: '200px' }}
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">Todos los Movimientos</option>
          <option value="ENTRADA">Solo Entradas</option>
          <option value="SALIDA">Solo Salidas</option>
        </select>
      </div>

      {/* Tabla de Bitácora */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
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
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Consultando registros de auditoría...
                </td>
              </tr>
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
