import { NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

/**
 * Role to personal cabinet link mapping
 */
const ROLE_CABINETS = {
  student: { to: '/student', label: 'Мой кабинет' },
  parent: { to: '/parent', label: 'Кабинет родителя' },
  teacher: { to: '/teacher', label: 'Кабинет преподавателя' },
  coordinator: { to: '/coordinator', label: 'Панель координатора' },
  admin: { to: '/coordinator', label: 'Панель координатора' },
};

/**
 * @param {Object} props
 * @param {import('../../entities/user/model.js').User|null} props.currentUser
 * @param {(role: string) => void} props.onSwitchRole
 * @param {() => void} props.onLogout
 */
export function Navbar({ currentUser, onSwitchRole, onLogout }) {
  const navLinkStyle = ({ isActive }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    height: '64px',
    padding: '0 4px',
    margin: '0 12px',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    backgroundColor: 'transparent',
    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
    textDecoration: 'none',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  });

  const userCabinet = currentUser?.role ? ROLE_CABINETS[currentUser.role] : null;

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand logo and navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <NavLink
            to="/catalog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img
              src={logoImg}
              alt="ExtraHub Logo"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--primary)',
                letterSpacing: '-0.3px',
              }}
            >
              ExtraHub
            </span>
          </NavLink>

          <nav style={{ display: 'flex', alignItems: 'center' }}>
            <NavLink to="/catalog" style={navLinkStyle}>
              Каталог
            </NavLink>

            {/* Dynamic cabinet link only visible for authorized users */}
            {currentUser && userCabinet && (
              <NavLink to={userCabinet.to} style={navLinkStyle}>
                {userCabinet.label}
              </NavLink>
            )}
          </nav>
        </div>

        {/* User profile or login button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Роль: <b>{currentUser.role}</b>
                </div>
              </div>

              {/* Dev role switcher */}
              <select
                value={currentUser.role}
                onChange={(e) => onSwitchRole(e.target.value)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
                aria-label="Сменить демонстрационную роль"
              >
                <option value="student">Студент</option>
                <option value="parent">Родитель</option>
                <option value="teacher">Преподаватель</option>
                <option value="coordinator">Координатор</option>
                <option value="admin">Администратор</option>
              </select>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              Войти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
