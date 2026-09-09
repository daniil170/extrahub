import { Link } from 'react-router-dom';
import { Card, Badge, PageHeader } from '../../shared/ui/index.js';

export function AboutPage() {
  const teamMembers = [
    {
      id: 'daniil',
      name: 'Ivakin Daniil (Даниил Ивакин)',
      role: 'Lead Software Engineer & System Architect',
      tag: 'Разработка всей платформы',
      tagVariant: 'info',
      avatar: '💻',
      bio: 'Архитектор и ведущий разработчик программного комплекса ExtraHub. Спроектировал и реализовал систему с нуля, объединив передовые инженерные практики веб-разработки.',
      achievements: [
        'Архитектура и FSD: спроектировал модульную клиентскую архитектуру по методологии Feature-Sliced Design (FSD) на React 19 и Vite с полной изоляцией слоёв (shared, features, entities, app).',
        'Backend & Cloud Engine: спроектировал схему данных Google Cloud Firestore, Security Rules с разграничением прав на уровне коллекций и Cloud Functions для обработки транзакций.',
        'Движок удержания мест и очередей (Hold & Waitlist Engine): реализовал алгоритм 24-часового бронирования мест с защитой от двойной записи (race condition) и автоматическим продвижением листа ожидания.',
        '5 специализированных интерфейсов: создал личные кабинеты ученика, родителя, журнал преподавателя, панель координатора и панель администратора.',
        'Биллинг в тенге (₸): разработал модуль автоматического и пакетного выставления счетов по группам и подтверждения офлайн-платежей наличными.',
        'UX, Тёмная тема и мобильность: создал адаптивную тему на CSS-переменных без мерцания (zero FOUT), динамический векторный брендинг и удобную вёрстку для смартфонов.',
        'Качество кода: покрыл ключевые сценарии 25 модульными тестами (Vitest, 100% pass), настроил линтинг ESLint и написал скрипт сидирования реалистичных данных школы.',
      ],
    },
    {
      id: 'amir',
      name: 'Amir Timurbulat (Амир Тимурбулат)',
      role: 'Product Idea & Lead UX/Market Researcher',
      tag: 'Идея продукта и исследования',
      tagVariant: 'success',
      avatar: '💡',
      bio: 'Инициатор создания ExtraHub и руководитель продуктовых исследований. Сформулировал фундаментальную идею единого хаба внеурочной школьной деятельности.',
      achievements: [
        'Исследование потребностей школ (CustDev): провёл серию глубинных интервью с администрацией школ, завучами по воспитательной работе, родителями и школьниками.',
        'Формулирование продуктовой концепции: выявил ключевые «боли» традиционной системы — потерю заявлений на бумаге, путаницу в очередях на популярные кружки и срывы сбора оплат.',
        'Проектирование пользовательских путей (CJM): разработал сценарии взаимодействия для каждого участника школьного процесса, включая безопасную авторизацию родителей по токенам приглашения без регистрации.',
        'Механика геймификации: заложил систему поощрения школьников бейджами («100% дисциплина», «Хакатон-мастер») для повышения вовлечённости и посещаемости.',
      ],
    },
    {
      id: 'maulen',
      name: 'Maulen Stanbaev (Маулен Станбаев)',
      role: 'Head of Marketing & Business Development',
      tag: 'Маркетинг и переговоры',
      tagVariant: 'warning',
      avatar: '📈',
      bio: 'Директор по маркетингу и развитию партнёрских отношений. Отвечает за стратегию вывода ExtraHub на рынок, переговоры со школами и презентацию ценности продукта.',
      achievements: [
        'Переговоры с администрацией школ: организует встречи с директорами и завучами учебных заведений, проводит демонстрации возможностей платформы ExtraHub.',
        'Маркетинговая стратегия: разработал позиционирование платформы как передового инструмента цифровой трансформации внеучебной работы школы.',
        'Презентация ценности и метрик: наглядно демонстрирует администрации сокращение времени координатора на 80% и 100% прозрачность сборов денежных средств.',
        'Партнёрская сеть и пилотные запуски: формирует воронку пилотных внедрений ExtraHub в государственных и частных школах Республики Казахстан.',
      ],
    },
  ];

  const capabilities = [
    {
      role: 'Для учеников',
      icon: '🎓',
      color: 'var(--primary)',
      items: [
        'Интерактивный каталог секций и кружков с фильтрами по категориям (Спорт, IT, Языки, Творчество, Наука)',
        'Бронирование места с 24-часовым таймером удержания (Hold) до подтверждения родителями',
        'Прозрачный лист ожидания с отображением позиции в очереди при 100% заполненности кружка',
        'Личный кабинет с персональным расписанием занятий и контактами педагогов',
        'Геймификация и бейджи достижений за успехи, дисциплину и активность',
      ],
    },
    {
      role: 'Для родителей',
      icon: '👨‍👩‍👦',
      color: 'var(--accent-coral)',
      items: [
        'Подтверждение бронирования ребёнка в один клик через веб-кабинет или защищённую ссылку',
        'Прозрачный финансовый биллинг с фиксированными суммами в казахстанских тенге (₸)',
        'Оплата онлайн картой/Kaspi или регистрация наличного расчёта через координатора',
        'Контроль посещаемости занятий ребёнком с уведомлениями об отметках в журнале',
        'Управление несколькими секциями в одном окне без бумажных квитанций',
      ],
    },
    {
      role: 'Для преподавателей',
      icon: '👨‍🏫',
      color: 'var(--success)',
      items: [
        'Электронный журнал посещаемости в один клик с поддержкой 4 статусов («Был», «Опоздал», «Уважительная», «Не был»)',
        'Мгновенное автосохранение результатов урока с подтверждающими уведомлениями',
        'Всегда актуальный список учащихся без риска двойных списков или потерянных учеников',
        'Быстрый доступ к контактам родителей каждого ребёнка для оперативной связи',
        'История посещаемости по датам для отчётности в учебную часть',
      ],
    },
    {
      role: 'Для координаторов и администрации',
      icon: '📋',
      color: 'var(--warning)',
      items: [
        'Мониторинг загрузки групп в реальном времени с автоматическими алертами о 100% заполнении',
        'Автоматическое и ручное продвижение кандидатов из листа ожидания при освобождении мест',
        'Пакетное выставление счетов по группам и подтверждение офлайн-платежей',
        'Конструктор добавления новых кружков с автогенерацией программы обучения и результатов',
        'Гибкое управление вместимостью учебных кабинетов и расписанием секций',
      ],
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <PageHeader
        title="О платформе ExtraHub и команде проекта"
        subtitle="Инновационная цифровая экосистема дополнительного образования для школ Республики Казахстан"
      />

      {/* Hero Mission Card */}
      <Card
        style={{
          marginBottom: '32px',
          background:
            'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ padding: '8px 4px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            🚀 Наша миссия
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 12px',
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            Сделать внеучебную деятельность школы прозрачной, удобной и вдохновляющей
          </h2>
          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              margin: 0,
              maxWidth: '920px',
            }}
          >
            ExtraHub решает ключевые проблемы школьного досуга: бумажную волокиту, очереди в секции,
            непрозрачность оплат и потерю посещаемости. Мы объединяем школьников, родителей,
            преподавателей и руководство в едином цифровом пространстве.
          </p>
        </div>
      </Card>

      {/* Team Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 6px',
              color: 'var(--text-primary)',
            }}
          >
            👥 Команда проекта ExtraHub
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Специалисты, создавшие идею, архитектуру, продукт и стратегию развития платформы
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {teamMembers.map((member) => (
            <Card
              key={member.id}
              className="interactive-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderTop: '3px solid var(--primary)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {member.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <Badge variant={member.tagVariant} style={{ marginBottom: '6px' }}>
                    {member.tag}
                  </Badge>
                  <h4
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      margin: '0 0 4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {member.name}
                  </h4>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--primary)',
                    }}
                  >
                    {member.role}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                }}
              >
                {member.bio}
              </p>

              {/* Achievements / What was done */}
              <div
                style={{
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                  }}
                >
                  Вклад и ключевые результаты:
                </div>
                <ul
                  style={{
                    paddingLeft: '18px',
                    margin: 0,
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {member.achievements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Capabilities Showcase */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 6px',
              color: 'var(--text-primary)',
            }}
          >
            ⚡ Возможности платформы ExtraHub
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Инструменты, закрывающие полный цикл управления внеучебной деятельностью школы
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '20px',
          }}
        >
          {capabilities.map((cap, idx) => (
            <Card
              key={idx}
              className="interactive-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '24px' }}>{cap.icon}</span>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {cap.role}
                </h4>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {cap.items.map((it, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Technical Highlights & Legal Notice */}
      <Card
        style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '16px',
                fontWeight: 700,
                margin: '0 0 4px',
                color: 'var(--text-primary)',
              }}
            >
              🛡 Защита прав и стандарты качества
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              ExtraHub Platform • Зарегистрированная интеллектуальная собственность команды
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            © 2026 ExtraHub. Все права защищены.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            <strong>Стек разработки:</strong> React 19, Vite, Firebase, Cloud Security Rules,
            Feature-Sliced Design (FSD).
          </div>
          <div>
            <strong>Региональный контекст:</strong> Поддержка национальной валюты (тенге ₸),
            школ Казахстана и языковых стандартов.
          </div>
          <div>
            <strong>Готовность к внедрению:</strong> Платформа оптимизирована для запуска как в
            муниципальных, так и в частных школах и лицеях.
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link
            to="/catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Перейти к каталогу кружков →
          </Link>
        </div>
      </Card>
    </div>
  );
}
