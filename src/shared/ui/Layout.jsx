import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function Layout() {
  const { user, switchDevRole, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentUser={user} onSwitchRole={switchDevRole} onLogout={logout} />
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        <Outlet />
      </main>
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        ExtraHub — Платформа управления внеучебной деятельностью школы
      </footer>
    </div>
  );
}
