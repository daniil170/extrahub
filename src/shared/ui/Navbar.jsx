import { NavLink } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {import('../../entities/user/model.js').User|null} props.currentUser
 * @param {(role: string) => void} props.onSwitchRole
 * @param {() => void} props.onLogout
 */
export function Navbar({ currentUser, onSwitchRole, onLogout }) {
  const navItemStyle = ({ isActive }) => ({
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <NavLink
            to="/catalog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--primary)',
            }}
          >
            <span>🎯</span>
            <span>ExtraHub</span>
          </NavLink>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NavLink to="/catalog" style={navItemStyle}>
              Каталог
            </NavLink>
            <NavLink to="/student" style={navItemStyle}>
              Ученик
            </NavLink>
            <NavLink to="/parent" style={navItemStyle}>
              Родитель
            </NavLink>
            <NavLink to="/teacher" style={navItemStyle}>
              Учитель
            </NavLink>
            <NavLink to="/coordinator" style={navItemStyle}>
              Координатор
            </NavLink>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Роль: <b>{currentUser.role}</b>
                </div>
              </div>
              <select
                value={currentUser.role}
                onChange={(e) => onSwitchRole(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
                aria-label="Сменить тестовую роль"
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
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
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
