import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('cai_offline_banner_hidden') === 'true';
  });

  const verifyConnection = async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return;
    }
    const isHealthy = await api.checkHealth();
    setIsOffline(!isHealthy);
  };

  const handleRetry = async () => {
    setRetrying(true);
    localStorage.removeItem('cai_offline_banner_hidden');
    setDismissed(false);
    await verifyConnection();
    setTimeout(() => setRetrying(false), 600);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('cai_offline_banner_hidden', 'true');
  };

  useEffect(() => {
    // Verificación inicial diferida para no parpadear al cargar
    const timeout = setTimeout(verifyConnection, 1500);

    const onOnline = () => verifyConnection();
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Verificación periódica cada 30 segundos
    const interval = setInterval(verifyConnection, 30000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
        color: '#ffffff',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.78rem',
        fontWeight: 600,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        zIndex: 40,
        borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WifiOff size={16} style={{ flexShrink: 0, color: '#fca5a5' }} />
        <span>
          <strong>Modo Local Autónomo:</strong> Servidor PostgreSQL en espera. Pases QR, escaneo y operaciones locales disponibles.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '3px 10px',
            cursor: retrying ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          <RefreshCw size={12} className={retrying ? 'spin' : ''} />
          <span>{retrying ? 'Verificando...' : 'Reconectar'}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
          title="Ocultar este aviso"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
};
