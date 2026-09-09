import { useState, useRef, useEffect } from 'react';
import { useNotifications } from './useNotifications.js';

/**
 * Format timestamp into human-readable Russian relative/friendly format
 */
function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'только что';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
  if (diffSec < 172800) return 'вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/**
 * Type-to-icon mapping for notifications
 */
const TYPE_ICONS = {
  hold_expiry: { icon: '⏱️', bg: 'var(--accent-coral-light)', border: 'var(--accent-coral)' },
  waitlist_promotion: { icon: '🎉', bg: 'var(--primary-light)', border: 'var(--primary)' },
  parent_approval: { icon: '👨‍👩‍👦', bg: 'var(--primary-light)', border: 'var(--primary)' },
  invoice_created: { icon: '💳', bg: 'var(--warning-light)', border: 'var(--warning)' },
  payment_confirmed: { icon: '✅', bg: 'var(--success-light)', border: 'var(--success)' },
  attendance_alert: { icon: '📋', bg: 'var(--primary-light)', border: 'var(--primary)' },
  capacity_alert: { icon: '⚠️', bg: 'var(--danger-light)', border: 'var(--danger)' },
  offline_payment: { icon: '💵', bg: 'var(--success-light)', border: 'var(--success)' },
  student_enrolled: { icon: '🎒', bg: 'var(--primary-light)', border: 'var(--primary)' },
  attendance_journal: { icon: '📝', bg: 'var(--primary-light)', border: 'var(--primary)' },
  catalog_new: { icon: '✨', bg: 'var(--primary-light)', border: 'var(--primary)' },
  system_notice: { icon: '📢', bg: 'var(--bg-subtle)', border: 'var(--border-color)' },
};

export function NotificationCenter({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications(currentUser);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button with Badge */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Уведомления (${unreadCount} непрочитанных)`}
        aria-expanded={isOpen}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          backgroundColor: isOpen ? 'var(--bg-subtle)' : 'var(--bg-surface)',
          cursor: 'pointer',
          fontSize: '17px',
          color: 'var(--text-primary)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
        }}
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg-surface)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="region"
          aria-label="Центр уведомлений"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                Уведомления
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} нов.
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Отметить все
              </button>
            )}
          </div>

          {/* List or Empty State */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {loading ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '13px' }}>Загрузка уведомлений...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Нет новых уведомлений
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    maxWidth: '240px',
                    lineHeight: 1.4,
                  }}
                >
                  Все важные события по расписанию, оплатам и бронированию появятся здесь.
                </div>
              </div>
            ) : (
              notifications.map((item) => {
                const conf = TYPE_ICONS[item.type] || TYPE_ICONS.system_notice;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) markAsRead(item.id);
                    }}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: item.isRead ? '#ffffff' : 'rgba(30, 58, 95, 0.04)',
                      cursor: item.isRead ? 'default' : 'pointer',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!item.isRead) e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (!item.isRead) e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.04)';
                    }}
                  >
                    {/* Icon Badge */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: conf.bg,
                        border: `1px solid ${conf.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                      }}
                    >
                      {conf.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: item.isRead ? 600 : 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </span>

                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatTimeAgo(item.sentAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          margin: 0,
                        }}
                      >
                        {item.text}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                        title="Не прочитано"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
            }}
          >
            Интерактивный центр школьных оповещений ExtraHub
          </div>
        </div>
      )}
    </div>
  );
}
