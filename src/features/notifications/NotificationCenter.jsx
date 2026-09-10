import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Users,
  CreditCard,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  Banknote,
  GraduationCap,
  FileText,
  Bell,
  Wrench,
  AlertCircle,
} from 'lucide-react';
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
  hold_expiry: { Icon: Clock, color: 'var(--warning)', bg: 'var(--warning-light)', border: 'rgba(217, 119, 6, 0.25)' },
  waitlist_promotion: { Icon: Sparkles, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  parent_approval: { Icon: Users, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  invoice_created: { Icon: CreditCard, color: 'var(--warning)', bg: 'var(--warning-light)', border: 'rgba(217, 119, 6, 0.25)' },
  payment_confirmed: { Icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-light)', border: 'rgba(46, 117, 89, 0.25)' },
  attendance_alert: { Icon: ClipboardList, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  capacity_alert: { Icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-light)', border: 'rgba(219, 68, 85, 0.25)' },
  offline_payment: { Icon: Banknote, color: 'var(--success)', bg: 'var(--success-light)', border: 'rgba(46, 117, 89, 0.25)' },
  student_enrolled: { Icon: GraduationCap, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  attendance_journal: { Icon: FileText, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  catalog_new: { Icon: Sparkles, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  system_notice: { Icon: Bell, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border-color)' },
  equipment_critical: { Icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-light)', border: 'rgba(219, 68, 85, 0.25)' },
  equipment_issue_created: { Icon: Wrench, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(14, 124, 107, 0.25)' },
  equipment_issue_in_progress: { Icon: Wrench, color: 'var(--warning)', bg: 'var(--warning-light)', border: 'rgba(217, 119, 6, 0.25)' },
  equipment_issue_resolved: { Icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-light)', border: 'rgba(46, 117, 89, 0.25)' },
  equipment_issue_cancelled: { Icon: AlertCircle, color: 'var(--text-muted)', bg: 'var(--bg-subtle)', border: 'var(--border-color)' },
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
      {/* Simplified Bell Button with Badge */}
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
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          backgroundColor: isOpen ? 'var(--bg-subtle)' : 'transparent',
          cursor: 'pointer',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              border: '2px solid var(--bg-surface)',
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
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
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
                      backgroundColor: item.isRead ? 'var(--bg-surface)' : 'var(--primary-light)',
                      cursor: item.isRead ? 'default' : 'pointer',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!item.isRead) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!item.isRead) e.currentTarget.style.backgroundColor = 'var(--primary-light)';
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
                        flexShrink: 0,
                      }}
                    >
                      {conf.Icon && <conf.Icon size={16} style={{ color: conf.color }} />}
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
