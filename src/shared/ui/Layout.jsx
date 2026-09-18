import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { CookieConsentBanner } from './CookieConsentBanner.jsx';
import { IntroAnimation } from './IntroAnimation.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { DemoRoleSwitcher } from '../../features/auth/DemoRoleSwitcher.jsx';

export function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleIntroComplete = () => {
    // Redirect unauthenticated visitors to registration page upon intro completion
    if (!user && !loading && location.pathname !== '/register') {
      navigate('/register');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <IntroAnimation onComplete={handleIntroComplete} />
      <Navbar currentUser={user} loading={loading} onLogout={logout} />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
      <CookieConsentBanner />
      <DemoRoleSwitcher />
    </div>
  );
}
