import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from './Button.jsx';

const STORAGE_KEY = 'extrahub_cookie_consent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so it smoothly appears
        const timer = setTimeout(() => {
          setVisible(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Could not read cookie consent state:', e);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch (e) {
      console.warn('Could not save cookie consent state:', e);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Уведомление об использовании cookies и localStorage"
      role="region"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        padding: '12px 20px',
        animation: 'fadeIn 0.25s ease-out forwards',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            flex: 1,
            minWidth: '260px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--primary)',
            }}
          >
            <Cookie size={18} />
          </div>
          <div>
            Мы используем локальное хранилище (localStorage) и сессионные cookies для авторизации,
            безопасной работы сервиса и сохранения настроек темы.{' '}
            <Link
              to="/privacy-policy"
              style={{
                color: 'var(--primary)',
                textDecoration: 'underline',
                fontWeight: 500,
              }}
            >
              Политика конфиденциальности
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            style={{ padding: '6px 16px', fontWeight: 600 }}
          >
            Понятно
          </Button>
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Закрыть уведомление"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-xs)',
              transition: 'color 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
