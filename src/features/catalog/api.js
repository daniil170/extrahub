import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

export const MOCK_TEACHERS = {
  'teacher-1': { id: 'teacher-1', fullName: 'Михаил Сергеевич Петров' },
  'teacher-2': { id: 'teacher-2', fullName: 'Елена Викторовна Соколова' },
  'teacher-3': { id: 'teacher-3', fullName: 'Дмитрий Анатольевич Смирнов' },
  'teacher-4': { id: 'teacher-4', fullName: 'Сергей Иванович Кузнецов' },
  'teacher-5': { id: 'teacher-5', fullName: 'Анна Владимировна Морозова' },
  'teacher-6': { id: 'teacher-6', fullName: 'Ольга Николаевна Васильева' },
};

export const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Робототехника и Arduino',
    category: 'Технологии',
    description:
      'Основы схемотехники, программирование микроконтроллеров и конструирование роботов.',
    teacherId: 'teacher-1',
    ageGroup: '10–14 лет (5–8 класс)',
    price: 3500,
    location: 'Кабинет 304 (IT-лаборатория)',
    targetAudience: 'Для ребят, увлекающихся техникой, точными науками и программированием.',
    teacherBio:
      'Михаил Сергеевич Петров — преподаватель робототехники и информатики, стаж 8 лет. Сертифицированный эксперт WorldSkills Junior, подготовил призеров Всероссийской робототехнической олимпиады.',
    requirements:
      'Все наборы Arduino Uno, датчики, сервоприводы и учебные ноутбуки предоставляются школьной IT-лабораторией.',
    learningOutcomes: [
      'Понимание законов электротехники, чтение и сборка принципиальных схем',
      'Написание управляющего кода на языке C/C++ для микроконтроллеров',
      'Подключение цифровых и аналоговых датчиков, моторов и сервоприводов',
      'Проектирование и испытание собственного автономного робота на колёсном шасси',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'Основы электроники и макетирования',
        description:
          'Закон Ома, резисторы, светодиоды и сборка базовых схем на макетной плате (Breadboard) без пайки.',
        hours: '6 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Архитектура Arduino и код на C++',
        description:
          'Знакомство с платформой Arduino Uno, базовый синтаксис C++, функции setup() и loop(), управление портами ввода-вывода.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Датчики, приводы и индикация',
        description:
          'Работа с ультразвуковыми дальномерами, фоторезисторами, зуммерами, сервоприводами и символьными LCD-дисплеями.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Создание мобильного робота',
        description:
          'Сборка шасси, драйвер двигателей L298N, алгоритмы объезда препятствий и следования по чёрной линии.',
        hours: '12 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Финальный проект и демонстрация',
        description:
          'Инженерный хакатон: настройка алгоритмов, командные заезды роботов и презентация проектов родителям.',
        hours: '6 ак. ч.',
      },
    ],
  },
  {
    id: 'act-2',
    title: 'Театральная студия "Маска"',
    category: 'Искусство',
    description:
      'Развитие сценической речи, актёрское мастерство и постановка школьных спектаклей.',
    teacherId: 'teacher-2',
    ageGroup: '7–16 лет (1–10 класс)',
    price: 2500,
    location: 'Актовый зал',
    targetAudience:
      'Для творческих ребят, желающих раскрепоститься, научиться говорить уверенно и играть на сцене.',
    teacherBio:
      'Елена Викторовна Соколова — режиссёр-постановщик, выпускница Театрального института, стаж 12 лет. Автор 15 школьных постановок — лауреатов городских театральных фестивалей.',
    requirements:
      'Удобная свободная одежда тёмных тонов (футболка, спортивные брюки/леггинсы), мягкая сменная обувь (чешки или балетки).',
    learningOutcomes: [
      'Преодоление психологических зажимов и уверенность при публичных выступлениях',
      'Чёткая артикуляция, поставленный голос и правильное сценическое дыхание',
      'Развитие образного мышления, памяти, внимания и эмоционального интеллекта',
      'Опыт командного сценического взаимодействия и создания художественного образа',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'Сценическая речь и постановка голоса',
        description:
          'Дыхательная гимнастика Стрельниковой, дикционные разминки, артикуляция и работа с интонациями.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Основы актёрского мастерства',
        description:
          'Этюды на память физических действий, упражнения на внимание, воображение и доверие к партнёру.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Сценическое движение и пластика',
        description:
          'Координация, чувство ритма, пластическая выразительность, элементы сценического фехтования.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Работа над драматургическим материалом',
        description:
          'Чтение пьесы за столом, разбор характеров и мотивов персонажей, распределение ролей и мизансцены.',
        hours: '14 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Генеральные прогоны и премьера спектакля',
        description:
          'Костюмированные репетиции на большой сцене, работа со светом и звуком, открытый премьерный показ.',
        hours: '8 ак. ч.',
      },
    ],
  },
  {
    id: 'act-3',
    title: 'Шахматный клуб "Гроссмейстер"',
    category: 'Интеллект',
    description:
      'Тактика и стратегия шахматной игры, решение этюдов и участие в городских турнирах.',
    teacherId: 'teacher-3',
    ageGroup: '7–17 лет (1–11 класс)',
    price: 0,
    location: 'Библиотека, читальный зал',
    targetAudience:
      'Для любителей интеллектуальных вызовов и логических баталий любого уровня подготовки.',
    teacherBio:
      'Дмитрий Анатольевич Смирнов — кандидат в мастера спорта (КМС) по шахматам, спортивный судья первой категории, педагогический стаж 15 лет.',
    requirements:
      'Турнирные доски, шахматные часы DGT и учебные пособия предоставляются школой. Потребуется тетрадь для записи партий.',
    learningOutcomes: [
      'Глубокое понимание стратегических и тактических законов шахматной партии',
      'Умение рассчитывать варианты на 4–6 ходов вперёд и находить скрытые угрозы',
      'Выдержка, самодисциплина и психологическая устойчивость в стрессовых ситуациях',
      'Успешное выполнение нормативов юношеских спортивных разрядов',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'Дебютные принципы и золотые правила',
        description:
          'Борьба за центр, скорейшее развитие лёгких фигур, безопасность короля и типичные дебютные ловушки.',
        hours: '6 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Тактический арсенал шахматиста',
        description:
          'Двойной удар, связка, открытое нападение, мельница, завлечение, отвлечение и уничтожение защиты.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Стратегия миттельшпиля и оценка позиции',
        description:
          'Пешечные структуры, слабые поля, открытые вертикали, форпосты для коней и планы атаки на рокировку.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Эндшпиль — путь к победе',
        description:
          'Пешечные окончания, правило квадрата, оппозиция, ключевые поля и базовые ладейные окончания (позиция Лусены и Филидора).',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Турнирная практика и разбор партий',
        description:
          'Регулярные партии с контролем времени, запись ходов, анализ партий гроссмейстеров и школьное первенство.',
        hours: '8 ак. ч.',
      },
    ],
  },
  {
    id: 'act-4',
    title: 'Школьный волейбол',
    category: 'Спорт',
    description:
      'Командная спортивная секция, отработка подачи и приёма мяча, физическая подготовка.',
    teacherId: 'teacher-4',
    ageGroup: '12–17 лет (6–11 класс)',
    price: 1800,
    location: 'Большой спортивный зал',
    targetAudience:
      'Для учащихся средних и старших классов, стремящихся к активному спорту и командным победам.',
    teacherBio:
      'Сергей Иванович Кузнецов — мастер спорта, учитель физической культуры высшей категории, стаж 14 лет. Главный тренер сборной школы — победителей районной спартакиады.',
    requirements:
      'Спортивная футболка, шорты, волейбольные наколенники, специализированные кроссовки для зала с нескользящей светлой подошвой.',
    learningOutcomes: [
      'Освоение правильной биомеханики прыжка, подачи и нападающего удара',
      'Высокая точность верхней и нижней передачи мяча, надёжность приёма',
      'Развитие командной коммуникации, периферического зрения и скорости реакции',
      'Улучшение общей физической формы, укрепление суставов и мышечного корсета',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'ОФП, стойки и перемещения',
        description:
          'Развитие прыгучести, челночный бег, правильная волейбольная стойка, приставные и скрестные шаги.',
        hours: '6 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Техника передач и приёма мяча',
        description:
          'Верхняя передача двумя руками, приём мяча снизу на предплечья, доводка мяча до связующего игрока.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Подача и нападающий удар',
        description:
          'Нижняя прямая и планирующая подачи, техника разбега, вынос рук, хлесткий удар кистью по мячу.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Блок и игра в защите',
        description:
          'Одиночный и групповой блок, перенос рук через сетку, самостраховка и защитные падения.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Тактика игры и товарищеские матчи',
        description:
          'Игровые расстановки 4-2 и 5-1, зоны ответственности, спарринги со сборными параллельных классов.',
        hours: '10 ак. ч.',
      },
    ],
  },
  {
    id: 'act-5',
    title: 'Разговорный английский Debate Club',
    category: 'Языки',
    description:
      'Практика живого английского языка, участие в дебатах, расширение словарного запаса.',
    teacherId: 'teacher-5',
    ageGroup: '11–16 лет (5–10 класс)',
    price: 3200,
    location: 'Кабинет 214',
    targetAudience:
      'Для ребят, желающих преодолеть языковой барьер, говорить бегло и научиться аргументировать позицию на английском.',
    teacherBio:
      'Анна Владимировна Морозова — преподаватель английского языка с международным сертификатом Cambridge CELTA, выпускница МГЛУ, опыт работы 9 лет.',
    requirements:
      'Базовые знания английского языка уровня A2–B1. Тетрадь или планшет для ведения конспектов дебатов.',
    learningOutcomes: [
      'Беглость речи и отсутствие страха допустить ошибку при общении на английском',
      'Навыки критического мышления и построения сильных аргументов (Claim-Data-Warrant)',
      'Значительное расширение словарного запаса по академическим и актуальным темам',
      'Опыт публичных выступлений и ведения этичной полемики на международном языке',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'Icebreakers & Speech Fluency',
        description:
          'Снятие языкового барьера, игры на спонтанную речь (Improv Games), активация разговорных клише.',
        hours: '6 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'The Art of Argumentation',
        description:
          'Структура аргумента PEEL (Point, Explanation, Evidence, Link), выявление логических ошибок в речи оппонента.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Global Topics & Modern Dilemmas',
        description:
          'Обсуждение актуальных кейсов: экология, социальные сети, искусственный интеллект, исследование космоса.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Parliamentary Debate Formats',
        description:
          'Освоение регламентов Всемирного школьного формата (WSDC) и формата Карла Поппера, подготовка речей за 15 минут.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Debate Championship',
        description:
          'Школьный турнир дебатов на английском языке с независимым судейством и награждением лучших спикеров.',
        hours: '8 ак. ч.',
      },
    ],
  },
  {
    id: 'act-6',
    title: 'Олимпиадная математика',
    category: 'Наука',
    description:
      'Нестандартные задачи, логика, комбинаторика и подготовка к Всероссийской олимпиаде.',
    teacherId: 'teacher-6',
    ageGroup: '8–12 лет (2–6 класс)',
    price: 2800,
    location: 'Кабинет 108',
    targetAudience:
      'Для любознательных школьников, которым тесно в рамках стандартной школьной программы по математике.',
    teacherBio:
      'Ольга Николаевна Васильева — почётный работник общего образования, эксперт жюри олимпиад школьников, автор методических пособий, педагогический стаж 20 лет.',
    requirements:
      'Тетрадь в крупную/мелкую клетку, цветные гелевые ручки, линейка и карандаш. Все сборники задач выдаются преподавателем.',
    learningOutcomes: [
      'Умение видеть скрытые закономерности и находить нестандартные пути решения',
      'Освоение классических олимпиадных методов: Дирихле, инварианты, принцип крайнего',
      'Развитие строгого логического и абстрактного мышления, математической зоркости',
      'Уверенность в решении задач олимпиад «Кенгуру», «Плюс», ВсОШ и поступлении в матклассы',
    ],
    syllabus: [
      {
        module: 'Модуль 1',
        title: 'Логика, взвешивания и переливания',
        description:
          'Рыцари и лжецы, таблицы истинности, задачи на переливания в сосудах и фальшивые монеты.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Комбинаторика и теория графов',
        description:
          'Правила сложения и умножения, перестановки, мосты Кенигсберга, вершины, рёбра и плоские графы.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Принцип Дирихле и раскраски',
        description:
          'Классический принцип кроликов и клеток, шахматные раскраски, доказательства невозможности действий.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Теория чисел и сюжетные ребусы',
        description:
          'Признаки делимости, остатки, простые числа, числовые ребусы и магические квадраты.',
        hours: '10 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Математическая регата и бои',
        description:
          'Командные математические игры, устная олимпиада, защита решений перед строгим жюри.',
        hours: '6 ак. ч.',
      },
    ],
  },
];

export const MOCK_ACTIVITY_GROUPS = [
  // Робототехника (2 группы: одна со свободными местами, вторая заполнена)
  {
    id: 'grp-1-1',
    activityId: 'act-1',
    name: 'Группа А (Начинающие)',
    capacity: 12,
    enrolledCount: 8,
    daysOfWeek: [1, 3], // Пн, Ср
    startTime: '15:30',
    endTime: '17:00',
  },
  {
    id: 'grp-1-2',
    activityId: 'act-1',
    name: 'Группа Б (Продвинутые)',
    capacity: 10,
    enrolledCount: 10, // Full
    daysOfWeek: [2, 4], // Вт, Чт
    startTime: '16:00',
    endTime: '17:30',
  },
  // Театр (1 группа, полностью заполнена -> проверка waitlist)
  {
    id: 'grp-2-1',
    activityId: 'act-2',
    name: 'Основная труппа',
    capacity: 15,
    enrolledCount: 15, // Fully booked!
    daysOfWeek: [2, 5], // Вт, Пт
    startTime: '16:00',
    endTime: '18:00',
  },
  // Шахматы (1 группа)
  {
    id: 'grp-3-1',
    activityId: 'act-3',
    name: 'Все уровни',
    capacity: 16,
    enrolledCount: 11,
    daysOfWeek: [3, 6], // Ср, Сб
    startTime: '15:00',
    endTime: '16:30',
  },
  // Волейбол (1 группа)
  {
    id: 'grp-4-1',
    activityId: 'act-4',
    name: 'Сборная секция',
    capacity: 14,
    enrolledCount: 9,
    daysOfWeek: [1, 4], // Пн, Чт
    startTime: '17:00',
    endTime: '18:30',
  },
  // Английский (1 группа)
  {
    id: 'grp-5-1',
    activityId: 'act-5',
    name: 'English Debates Group',
    capacity: 10,
    enrolledCount: 4,
    daysOfWeek: [2, 5], // Вт, Пт
    startTime: '15:00',
    endTime: '16:30',
  },
  // Олимпиадная математика (1 группа)
  {
    id: 'grp-6-1',
    activityId: 'act-6',
    name: 'Младшая лига',
    capacity: 12,
    enrolledCount: 9,
    daysOfWeek: [1, 5], // Пн, Пт
    startTime: '16:30',
    endTime: '18:00',
  },
];

/**
 * Merge raw activities, groups, and teachers into ready-to-display activity models
 */
export function combineCatalogData(rawActivities, rawGroups, rawTeachers) {
  const teacherMap = {};
  (rawTeachers || []).forEach((t) => {
    if (t?.id) teacherMap[t.id] = t.fullName || t.name;
  });

  const groupsByActivity = {};
  (rawGroups || []).forEach((g) => {
    if (!groupsByActivity[g.activityId]) {
      groupsByActivity[g.activityId] = [];
    }
    groupsByActivity[g.activityId].push(g);
  });

  return (rawActivities || []).map((act) => {
    const groups = groupsByActivity[act.id] || [];
    const totalCapacity = groups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
    const totalEnrolled = groups.reduce((acc, g) => acc + (Number(g.enrolledCount) || 0), 0);
    const remainingSpots = Math.max(0, totalCapacity - totalEnrolled);
    const isFull = totalCapacity > 0 && totalEnrolled >= totalCapacity;

    const teacherName =
      teacherMap[act.teacherId] ||
      MOCK_TEACHERS[act.teacherId]?.fullName ||
      act.teacherName ||
      'Преподаватель школы';

    return {
      ...act,
      groups,
      teacherName,
      totalCapacity,
      totalEnrolled,
      remainingSpots,
      isFull,
    };
  });
}

/**
 * Subscribe to real-time activities and activityGroups from Firestore,
 * with graceful fallback to mock data when Firestore collections are empty or offline.
 * @param {(activities: any[]) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeCatalog(onUpdate, onError) {
  let activitiesData = null;
  let groupsData = null;
  let teachersData = null;

  function pushCombined() {
    const acts = activitiesData && activitiesData.length > 0 ? activitiesData : MOCK_ACTIVITIES;
    const grps = groupsData && groupsData.length > 0 ? groupsData : MOCK_ACTIVITY_GROUPS;
    const tchrs =
      teachersData && teachersData.length > 0 ? teachersData : Object.values(MOCK_TEACHERS);

    const enriched = combineCatalogData(acts, grps, tchrs);
    onUpdate(enriched);
  }

  try {
    const unsubActivities = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snapshot) => {
        activitiesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Activities subscription fallback:', err.message);
        pushCombined();
      }
    );

    const unsubGroups = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snapshot) => {
        groupsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Groups subscription fallback:', err.message);
        pushCombined();
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        teachersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Teachers subscription fallback:', err.message);
        pushCombined();
      }
    );

    return () => {
      unsubActivities();
      unsubGroups();
      unsubUsers();
    };
  } catch (error) {
    console.warn('Firestore subscription failed, falling back to mock catalog:', error.message);
    pushCombined();
    if (onError) onError(error);
    return () => {};
  }
}
