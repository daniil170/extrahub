import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Server,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';
import { NotificationCenter } from '../../features/notifications/index.js';
import { useTheme } from '../hooks/index.js';
import { CoinIcon } from './CoinIcon.jsx';
import { schoolConfig } from '../../app/config/schoolConfig.js';

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
      {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
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
 * @param {boolean} [props.loading]
 * @param {() => void} props.onLogout
 */
export function Navbar({ currentUser, loading = false, onLogout }) {
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
    height: '52px',
    padding: '0 4px',
    margin: '0 8px',
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
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
  });

  const userCabinet = currentUser?.role ? ROLE_CABINETS[currentUser.role] : null;

  const handleMobileNavClick = () => {
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
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand logo, Co-Branding & Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <NavLink
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            title={`О платформе ExtraHub × ${schoolConfig.name}`}
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
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '16px',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Extra<span style={{ color: 'var(--primary)' }}>Hub</span>
            </span>

            {/* Modern SaaS-style vertical separator */}
            <span
              style={{
                display: 'inline-block',
                width: '1px',
                height: '18px',
                backgroundColor: 'var(--border-color)',
                margin: '0 4px',
                opacity: 0.8,
              }}
              aria-hidden="true"
            />

            {/* Co-Branding Partner Logo & Label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {schoolConfig.logoUrl && (
                <img
                  src={schoolConfig.logoUrl}
                  alt={schoolConfig.name}
                  style={{
                    width: '22px',
                    height: '22px',
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {schoolConfig.name}
              </span>
            </div>
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

                {currentUser && (currentUser.role === 'student' || currentUser.role === 'admin') && (
                  <>
                    <NavLink to="/student/shop" style={navLinkStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        Магазин <CoinIcon size={18} />
                      </span>
                    </NavLink>
                    <NavLink to="/student/profile" style={navLinkStyle}>
                      Профиль
                    </NavLink>
                  </>
                )}

                {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <>
                    {/* Visual separator isolating equipment maintenance */}
                    <span
                      style={{
                        display: 'inline-block',
                        width: '1px',
                        height: '18px',
                        backgroundColor: 'var(--border-color)',
                        margin: '0 6px',
                        opacity: 0.8,
                      }}
                      aria-hidden="true"
                    />
                    <NavLink
                      to={currentUser.role === 'teacher' ? '/teacher/equipment' : '/technician'}
                      style={(args) => ({
                        ...navLinkStyle(args),
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      })}
                    >
                      <span>Заявки на ремонт</span>
                      {!schoolConfig.equipmentModuleEnabled && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            lineHeight: 1.2,
                          }}
                        >
                          Скоро
                        </span>
                      )}
                    </NavLink>
                  </>
                )}
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
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(currentUser.fullName)}
                  </div>

                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 500,
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
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>

                  <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Dropdown Popover */}
                {profileDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      width: '230px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border-color)',
                      padding: '6px 0',
                      zIndex: 100,
                      animation: 'fadeIn 0.12s ease',
                    }}
                  >
                    {/* User info */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentUser.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {currentUser.email}
                      </div>
                    </div>

                    {/* Cabinet shortcut */}
                    {userCabinet && (
                      <div style={{ padding: '6px 8px 2px' }}>
                        <NavLink
                          to={userCabinet.to}
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <span>{userCabinet.label}</span>
                          <span style={{ fontSize: '11px', opacity: 0.8 }}>→</span>
                        </NavLink>
                      </div>
                    )}

                    {(currentUser.role === 'student' || currentUser.role === 'admin') && (
                      <div style={{ padding: '2px 8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <NavLink
                          to="/student/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                        >
                          <span>Мой профиль и витрина</span>
                        </NavLink>
                        <NavLink
                          to="/student/shop"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <CoinIcon size={18} /> Магазин кастомизации
                          </span>
                        </NavLink>
                      </div>
                    )}

                    {/* Master System Monitoring shortcut */}
                    {(currentUser.email === 'daniilivakin30@gmail.com' || currentUser.isDemoMaster) && (
                      <div style={{ padding: '0 8px 6px' }}>
                        <NavLink
                          to="/system-monitor"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'rgba(234, 179, 8, 0.12)',
                            color: '#d97706',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <Server size={14} />
                          <span>Системный мониторинг</span>
                        </NavLink>
                      </div>
                    )}

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
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--danger)',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <LogOut size={13} />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : loading ? (
            <div
              aria-label="Загрузка профиля..."
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                height: '32px',
              }}
            >
              <div
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)',
                  borderTopColor: 'var(--primary)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavLink
                to="/login"
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Регистрация
              </NavLink>
            </div>
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
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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
          {currentUser ? (
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
            </div>
          ) : loading ? (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '12.5px',
              }}
            >
              <div
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)',
                  borderTopColor: 'var(--primary)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Загрузка профиля...</span>
            </div>
          ) : null}

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

                {currentUser && (currentUser.role === 'student' || currentUser.role === 'admin') && (
                  <>
                    <NavLink to="/student/profile" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                      Мой профиль и витрина
                    </NavLink>
                    <NavLink to="/student/shop" style={mobileNavLinkStyle} onClick={handleMobileNavClick}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <CoinIcon size={20} /> Магазин кастомизации
                      </span>
                    </NavLink>
                  </>
                )}

                {currentUser && (currentUser.email === 'daniilivakin30@gmail.com' || currentUser.isDemoMaster) && (
                  <NavLink
                    to="/system-monitor"
                    style={(args) => ({
                      ...mobileNavLinkStyle(args),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#d97706',
                      backgroundColor: args.isActive ? 'rgba(234, 179, 8, 0.16)' : 'rgba(234, 179, 8, 0.08)',
                      fontWeight: 600,
                    })}
                    onClick={handleMobileNavClick}
                  >
                    <Server size={16} />
                    <span>Системный мониторинг</span>
                  </NavLink>
                )}

                {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                    <NavLink
                      to={currentUser.role === 'teacher' ? '/teacher/equipment' : '/technician'}
                      style={(args) => ({
                        ...mobileNavLinkStyle(args),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'var(--text-secondary)',
                      })}
                      onClick={handleMobileNavClick}
                    >
                      <span>Заявки на ремонт</span>
                      {!schoolConfig.equipmentModuleEnabled && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          В разработке
                        </span>
                      )}
                    </NavLink>
                  </div>
                )}
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
            ) : loading ? null : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <NavLink
                  to="/login"
                  onClick={handleMobileNavClick}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Войти в систему
                </NavLink>
                <NavLink
                  to="/register"
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
                  Регистрация ученика
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
