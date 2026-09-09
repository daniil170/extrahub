import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/index.js';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';

export function Footer() {
  const { isDark } = useTheme();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        marginTop: 'auto',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 20px 32px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Brand & Slogan */}
          <div>
            <Link
              to="/catalog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              <img
                src={isDark ? logoDarkImg : logoImg}
                alt="ExtraHub Logo"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '20px',
                  color: 'var(--primary)',
                  letterSpacing: '-0.4px',
                }}
              >
                ExtraHub
              </span>
            </Link>

            <p
              style={{
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: '16px',
              }}
            >
              Единая цифровая экосистема дополнительного образования для современных школ.
              Управление кружками, бронирование мест, прозрачный биллинг и журнал посещаемости.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  display: 'inline-block',
                }}
              />
              Платформа активна • Релиз 2026
            </div>
          </div>

          {/* Column 2: Platform Capabilities */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Возможности
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '13.5px',
              }}
            >
              <li>
                <Link to="/catalog" style={{ color: 'inherit' }} className="footer-link">
                  🔍 Каталог секций и кружков
                </Link>
              </li>
              <li>
                <Link to="/student" style={{ color: 'inherit' }} className="footer-link">
                  ⏱ Бронь места с таймером 24ч
                </Link>
              </li>
              <li>
                <Link to="/parent" style={{ color: 'inherit' }} className="footer-link">
                  💳 Онлайн-биллинг и оплата (₸)
                </Link>
              </li>
              <li>
                <Link to="/teacher" style={{ color: 'inherit' }} className="footer-link">
                  📋 Электронный журнал в 1 клик
                </Link>
              </li>
              <li>
                <Link to="/coordinator" style={{ color: 'inherit' }} className="footer-link">
                  📊 Контроль вместимости и очереди
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Core Team */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Команда проекта
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  💻 Ivakin Daniil
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Lead Developer & System Architect (вся платформа)
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  💡 Amir Timurbulat
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Product Idea & UX Research
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  📈 Maulen Stanbaev
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Head of Marketing & BizDev (переговоры и презентации)
                </div>
              </div>

              <div style={{ marginTop: '4px' }}>
                <Link
                  to="/about"
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Подробнее о команде и стеке →
                </Link>
              </div>
            </div>
          </div>

          {/* Column 4: Regions & Security */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Безопасность и регион
            </h4>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}
            >
              🇰🇿 Разработано с учётом образовательных стандартов и регламентов школ Республики Казахстан.
            </p>
            <p
              style={{
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}
            >
              🔒 100% защита персональных данных учащихся и родителей на уровне изолированных правил Cloud Security Rules.
            </p>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Валюта расчётов: <strong>Казахстанский тенге (₸)</strong>
            </div>
          </div>
        </div>

        {/* Bottom bar with copyright */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © 2026 ExtraHub Platform. <strong>Все права защищены</strong> (All rights reserved).
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/about" style={{ color: 'inherit' }}>
              О платформе
            </Link>
            <Link to="/catalog" style={{ color: 'inherit' }}>
              Каталог секций
            </Link>
            <span>Республика Казахстан</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
