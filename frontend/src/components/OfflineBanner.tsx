import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [retrying, setRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
    await verifyConnection();
    setTimeout(() => setRetrying(false), 600);
  };

  useEffect(() => {
    const onOnline = () => verifyConnection();
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Verificación periódica cada 20 segundos
    const interval = setInterval(verifyConnection, 20000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="alert"
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(90deg, #991b1b 0%, #b91c1c 100%)',
        color: '#ffffff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.82rem',
        fontWeight: 600,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WifiOff size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Modo Sin Conexión:</strong> Sin enlace con el servidor de garita. Los pases digitales firmados y la lectura local de códigos continúan operando.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '4px 12px',
            cursor: retrying ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <RefreshCw size={13} className={retrying ? 'spin' : ''} />
          <span>{retrying ? 'Verificando...' : 'Reconectar'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
          title="Ocultar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
