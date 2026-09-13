import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { IntroAnimation } from './IntroAnimation.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <IntroAnimation />
      <Navbar currentUser={user} onLogout={logout} />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
