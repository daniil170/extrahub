import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  ArrowRight,
  Clock,
  Layers,
  Users,
  ShieldCheck,
  Calendar,
  Wrench,
  AlertTriangle,
  BarChart3,
  Activity,
  Archive,
  CreditCard,
  GraduationCap,
  UserCheck,
  Code,
  Lightbulb,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../shared/ui/index.js';
import './AboutPage.css';

/**
 * Reusable Apple-style Expandable Card with CSS grid auto-height transition
 */
function AppleExpandableCard({
  id,
  title,
  teaser,
  icon: IconComponent,
  details = [],
  tags = [],
  isExpanded,
  onToggle,
}) {
  return (
    <div className={`apple-expandable-card ${isExpanded ? 'is-expanded' : ''}`}>
      <button
        type="button"
        className="apple-card-trigger"
        onClick={() => onToggle(id)}
        aria-expanded={isExpanded}
        aria-controls={`card-content-${id}`}
      >
        <div className="apple-card-header-left">
          <div className="apple-card-icon-box">
            <IconComponent size={22} strokeWidth={1.8} />
          </div>
          <div className="apple-card-titles">
            <h3 className="apple-card-title">{title}</h3>
            <p className="apple-card-teaser">{teaser}</p>
          </div>
        </div>

        <div className="apple-card-chevron-btn" aria-hidden="true">
          <ChevronDown size={18} strokeWidth={2} />
        </div>
      </button>

      <div
        id={`card-content-${id}`}
        className="apple-card-content"
        role="region"
        aria-label={title}
      >
        <div className="apple-card-inner">
          <div className="apple-card-divider" />
          <ul className="apple-card-details-list">
            {details.map((detail, idx) => (
              <li key={idx} className="apple-card-detail-item">
                <Check size={16} strokeWidth={2.2} className="apple-card-detail-icon" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          {tags.length > 0 && (
            <div className="apple-card-tags">
              {tags.map((tag, tIdx) => (
                <span key={tIdx} className="apple-card-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  // Track open card IDs (supports opening multiple cards cleanly)
  const [expandedCards, setExpandedCards] = useState(() => ({
    'club-hold': true,
    'tech-kanban': true,
    'role-student': true,
  }));

  const handleToggleCard = (cardId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Scroll reveal setup: Single-shot entrance observer
  useEffect(() => {
    const revealElements = document.querySelectorAll('.about-reveal');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target); // Reveal once only
          }
        });
      },
      {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1,
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Module 1: Clubs & Extracurricular Activities features
  const clubFeatures = [
    {
      id: 'club-hold',
      title: '24-часовой холд места',
      teaser: 'Интеллектуальное резервирование с защитой от двойной записи и таймером для родителя.',
      icon: Clock,
      details: [
        'Изолированная Cloud Function транзакция исключает переполнение группы (race conditions).',
        'Персональная ссылка и динамический QR-код для моментального подтверждения в WhatsApp или Telegram.',
        'Обратный отсчёт времени синхронизирован с сервером с точностью до секунды.',
      ],
      tags: ['HOLD ENGINE', 'CLOUD TRANSACTION', 'ZERO RACE-CONDITION'],
    },
    {
      id: 'club-waitlist',
      title: 'Автоматический Waitlist',
      teaser: 'Динамическая очередь ожидания с моментальным переходом при освобождении мест.',
      icon: Layers,
      details: [
        'При отмене брони место мгновенно передается первому кандидату в очереди с запуском нового 24ч окна.',
        'Ученик и родители всегда видят точный номер своей позиции в очереди без звонков завучу.',
        'Аналитика спроса подсказывает координатору, когда необходимо открыть параллельную секцию.',
      ],
      tags: ['FIFO QUEUE', 'AUTO PROMOTION', 'CAPACITY PLANNING'],
    },
    {
      id: 'club-journal',
      title: 'Электронный журнал в 1 клик',
      teaser: 'Фиксация посещаемости за 30 секунд с поддержкой 4 статусов и автосводкой.',
      icon: Calendar,
      details: [
        'Удобный интерфейс выбора: «Присутствовал», «Отсутствовал», «Опоздал», «Уважительная причина».',
        'Кнопка «Отметить всех присутствующими» экономит до 90% рутинного времени педагога.',
        'Мгновенное сохранение в журнал с подтверждающими уведомлениями и историей по датам.',
      ],
      tags: ['1-CLICK JOURNAL', 'ATTENDANCE TRACKING', 'FAST SAVE'],
    },
    {
      id: 'club-billing',
      title: 'Школьный биллинг в тенге (₸)',
      teaser: 'Пакетная выписка счетов, отслеживание оплаты и квитанции офлайн-расчётов.',
      icon: CreditCard,
      details: [
        'Пакетная генерация счетов на всю группу за текущий учебный месяц в один клик.',
        'Раздельный учёт онлайн-платежей и регистрация наличного расчёта через координатора.',
        'Автоматические напоминания родителям и строгий контроль задолженностей.',
      ],
      tags: ['BILLING KZT (₸)', 'BATCH INVOICES', 'OFFLINE RECEIPTS'],
    },
  ];

  // Module 2: Equipment Maintenance & Repair features
  const equipmentFeatures = [
    {
      id: 'tech-quick-report',
      title: 'Экспресс-подача заявки',
      teaser: 'Регистрация поломки учителем за 30 секунд без бумажных служебных записок.',
      icon: AlertTriangle,
      details: [
        'Автоматическая подстановка кабинета и ответственного педагога из сессии.',
        '5 категорий поломок: Компьютеры, Электрика, Мебель, Сантехника, Другое.',
        'Двухшаговое подтверждение отмены («Точно отменить?») предотвращает случайный сброс.',
      ],
      tags: ['INCIDENT REPORT', 'PRIORITY MATRIX', 'CONFIRM CANCEL'],
    },
    {
      id: 'tech-kanban',
      title: 'Канбан технической службы',
      teaser: 'Доска задач со строгими SLA-нормативами и фиксацией каждого действия мастера.',
      icon: Wrench,
      details: [
        '3 прозрачные колонки: «Новые», «В работе», «Решено» с моноширинными счётчиками.',
        'Взятие в работу и закрытие закреплены исключительно за ролью сертифицированного техника.',
        'Обязательный комментарий выполненного решения для приёмки и контроля качества.',
      ],
      tags: ['KANBAN BOARD', 'SLA MONITORING', 'TECH WORKFLOW'],
    },
    {
      id: 'tech-health-index',
      title: 'Equipment Health Index',
      teaser: 'Оперативный процент исправности школьного фонда и аналитика уязвимых зон.',
      icon: Activity,
      details: [
        'Расчёт соотношения открытых инцидентов к общему парку оборудования школы в реальном времени.',
        'Контроль нормативов обслуживания: время первого отклика < 30 минут, соблюдение SLA 98.2%.',
        'Горизонтальные диаграммы распределения поломок по категориям для закупки запчастей.',
      ],
      tags: ['HEALTH INDEX', 'SLA STATS', 'ANALYTICS KPI'],
    },
    {
      id: 'tech-retention',
      title: 'Регламент архивации 7 дней',
      teaser: 'Завершённые ремонты остаются на активной доске неделю для контроля приёмки.',
      icon: Archive,
      details: [
        'Преподаватель видит статус и комментарий техника в течение 7 дней после завершения.',
        'Автоматическая архивация старых заявок предотвращает захламление рабочей доски.',
        'Удобный переключатель вкладок: «Активные (< 7 дн.)», «Архив» и «Все заявки».',
      ],
      tags: ['7-DAY RETENTION', 'AUDIT TRAIL', 'ARCHIVE FILTER'],
    },
  ];

  // Section 3: Roles
  const roles = [
    {
      id: 'role-student',
      title: 'Ученик',
      teaser: 'Каталог секций, бронь с 24-часовым таймером и геймификация.',
      icon: GraduationCap,
      details: [
        'Интерактивный каталог с фильтрацией по направлениям (IT, Спорт, Языки, Наука, Арт).',
        'Бронирование места с наглядным таймером и отслеживанием очереди в листе ожидания.',
        'Персональное расписание занятий, кабинет и контакты преподавателя в одном экране.',
        'Система бейджей за посещаемость и дисциплину («100% дисциплина», «Хакатон-мастер»).',
      ],
      tags: ['КАТАЛОГ СЕКЦИЙ', 'ХОЛД 24 ЧАСА', 'ДОСТИЖЕНИЯ'],
    },
    {
      id: 'role-parent',
      title: 'Родитель',
      teaser: 'Подтверждение в один клик, онлайн-биллинг и контроль посещаемости.',
      icon: Users,
      details: [
        'Подтверждение бронирования ребёнка по защищённой ссылке без обязательной регистрации.',
        'Прозрачный школьный биллинг с фиксированными суммами в казахстанских тенге (₸).',
        'Оплата картой или регистрация наличных через координатора с мгновенным чеком.',
        'Контроль посещаемости с детализацией отметок в электронном журнале.',
      ],
      tags: ['БЕЗ ПАРОЛЕЙ', 'БИЛЛИНГ ₸', 'ПОСЕЩАЕМОСТЬ'],
    },
    {
      id: 'role-teacher',
      title: 'Преподаватель',
      teaser: 'Журнал в 1 клик, контакты родителей и экспресс-заявки на ремонт.',
      icon: UserCheck,
      details: [
        'Электронный журнал с быстрой отметкой присутствия и автосохранением.',
        'Прямой доступ к контактам родителей учащихся для оперативной связи.',
        'Быстрая подача заявки о неисправности в кабинете (проектор, проводка, мебель).',
      ],
      tags: ['ЖУРНАЛ В 1 КЛИК', 'КОНТАКТЫ РОДИТЕЛЕЙ', 'РЕПОРТ ПОЛОМОК'],
    },
    {
      id: 'role-coordinator',
      title: 'Координатор',
      teaser: 'Мониторинг вместимости групп, очереди и выставление счетов.',
      icon: BarChart3,
      details: [
        'Контроль загрузки кабинетов с автоматическими алертами о 100% заполнении.',
        'Пакетное выставление счетов по группам и подтверждение оплаты наличными.',
        'Конструктор добавления кружков с программой из 5 модулей и ожидаемыми результатами.',
      ],
      tags: ['МОНИТОРИНГ МЕСТ', 'ПАКЕТНЫЙ БИЛЛИНГ', 'КОНСТРУКТОР КРУЖКОВ'],
    },
    {
      id: 'role-technician',
      title: 'Техник',
      teaser: 'Канбан-доска ремонтов, соблюдение SLA и отчеты о решении проблем.',
      icon: Wrench,
      details: [
        'Канбан-доска инцидентов школы с распределением по срочности и кабинетам.',
        'Исключительное право на принятие задач в работу и фиксацию закрытия ремонта.',
        'Виджеты Equipment Health Index и нормативы времени первого отклика.',
      ],
      tags: ['КАНБАН СЛУЖБЫ', 'SLA РЕМОНТА', 'ОТЧЁТ МАСТЕРА'],
    },
    {
      id: 'role-admin',
      title: 'Администратор школы',
      teaser: 'Сквозной аудит, аналитика безопасности и централизованный контроль.',
      icon: ShieldCheck,
      details: [
        'Режим сквозного мониторинга всех кружков, оплат и заявок на ремонт школы.',
        'Полная изоляция прав доступа на уровне правил Cloud Firestore Security Rules.',
        'Сводная финансовая отчётность и аудит соблюдения нормативов обслуживания.',
      ],
      tags: ['СКВОЗНОЙ АУДИТ', 'CLOUD SECURITY', 'ФИНАНСОВЫЙ ОТЧЁТ'],
    },
  ];

  // Section 4: Creators & Architecture
  const teamMembers = [
    {
      id: 'team-daniil',
      name: 'Ivakin Daniil (Даниил Ивакин)',
      role: 'Lead Software Engineer & System Architect',
      teaser: 'Архитектура всей платформы, Cloud Engine, FSD, движок холдов и модуль ремонта.',
      icon: Code,
      details: [
        'Спроектировал модульную клиентскую архитектуру Feature-Sliced Design на React 19 и Vite с полной изоляцией слоёв.',
        'Реализовал схему Google Cloud Firestore, Security Rules с изоляцией прав и Cloud Functions для транзакций.',
        'Разработал движок удержания мест (Hold & Waitlist Engine) с защитой от двойной записи и 24-часовым окном.',
        'Создал модуль заявок на ремонт: канбан-доска техника, SLA-виджеты, Health Index и 7-дневный регламент хранения.',
        'Покрыл ключевую логику 35 модульными тестами с 100% pass rate и внедрил строгий линтинг ESLint.',
      ],
      tags: ['FSD ARCHITECTURE', 'REACT 19', 'HOLD & WAITLIST', '35 UNIT TESTS'],
    },
    {
      id: 'team-amir',
      name: 'Amir Timurbulat (Амир Тимурбулат)',
      role: 'Product Idea & Lead UX/Market Researcher',
      teaser: 'Идея хаба, CustDev-исследование школ, проектирование CJM и геймификация.',
      icon: Lightbulb,
      details: [
        'Инициатор создания ExtraHub и руководитель глубинных продуктовых исследований школьной среды.',
        'Провёл серию CustDev-интервью с директорами, завучами, классными руководителями и родителями.',
        'Спроектировал пользовательские сценарии (CJM), включая вход родителей по токенам без регистрации.',
        'Заложил игровую механику бейджей достижений («100% дисциплина») для вовлечения учащихся.',
      ],
      tags: ['PRODUCT CONCEPT', 'CUSTDEV', 'CJM DESIGN', 'GAMIFICATION'],
    },
    {
      id: 'team-maulen',
      name: 'Maulen Stanbaev (Маулен Станбаев)',
      role: 'Head of Marketing & Business Development',
      teaser: 'Позиционирование продукта, переговоры с учебными заведениями и метрики ценности.',
      icon: TrendingUp,
      details: [
        'Разработал стратегию позиционирования ExtraHub как флагманской платформы цифровизации внеучебки.',
        'Организует презентации для администрации школ, наглядно доказывая сокращение рутины координатора на 80%.',
        'Формирует воронку пилотных внедрений в государственных и частных образовательных учреждениях РК.',
        'Курирует адаптацию платформы под регламенты и требования школ Республики Казахстан.',
      ],
      tags: ['BIZDEV', 'SCHOOL PILOTS', 'VALUE METRICS', 'KZ REGULATIONS'],
    },
  ];

  return (
    <div className="about-apple-page">
      {/* 1. HERO SECTION */}
      <section className="about-section about-hero about-reveal">
        <div className="about-eyebrow">
          <Sparkles size={14} />
          <span>EXTRAHUB PLATFORM • DIGITAL SCHOOL ECOSYSTEM</span>
        </div>

        <h1 className="about-headline-display">
          Вся жизнь школы.
          <br />
          В едином ритме.
        </h1>

        <p className="about-subheading">
          Единая цифровая экосистема для записи в секции, прозрачного биллинга в тенге
          и оперативного обслуживания школьного оборудования.
        </p>

        <div className="about-hero-actions">
          <Link to="/catalog">
            <Button variant="primary" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Исследовать каталог секций</span>
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/teacher">
            <Button variant="outline" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} />
              <span>Заявки на ремонт</span>
            </Button>
          </Link>
        </div>

        {/* Floating Apple-style Trust / Stats Bar */}
        <div className="about-hero-stats">
          <div className="about-stat-item">
            <div className="about-stat-number">2</div>
            <div className="about-stat-label">независимых модуля: кружки и ремонт оборудования</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">6</div>
            <div className="about-stat-label">ролевых профилей с индивидуальным интерфейсом</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">24 ч</div>
            <div className="about-stat-label">холд места с защитой от двойного бронирования</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">0</div>
            <div className="about-stat-label">потерянных бумажных списков и хаоса в чатах</div>
          </div>
        </div>
      </section>

      {/* 2. MODULE 1: CLUBS & EXTRACURRICULAR ACTIVITIES */}
      <section className="about-section about-reveal">
        <div className="about-eyebrow">
          <GraduationCap size={14} />
          <span>МОДУЛЬ 1 • ДОПОЛНИТЕЛЬНОЕ ОБРАЗОВАНИЕ</span>
        </div>

        <h2 className="about-headline-section">
          Кружки и секции.
          <br />
          Запись без очередей и волокиты.
        </h2>

        <p className="about-subheading">
          Полная автоматизация внеурочной траектории: интерактивный каталог, бронь с таймером,
          умный лист ожидания, электронный журнал и прозрачный биллинг.
        </p>

        <div className="about-cards-grid">
          {clubFeatures.map((item) => (
            <AppleExpandableCard
              key={item.id}
              id={item.id}
              title={item.title}
              teaser={item.teaser}
              icon={item.icon}
              details={item.details}
              tags={item.tags}
              isExpanded={!!expandedCards[item.id]}
              onToggle={handleToggleCard}
            />
          ))}
        </div>
      </section>

      {/* 3. MODULE 2: EQUIPMENT MAINTENANCE & REPAIR */}
      <section className="about-section about-reveal">
        <div className="about-eyebrow">
          <Wrench size={14} />
          <span>МОДУЛЬ 2 • ТЕХНИЧЕСКИЙ СЕРВИС</span>
        </div>

        <h2 className="about-headline-section">
          Сервисная служба школы.
          <br />
          Нулевой простой оборудования.
        </h2>

        <p className="about-subheading">
          От сломанного проектора до короткого замыкания в щитке — сквозной цикл ремонта
          с канбаном, контролем SLA и регламентом хранения инцидентов.
        </p>

        <div className="about-cards-grid">
          {equipmentFeatures.map((item) => (
            <AppleExpandableCard
              key={item.id}
              id={item.id}
              title={item.title}
              teaser={item.teaser}
              icon={item.icon}
              details={item.details}
              tags={item.tags}
              isExpanded={!!expandedCards[item.id]}
              onToggle={handleToggleCard}
            />
          ))}
        </div>
      </section>

      {/* 4. ECOSYSTEM OF ROLES */}
      <section className="about-section about-reveal">
        <div className="about-eyebrow">
          <Users size={14} />
          <span>РОЛЕВАЯ МОДЕЛЬ</span>
        </div>

        <h2 className="about-headline-section">
          Шесть ролей.
          <br />
          Один слаженный школьный механизм.
        </h2>

        <p className="about-subheading">
          Каждый участник образовательного процесса получает сфокусированный инструмент,
          созданный специально под его ежедневные задачи.
        </p>

        <div className="about-cards-grid">
          {roles.map((item) => (
            <AppleExpandableCard
              key={item.id}
              id={item.id}
              title={item.title}
              teaser={item.teaser}
              icon={item.icon}
              details={item.details}
              tags={item.tags}
              isExpanded={!!expandedCards[item.id]}
              onToggle={handleToggleCard}
            />
          ))}
        </div>
      </section>

      {/* 5. CREATORS & ENGINEERING ARCHITECTURE */}
      <section className="about-section about-reveal">
        <div className="about-eyebrow">
          <Code size={14} />
          <span>СОЗДАТЕЛИ И СТАНДАРТЫ</span>
        </div>

        <h2 className="about-headline-section">
          Инженерная основа.
          <br />
          Спроектировано с нуля.
        </h2>

        <p className="about-subheading">
          ExtraHub создан командой разработчиков, исследователей и маркетологов
          на базе реальных интервью и регламентов школ Республики Казахстан.
        </p>

        <div className="about-cards-grid">
          {teamMembers.map((member) => (
            <AppleExpandableCard
              key={member.id}
              id={member.id}
              title={member.name}
              teaser={`${member.role} — ${member.teaser}`}
              icon={member.icon}
              details={member.details}
              tags={member.tags}
              isExpanded={!!expandedCards[member.id]}
              onToggle={handleToggleCard}
            />
          ))}
        </div>
      </section>

      {/* 6. FINAL CTA & TRUST SECTION */}
      <section className="about-section about-reveal">
        <div className="about-cta-box">
          <div className="about-eyebrow" style={{ marginBottom: '16px' }}>
            <ShieldCheck size={14} />
            <span>ГОТОВО К ВНЕДРЕНИЮ В ШКОЛАХ РК</span>
          </div>

          <h2 className="about-headline-section" style={{ maxWidth: '780px' }}>
            Переведите внеучебную жизнь школы на новый технологичный уровень.
          </h2>

          <p className="about-subheading" style={{ textAlign: 'center' }}>
            Исследуйте открытый каталог кружков, запишитесь на демо-сессию или протестируйте
            любую из шести ролей платформы ExtraHub прямо сейчас.
          </p>

          <div className="about-cta-buttons">
            <Link to="/catalog">
              <Button variant="primary" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Открыть каталог секций</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Войти в личный кабинет
              </Button>
            </Link>
          </div>

          <div
            style={{
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--primary)" />
              100% изоляция данных Cloud Security Rules
            </span>
            <span>•</span>
            <span>Стандарты школ Республики Казахстан</span>
            <span>•</span>
            <span>Релиз 2026 ExtraHub Platform</span>
          </div>
        </div>
      </section>
    </div>
  );
}
