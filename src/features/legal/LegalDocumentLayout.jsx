import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../../shared/ui/index.js';
import './legal.css';

/**
 * Common document layout for legal pages (Privacy Policy, Terms of Use)
 * Includes Table of Contents with smooth scrolling, active anchor tracking,
 * and prominent legal draft disclaimer.
 */
export function LegalDocumentLayout({
  title,
  subtitle,
  versionDate = '13 сентября 2026 г.',
  sections = [],
  children,
}) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSectionId(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSectionId(id);
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-container">
      {/* Navigation & Controls */}
      <div className="legal-breadcrumbs">
        <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} /> Главная
        </Link>
        <span>/</span>
        <span>Правовые документы</span>
      </div>

      {/* Header */}
      <div className="legal-header">
        <div className="legal-badge-row">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
            }}
          >
            <ShieldCheck size={14} /> Официальный регламент
          </span>

          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Редакция от {versionDate}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 className="legal-title">{title}</h1>
            <p className="legal-meta">{subtitle}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Распечатать
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Document Content */}
      <div className="legal-grid">
        {/* Table of Contents */}
        <aside className="legal-toc-sticky">
          <div className="legal-toc-title">Содержание</div>
          <ul className="legal-toc-list">
            {sections.map((sec, idx) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className={`legal-toc-link ${activeSectionId === sec.id ? 'active' : ''}`}
                  onClick={(e) => handleTocClick(e, sec.id)}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      opacity: 0.7,
                      marginRight: '6px',
                      fontSize: '11px',
                    }}
                  >
                    0{idx + 1}.
                  </span>
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content Body */}
        <main className="legal-content">
          {children}

          {/* Mandatory Prominent Lawyer Disclaimer Callout */}
          <div className="legal-disclaimer-box" role="alert">
            <AlertTriangle size={22} className="legal-disclaimer-icon" />
            <div>
              <h4 className="legal-disclaimer-title">Внимание: Юридический статус документа</h4>
              <p className="legal-disclaimer-text">
                <strong>
                  Данный документ является черновиком и должен быть проверен юристом перед
                  официальным использованием.
                </strong>
                <br />
                Текст регламента подготовлен для демонстрации структуры и архитектуры безопасности
                платформы ExtraHub в образовательном учреждении. Перед публичным утверждением
                администрацией школы условия подлежат согласованию с юридическим отделом и
                приведению в строгое соответствие с локальными нормативными актами и
                законодательством Республики Казахстан.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
