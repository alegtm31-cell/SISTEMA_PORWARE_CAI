import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { GaritaView } from './views/GaritaView';
import { UsersView } from './views/UsersView';
import { InvitadosView } from './views/InvitadosView';
import { HistorialView } from './views/HistorialView';
import { NoticiasView } from './views/NoticiasView';
import { MobileNav } from './components/MobileNav';
import { LoginModal } from './views/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { CarteleraWelcomeModal } from './components/CarteleraWelcomeModal';
import { OfflineBanner } from './components/OfflineBanner';
import { api } from './services/api';
import type { Usuario, Noticia } from './types';
import { useTheme } from './hooks/useTheme';

export const App: React.FC = () => {
  const { themeMode, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('garita');
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCarteleraWelcomeOpen, setIsCarteleraWelcomeOpen] = useState(false);
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    // Cargar noticias y abrir Cartelera informativa al ingresar
    api.getNoticias().then((items) => {
      setNoticias(items);
      const hideDate = localStorage.getItem('cai_hide_cartelera_date');
      const today = new Date().toISOString().slice(0, 10);
      if (hideDate !== today) {
        setIsCarteleraWelcomeOpen(true);
      }
    });

    // Verificar si hay usuario en sesión
    const savedUser = api.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      if (savedUser.rol === 'ADMINISTRADOR' || savedUser.rol === 'SEGURIDAD') {
        setActiveTab('garita');
      } else {
        setActiveTab('invitados');
      }
    } else {
      // Fase 0: Honestidad - Si no hay sesión válida activa, exigir autenticación real
      setUser(null);
      setIsLoginModalOpen(true);
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (newUser: Usuario) => {
    setUser(newUser);
    if (newUser.rol === 'EMPLEADO') {
      setActiveTab('invitados');
    } else {
      setActiveTab('garita');
    }
    // Abrir cartelera al iniciar sesión
    setIsCarteleraWelcomeOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-dark)' }}>
      {/* Alerta de conexión / Banner Offline */}
      <OfflineBanner />

      {/* Navbar Superior */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Cuerpo Principal con Sidebar (Desktop) y Área de Trabajo */}
      <div style={{ display: 'flex', flex: 1, width: '100%', minWidth: 0 }}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={user?.rol || 'ADMINISTRADOR'}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="app-main-content">
          {activeTab === 'garita' && <GaritaView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'invitados' && <InvitadosView currentUser={user} />}
          {activeTab === 'historial' && <HistorialView />}
          {activeTab === 'noticias' && <NoticiasView userRole={user?.rol} />}
        </main>
      </div>

      {/* Barra de Navegación Inferior para Móviles */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={user?.rol || 'ADMINISTRADOR'}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modal de Inicio de Sesión */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Modal de Ajustes y Preferencias (Tema, IP Servidor, Cuenta) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        onSetTheme={setTheme}
        user={user}
        onLogout={handleLogout}
        onOpenCartelera={() => setActiveTab('noticias')}
      />

      {/* Modal de Cartelera Informativa de Bienvenida */}
      <CarteleraWelcomeModal
        isOpen={isCarteleraWelcomeOpen}
        onClose={() => setIsCarteleraWelcomeOpen(false)}
        noticias={noticias}
      />
    </div>
  );
};

export default App;
