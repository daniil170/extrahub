import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Wrench,
  Shield,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { switchDemoRoleAndSignIn } from './api.js';

const ROLES = [
  { id: 'student', label: 'Ученик', route: '/student', icon: GraduationCap },
  { id: 'parent', label: 'Родитель', route: '/parent', icon: Users },
  { id: 'teacher', label: 'Учитель', route: '/teacher', icon: BookOpen },
  { id: 'coordinator', label: 'Координатор', route: '/coordinator', icon: ClipboardList },
  { id: 'technician', label: 'Техник', route: '/technician', icon: Wrench },
  { id: 'admin', label: 'Админ', route: '/coordinator', icon: Shield },
];

export function DemoRoleSwitcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(null);
  const [switchError, setSwitchError] = useState(null);

  // Strictly render ONLY if caller has isDemoMaster claim
  if (!user || !user.isDemoMaster) {
    return null;
  }

  const currentRole = user.role;
  const isMasterUser = user.email?.toLowerCase() === 'daniilivakin30@gmail.com';

  const targetRoleObj = ROLES.find((r) => r.id === switchingRole);
  const targetRoleLabel =
    switchingRole === 'master'
      ? 'Мастер-аккаунт'
      : (targetRoleObj?.label || switchingRole);
  const TargetRoleIcon = targetRoleObj?.icon || Sparkles;

  const handleSwitch = async (targetRole, targetRoute) => {
    if (switchingRole) return;
    try {
      setSwitchingRole(targetRole);
      setSwitchError(null);
      await switchDemoRoleAndSignIn(targetRole);
      const isInvitePage = window.location.pathname.startsWith('/invite');
      if (targetRoute && !isInvitePage) {
        navigate(targetRoute);
      }
    } catch (err) {
      console.error('Demo role switch error:', err);
      setSwitchError(err.message || 'Ошибка переключения роли');
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <>
      {/* Full-screen Loading Overlay during Role Switch */}
      {switchingRole && (
        <div
          role="alert"
          aria-live="assertive"
          aria-busy="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              padding: '36px 32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            {/* Animated Icon Avatar */}
            <div
              style={{
                position: 'relative',
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TargetRoleIcon size={32} />
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--primary)',
                  animation: 'demoSwitcherSpin 0.9s linear infinite',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Смена демо-роли...
              </h3>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  margin: '4px auto 0',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} color="var(--primary)" />
                <span>
                  Вход как: <strong>{targetRoleLabel}</strong>
                </span>
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: '8px 0 0 0',
                  lineHeight: 1.5,
                }}
              >
                Синхронизация токена, применение прав доступа и переход в личный кабинет...
              </p>
            </div>

            {/* Pulsing loading track */}
            <div
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-subtle)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '50%',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '999px',
                  animation: 'demoSwitcherProgress 1.4s ease-in-out infinite alternate',
                }}
              />
            </div>

            <style>{`
              @keyframes demoSwitcherSpin {
                to { transform: rotate(360deg); }
              }
              @keyframes demoSwitcherProgress {
                0% { left: 0%; width: 30%; }
                100% { left: 70%; width: 30%; }
              }
            `}</style>
          </div>
        </div>
      )}

      <aside
      aria-label="Панель переключения демо-ролей"
      style={{
        position: 'fixed',
        bottom: '18px',
        right: '18px',
        zIndex: 9999,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.22)',
        border: '2px solid var(--primary)',
        width: isOpen ? '340px' : 'auto',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      {/* Switcher Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          cursor: 'pointer',
          userSelect: 'none',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#fbbf24" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
            ДЕМО-МАСТЕР
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(255,255,255,0.22)',
              padding: '2px 7px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            {isMasterUser ? 'Владелец' : currentRole.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </div>

      {/* Switcher Body */}
      {isOpen && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Мгновенное переключение роли:</span>
            {switchingRole && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                <Loader2 size={13} className="spin" /> Переключение...
              </span>
            )}
          </div>

          {switchError && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-light)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--danger)',
              }}
            >
              {switchError}
            </div>
          )}

          {/* Role Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id && !isMasterUser;
              const isLoadingThis = switchingRole === r.id;

              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={Boolean(switchingRole)}
                  onClick={() => handleSwitch(r.id, r.route)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: switchingRole ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    textAlign: 'left',
                  }}
                >
                  {isLoadingThis ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <Icon size={14} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Return to Master Account Button */}
          <button
            type="button"
            disabled={Boolean(switchingRole) || isMasterUser}
            onClick={() => handleSwitch('master', '/coordinator')}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: isMasterUser ? 'var(--bg-subtle)' : 'var(--bg-primary)',
              color: isMasterUser ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: isMasterUser || switchingRole ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {switchingRole === 'master' ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <RotateCcw size={14} />
            )}
            <span>
              {isMasterUser ? 'Вы в мастер-аккаунте' : 'Вернуться в мастер-аккаунт'}
            </span>
          </button>
        </div>
      )}
    </aside>
  </>
);
}
