import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';
import { NotificationCenter } from '../../features/notifications/index.js';
import { useTheme } from '../hooks/index.js';

/**
 * Role to personal cabinet link mapping
 */
const ROLE_CABINETS = {
  student: { to: '/student', label: 'Мой кабинет' },
  parent: { to: '/parent', label: 'Кабинет родителя' },
  teacher: { to: '/teacher', label: 'Кабинет преподавателя' },
  coordinator: { to: '/coordinator', label: 'Панель координатора' },
  admin: { to: '/coordinator', label: 'Панель администратора' },
  technician: { to: '/technician', label: 'Заявки на ремонт' },
};

function ThemeToggleButton({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        padding: 0,
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
      {isDark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/**
 * @param {Object} props
 * @param {import('../../entities/user/model.js').User|null} props.currentUser
 * @param {(role: string) => void} props.onSwitchRole
 * @param {() => void} props.onLogout
 */
export function Navbar({ currentUser, onSwitchRole, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();

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

  const mobileNavLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    fontSize: '15px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
  });

  const userCabinet = currentUser?.role ? ROLE_CABINETS[currentUser.role] : null;

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleRoleChange = (newRole) => {
    onSwitchRole(newRole);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 16px',
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
        {/* Brand logo and desktop navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NavLink
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img
              src={isDark ? logoDarkImg : logoImg}
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

          <nav className="nav-desktop-links">
            {currentUser?.role === 'technician' ? (
              <NavLink to="/technician" style={navLinkStyle}>
                Заявки на ремонт
              </NavLink>
            ) : (
              <>
                <NavLink to="/catalog" style={navLinkStyle}>
                  Каталог
                </NavLink>

                {/* Dynamic cabinet link only visible for authorized users */}
                {currentUser && userCabinet && (
                  <NavLink to={userCabinet.to} style={navLinkStyle}>
                    {userCabinet.label}
                  </NavLink>
                )}

                {/* Equipment maintenance access for teacher and admin */}
                {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <NavLink
                    to={currentUser.role === 'teacher' ? '/teacher/equipment' : '/technician'}
                    style={navLinkStyle}
                  >
                    Заявки на ремонт
                  </NavLink>
                )}

                <NavLink to="/about" style={navLinkStyle}>
                  О платформе
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Desktop user profile & role switcher */}
        <div className="nav-desktop-user">
          {/* Theme switcher on desktop (always available) */}
          <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />

          {currentUser ? (
            <>
              {/* Notification Center */}
              <NotificationCenter currentUser={currentUser} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Роль:{' '}
                  <b>
                    {currentUser.role === 'admin'
                      ? 'Администратор ⚙️'
                      : currentUser.role === 'coordinator'
                        ? 'Координатор 📋'
                        : currentUser.role === 'technician'
                          ? 'Техник 🛠️'
                          : currentUser.role === 'teacher'
                            ? 'Преподаватель 👨‍🏫'
                            : currentUser.role === 'parent'
                              ? 'Родитель 👨‍👩‍👦'
                              : 'Ученик 🎓'}
                  </b>
                </div>
              </div>

              {/* Dev role switcher */}
              <select
                value={currentUser.role}
                onChange={(e) => onSwitchRole(e.target.value)}
                style={{
                  padding: '6px 10px',
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
                <option value="technician">Техник / Завхоз</option>
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
            </>
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

        {/* Mobile Actions: Theme Toggle + Notification Bell + Hamburger */}
        <div className="nav-mobile-actions">
          <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
          {currentUser && <NotificationCenter currentUser={currentUser} />}

          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Slide-down Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            padding: '16px 8px 24px',
            animation: 'fadeIn 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* User Profile Card on mobile */}
          {currentUser && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  👤 {currentUser.fullName}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {currentUser.role}
                </span>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  Переключить демонстрационную роль:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}
                >
                  {[
                    { role: 'student', label: 'Ученик', icon: '🎓' },
                    { role: 'parent', label: 'Родитель', icon: '👨‍👩‍👦' },
                    { role: 'teacher', label: 'Преподаватель', icon: '👨‍🏫' },
                    { role: 'coordinator', label: 'Координатор', icon: '📋' },
                    { role: 'technician', label: 'Техник', icon: '🛠️' },
                    { role: 'admin', label: 'Администратор', icon: '⚙️' },
                  ].map((r) => {
                    const isSelected = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleRoleChange(r.role)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? '2px solid var(--primary)'
                            : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 4px rgba(30, 58, 95, 0.2)' : 'none',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '15px' }}>{r.icon}</span>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.label}
                        </span>
                        {isSelected && <span style={{ fontSize: '12px', fontWeight: 800 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {currentUser?.role === 'technician' ? (
              <NavLink to="/technician" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                🛠️ Заявки на ремонт
              </NavLink>
            ) : (
              <>
                <NavLink to="/catalog" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                  📚 Каталог кружков
                </NavLink>

                {currentUser && userCabinet && (
                  <NavLink to={userCabinet.to} style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                    🏛️ {userCabinet.label}
                  </NavLink>
                )}

                {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <NavLink
                    to={currentUser.role === 'teacher' ? '/teacher/equipment' : '/technician'}
                    style={mobileNavLinkStyle}
                    onClick={handleMobileNavClick}
                  >
                    🛠️ Заявки на ремонт
                  </NavLink>
                )}

                <NavLink to="/about" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                  ℹ️ О платформе и команде
                </NavLink>
              </>
            )}
          </nav>

          {/* Bottom Action (Login / Logout) */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                🚪 Выйти из аккаунта
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={handleMobileNavClick}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Войти в систему
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
