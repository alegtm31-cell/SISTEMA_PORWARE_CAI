import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { GaritaView } from './views/GaritaView';
import { UsersView } from './views/UsersView';
import { InvitadosView } from './views/InvitadosView';
import { HistorialView } from './views/HistorialView';
import { NoticiasView } from './views/NoticiasView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { MobileNav } from './components/MobileNav';
import { CarteleraWelcomeModal } from './components/CarteleraWelcomeModal';
import { OfflineBanner } from './components/OfflineBanner';
import { api } from './services/api';
import type { Usuario, Noticia } from './types';
import { useTheme } from './hooks/useTheme';

export const App: React.FC = () => {
  const { themeMode, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('garita');
  const [user, setUser] = useState<Usuario | null>(null);
  const [isCarteleraWelcomeOpen, setIsCarteleraWelcomeOpen] = useState(false);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Verificar si hay usuario con sesión activa en el cliente
    const savedUser = api.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      if (savedUser.rol === 'ADMINISTRADOR' || savedUser.rol === 'SEGURIDAD') {
        setActiveTab('garita');
      } else {
        setActiveTab('invitados');
      }

      // Cargar cartelera informativa de bienvenida para usuarios autenticados
      api.getNoticias().then((items) => {
        setNoticias(items);
        const hideDate = localStorage.getItem('cai_hide_cartelera_date');
        const today = new Date().toISOString().slice(0, 10);
        if (hideDate !== today) {
          setIsCarteleraWelcomeOpen(true);
        }
      });
    } else {
      setUser(null);
    }
    setIsCheckingSession(false);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleLoginSuccess = (newUser: Usuario) => {
    setUser(newUser);
    if (newUser.rol === 'EMPLEADO') {
      setActiveTab('invitados');
    } else {
      setActiveTab('garita');
    }
    // Cargar noticias y mostrar bienvenida
    api.getNoticias().then((items) => {
      setNoticias(items);
      setIsCarteleraWelcomeOpen(true);
    });
  };

  // Pantalla de carga mientras se verifica el token JWT inicial
  if (isCheckingSession) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-dark)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="live-pulse" style={{ width: '10px', height: '10px' }} />
          <span>Iniciando sistema CAI...</span>
        </div>
      </div>
    );
  }

  // SI NO HAY SESIÓN ACTIVA: Mostrar pantalla completa de inicio de sesión (no modal emergente)
  if (!user) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  // SESIÓN ACTIVA: Renderizar panel de control con navegación por secciones
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-dark)' }}>
      {/* Alerta de conexión / Banner Offline */}
      <OfflineBanner />

      {/* Navbar Superior */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setUser(null)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Cuerpo Principal con Sidebar (Desktop) y Área de Trabajo */}
      <div style={{ display: 'flex', flex: 1, width: '100%', minWidth: 0 }}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={user?.rol || 'ADMINISTRADOR'}
        />

        <main className="app-main-content">
          {activeTab === 'garita' && <GaritaView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'invitados' && <InvitadosView currentUser={user} />}
          {activeTab === 'historial' && <HistorialView />}
          {activeTab === 'noticias' && <NoticiasView userRole={user?.rol} />}
          {activeTab === 'settings' && (
            <SettingsView
              themeMode={themeMode}
              resolvedTheme={resolvedTheme}
              onSetTheme={setTheme}
              user={user}
              onLogout={handleLogout}
              onOpenCartelera={() => setActiveTab('noticias')}
            />
          )}
        </main>
      </div>

      {/* Barra de Navegación Inferior para Móviles */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={user?.rol || 'ADMINISTRADOR'}
      />

      {/* Modal de Cartelera Informativa de Bienvenida (informativo, descartable) */}
      <CarteleraWelcomeModal
        isOpen={isCarteleraWelcomeOpen}
        onClose={() => setIsCarteleraWelcomeOpen(false)}
        noticias={noticias}
      />
    </div>
  );
};

export default App;
