import { useState, useEffect, useCallback } from 'react';
import { Sidebar, ALLOWED_TABS_BY_ROLE, getDefaultTabForRole } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { GaritaView } from './views/GaritaView';
import { HistorialView } from './views/HistorialView';
import { InvitadosView } from './views/InvitadosView';
import { UsersView } from './views/UsersView';
import { NoticiasView } from './views/NoticiasView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { CarteleraWelcomeModal } from './components/CarteleraWelcomeModal';
import { api } from './services/api';
import { useTheme } from './hooks/useTheme';
import type { Usuario, Noticia } from './types';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<Usuario | null>(() => {
    const token = localStorage.getItem('cai_token');
    const saved = localStorage.getItem('cai_user');
    if (!token || !saved) return null;
    try {
      return JSON.parse(saved) as Usuario;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const saved = localStorage.getItem('cai_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Usuario;
        return getDefaultTabForRole(parsed.rol);
      } catch {
        return 'invitados';
      }
    }
    return 'dashboard';
  });

  const [welcomeNoticias, setWelcomeNoticias] = useState<Noticia[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  // Estados para pantalla obligatoria de cambio de clave (debeCambiarClave)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const { themeMode, resolvedTheme, setTheme, cycleTheme } = useTheme();

  const handleLogout = useCallback(async () => {
    await api.logout();
    sessionStorage.removeItem('cai_welcome_shown');
    setShowWelcomeModal(false);
    setUser(null);
  }, []);

  // Escuchar eventos globales de sesión vencida (401) o cambio de clave requerido (403)
  useEffect(() => {
    const onUnauthorized = () => {
      sessionStorage.removeItem('cai_welcome_shown');
      setShowWelcomeModal(false);
      setUser(null);
    };
    const onMustChangePassword = () => {
      setUser((prev) => (prev ? { ...prev, debeCambiarClave: true } : null));
    };

    window.addEventListener('cai:unauthorized', onUnauthorized);
    window.addEventListener('cai:must-change-password', onMustChangePassword);
    return () => {
      window.removeEventListener('cai:unauthorized', onUnauthorized);
      window.removeEventListener('cai:must-change-password', onMustChangePassword);
    };
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    if (!user) return;
    const allowed = ALLOWED_TABS_BY_ROLE[user.rol] || [];
    if (allowed.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab(getDefaultTabForRole(user.rol));
    }
  };

  // Cargar Cartelera al iniciar sesión solo para roles autorizados (ADMINISTRADOR y EMPLEADO)
  useEffect(() => {
    if (!user || user.debeCambiarClave) return;
    if (user.rol !== 'ADMINISTRADOR' && user.rol !== 'EMPLEADO') return;

    const alreadyShown = sessionStorage.getItem('cai_welcome_shown');
    if (!alreadyShown) {
      api
        .getNoticias()
        .then((list) => {
          if (list && list.length > 0) {
            setWelcomeNoticias(list);
            setShowWelcomeModal(true);
            sessionStorage.setItem('cai_welcome_shown', 'true');
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLoginSuccess = (loggedUser: Usuario) => {
    setUser(loggedUser);
    setActiveTab(getDefaultTabForRole(loggedUser.rol));
  };

  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('La confirmación de la nueva contraseña no coincide.');
      return;
    }
    if (newPassword === currentPassword) {
      setPwdError('La nueva contraseña debe ser diferente a la contraseña temporal actual.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setUser(res.user);
      setActiveTab(getDefaultTabForRole(res.user.rol));
    } catch (err: any) {
      setPwdError(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Bloqueo obligatorio si debeCambiarClave es true
  if (user.debeCambiarClave) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '460px',
            padding: '36px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber)',
                marginBottom: '14px',
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Cambio Obligatorio de Contraseña
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              Hola <strong>{user.nombre} {user.apellido}</strong> ({user.cedula}). Por políticas de seguridad institucional, debe actualizar su contraseña inicial antes de acceder al sistema.
            </p>
          </div>

          {pwdError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--rose)',
                fontSize: '0.84rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleMandatoryPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Contraseña Actual / Temporal
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Ingrese su contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Nueva Contraseña (mínimo 6 caracteres)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Nueva contraseña segura"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Repita la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '0.92rem' }}
            >
              <CheckCircle2 size={18} />
              <span>{pwdLoading ? 'Actualizando contraseña...' : 'Guardar Nueva Contraseña y Continuar'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--rose)' }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Enrutado protegido en memoria según rol (Capa 2 de control de acceso)
  const allowedTabs = ALLOWED_TABS_BY_ROLE[user.rol] || ['invitados'];
  const effectiveTab: NavTab = allowedTabs.includes(activeTab) ? activeTab : getDefaultTabForRole(user.rol);

  const renderPermittedView = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return user.rol === 'ADMINISTRADOR' ? <DashboardView onNavigate={handleSelectTab} /> : null;
      case 'garita':
        return user.rol === 'ADMINISTRADOR' || user.rol === 'SEGURIDAD' ? <GaritaView user={user} /> : null;
      case 'historial':
        return user.rol === 'ADMINISTRADOR' ? <HistorialView /> : null;
      case 'invitados':
        return user.rol === 'ADMINISTRADOR' || user.rol === 'EMPLEADO' ? <InvitadosView user={user} /> : null;
      case 'users':
        return user.rol === 'ADMINISTRADOR' ? <UsersView /> : null;
      case 'noticias':
        return user.rol === 'ADMINISTRADOR' || user.rol === 'EMPLEADO' ? <NoticiasView userRole={user.rol} /> : null;
      case 'settings':
        return (
          <SettingsView
            themeMode={themeMode}
            resolvedTheme={resolvedTheme}
            onSetTheme={setTheme}
            user={user}
            onLogout={handleLogout}
            onOpenCartelera={() => {
              if (user.rol === 'ADMINISTRADOR' || user.rol === 'EMPLEADO') {
                api.getNoticias().then((list) => {
                  setWelcomeNoticias(list);
                  setShowWelcomeModal(true);
                });
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar activeTab={effectiveTab} onSelectTab={handleSelectTab} user={user} onLogout={handleLogout} />

      <div className="app-content">
        <Navbar
          activeTab={effectiveTab}
          themeMode={themeMode}
          resolvedTheme={resolvedTheme}
          onToggleTheme={cycleTheme}
        />

        <main className="main-scroll-area">{renderPermittedView()}</main>
      </div>

      <MobileNav activeTab={effectiveTab} onSelectTab={handleSelectTab} userRole={user.rol} />

      {(user.rol === 'ADMINISTRADOR' || user.rol === 'EMPLEADO') && (
        <CarteleraWelcomeModal
          isOpen={showWelcomeModal}
          noticias={welcomeNoticias}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  );
}

export default App;
