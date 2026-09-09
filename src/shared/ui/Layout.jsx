import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function Layout() {
  const { user, switchDevRole, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentUser={user} onSwitchRole={switchDevRole} onLogout={logout} />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
