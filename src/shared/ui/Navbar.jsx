import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';
import { NotificationCenter } from '../../features/notifications/index.js';
import { useTheme } from '../hooks/index.js';
import { IconChevronDown, IconLogout, IconUser } from './Icons.jsx';

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

const ROLE_LABELS = {
  student: 'Ученик',
  parent: 'Родитель',
  teacher: 'Преподаватель',
  coordinator: 'Координатор',
  technician: 'Техник',
  admin: 'Администратор',
};

const AVAILABLE_ROLES = [
  { role: 'student', label: 'Ученик' },
  { role: 'parent', label: 'Родитель' },
  { role: 'teacher', label: 'Преподаватель' },
  { role: 'coordinator', label: 'Координатор' },
  { role: 'technician', label: 'Техник' },
  { role: 'admin', label: 'Администратор' },
];

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
        width: '32px',
        height: '32px',
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
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function getInitials(fullName = '') {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Modern compact navigation bar
 * @param {Object} props
 * @param {import('../../entities/user/model.js').User|null} props.currentUser
 * @param {(role: string) => void} props.onSwitchRole
 * @param {() => void} props.onLogout
 */
export function Navbar({ currentUser, onSwitchRole, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkStyle = ({ isActive }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    height: '56px',
    padding: '0 4px',
    margin: '0 10px',
    fontSize: '13.5px',
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
    padding: '10px 14px',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
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
    setProfileDropdownOpen(false);
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
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand logo & Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <NavLink
            to={currentUser?.role === 'technician' ? '/technician' : '/catalog'}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <img
              src={isDark ? logoDarkImg : logoImg}
              alt="ExtraHub"
              style={{ width: '26px', height: '26px', objectFit: 'contain' }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '17px',
                color: 'var(--primary)',
                letterSpacing: '-0.3px',
              }}
            >
              ExtraHub
            </span>
          </NavLink>

          <nav className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center' }}>
            {currentUser?.role === 'technician' ? (
              <NavLink to="/technician" style={navLinkStyle}>
                Заявки на ремонт
              </NavLink>
            ) : (
              <>
                <NavLink to="/catalog" style={navLinkStyle}>
                  Каталог
                </NavLink>

                {currentUser && userCabinet && (
                  <NavLink to={userCabinet.to} style={navLinkStyle}>
                    {userCabinet.label}
                  </NavLink>
                )}

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

        {/* Right: Controls & Compact Profile */}
        <div className="nav-desktop-user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />

          {currentUser ? (
            <>
              <NotificationCenter currentUser={currentUser} />

              {/* Compact User Menu Button */}
              <div style={{ position: 'relative' }} ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px 4px 6px',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: profileDropdownOpen ? 'var(--bg-subtle)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => {
                    if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-expanded={profileDropdownOpen}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getInitials(currentUser.fullName)}
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      maxWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser.fullName}
                  </span>

                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>

                  <IconChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Dropdown Popover */}
                {profileDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '240px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                      border: '1px solid var(--border-color)',
                      padding: '8px 0',
                      zIndex: 100,
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    {/* User info */}
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentUser.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {currentUser.email}
                      </div>
                    </div>

                    {/* Role switcher list */}
                    <div style={{ padding: '6px 14px' }}>
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        Демонстрационная роль:
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {AVAILABLE_ROLES.map((r) => {
                          const isSelected = currentUser.role === r.role;
                          return (
                            <button
                              key={r.role}
                              type="button"
                              onClick={() => handleRoleChange(r.role)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                                color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.1s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span>{r.label}</span>
                              {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Logout */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--danger)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <IconLogout size={14} />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <NavLink
              to="/login"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Войти
            </NavLink>
          )}
        </div>

        {/* Mobile Actions: Theme + Bell + Hamburger */}
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

      {/* Mobile Drawer */}
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
          {currentUser && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.fullName}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Сменить роль:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleRoleChange(r.role)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {r.label}
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
                Заявки на ремонт
              </NavLink>
            ) : (
              <>
                <NavLink to="/catalog" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                  Каталог кружков
                </NavLink>

                {currentUser && userCabinet && (
                  <NavLink to={userCabinet.to} style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                    {userCabinet.label}
                  </NavLink>
                )}

                {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <NavLink
                    to={currentUser.role === 'teacher' ? '/teacher/equipment' : '/technician'}
                    style={mobileNavLinkStyle}
                    onClick={handleMobileNavClick}
                  >
                    Заявки на ремонт
                  </NavLink>
                )}

                <NavLink to="/about" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                  О платформе и команде
                </NavLink>
              </>
            )}
          </nav>

          {/* Bottom Action */}
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--danger)',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Выйти из аккаунта
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={handleMobileNavClick}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
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
