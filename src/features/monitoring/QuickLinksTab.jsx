import {
  ExternalLink,
  Database,
  Users,
  Terminal,
  FileCode2,
  Globe,
  CreditCard,
  Settings,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { app } from '../../app/config/firebase.js';

export function QuickLinksTab() {
  const [copiedKey, setCopiedKey] = useState(null);

  const projectId =
    app?.options?.projectId ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    'extrahub-c95af';

  const links = [
    {
      key: 'firestore',
      title: 'Cloud Firestore Database',
      description: 'Просмотр и прямое управление коллекциями данных (users, enrollments, activities, auditLog, systemErrors)',
      url: `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/data`,
      icon: Database,
      color: '#f59e0b',
    },
    {
      key: 'auth',
      title: 'Firebase Authentication',
      description: 'Список зарегистрированных пользователей, управление провайдерами авторизации и блокировка аккаунтов',
      url: `https://console.firebase.google.com/project/${projectId}/authentication/users`,
      icon: Users,
      color: '#3b82f6',
    },
    {
      key: 'functions-list',
      title: 'Cloud Functions (Список функций)',
      description: 'Мониторинг статуса, триггеров, выделенной памяти и версий всех 12 callable и scheduled функций',
      url: `https://console.firebase.google.com/project/${projectId}/functions/list`,
      icon: Terminal,
      color: '#8b5cf6',
    },
    {
      key: 'functions-logs',
      title: 'Cloud Functions (Логи выполнения)',
      description: 'Детальные системные логи Cloud Logging / Operations для отладки вызовов функций в реальном времени',
      url: `https://console.firebase.google.com/project/${projectId}/functions/logs`,
      icon: FileCode2,
      color: '#6366f1',
    },
    {
      key: 'hosting',
      title: 'Firebase Hosting',
      description: 'Управление развернутыми версиями SPA-приложения, доменами и SSL-сертификатами',
      url: `https://console.firebase.google.com/project/${projectId}/hosting/sites`,
      icon: Globe,
      color: '#06b6d4',
    },
    {
      key: 'usage-billing',
      title: 'Использование и биллинг (Usage & Billing)',
      description: 'Текущий расход квот Firestore, Cloud Functions, Authentication и затраты по тарифному плану Blaze',
      url: `https://console.firebase.google.com/project/${projectId}/usage`,
      icon: CreditCard,
      color: '#10b981',
    },
    {
      key: 'settings',
      title: 'Настройки проекта и Service Accounts',
      description: 'Конфигурация Google Cloud проекта, API ключи, сервисные аккаунты и права IAM',
      url: `https://console.firebase.google.com/project/${projectId}/settings/general`,
      icon: Settings,
      color: '#64748b',
    },
  ];

  const handleCopy = (key, text, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Project ID Header Banner */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Текущий Firebase Project ID
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {projectId}
            </div>
          </div>
        </div>

        <a
          href={`https://console.firebase.google.com/project/${projectId}/overview`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span>Главная консоль Firebase</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Grid of Console Links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {links.map((link) => {
          const Icon = link.icon;
          const isCopied = copiedKey === link.key;

          return (
            <a
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="monitoring-link-card"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: `${link.color}15`,
                    color: link.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{link.title}</span>
                    <ExternalLink size={13} color="var(--text-muted)" />
                  </div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {link.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleCopy(link.key, link.url, e)}
                title="Копировать прямую ссылку"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px',
                  borderRadius: 'var(--radius-xs)',
                  color: isCopied ? 'var(--success)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  marginLeft: '10px',
                }}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </a>
          );
        })}
      </div>
    </div>
  );
}
