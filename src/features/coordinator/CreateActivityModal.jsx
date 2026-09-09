import { useState } from 'react';
import { Modal, Button } from '../../shared/ui/index.js';

const CATEGORIES = [
  'Технологии',
  'Искусство',
  'Спорт',
  'Языки',
  'Наука',
  'Другое',
];

const DEFAULT_MODULES = [
  {
    module: 'Модуль 1',
    title: 'Введение и основы направления',
    description: 'Базовые понятия, инструменты, техника безопасности и первые шаги.',
    hours: '6 ак. ч.',
  },
  {
    module: 'Модуль 2',
    title: 'Практические основы и базовые кейсы',
    description: 'Отработка навыков на типовых задачах под кураторством преподавателя.',
    hours: '8 ак. ч.',
  },
  {
    module: 'Модуль 3',
    title: 'Углубленная индивидуальная работа',
    description: 'Разбор сложных сценариев, решение нестандартных задач и эксперименты.',
    hours: '10 ак. ч.',
  },
  {
    module: 'Модуль 4',
    title: 'Командный проект и реализация',
    description: 'Командная работа над реальным проектом от задумки до прототипа.',
    hours: '12 ак. ч.',
  },
  {
    module: 'Модуль 5',
    title: 'Итоговая защита и презентация',
    description: 'Защита готовых проектов перед родителями и жюри, вручение сертификатов.',
    hours: '6 ак. ч.',
  },
];

const DEFAULT_OUTCOMES = [
  'Освоение ключевых прикладных навыков и терминологии направления',
  'Развитие творческого, критического и проектного мышления',
  'Уверенная работа в команде и опыт публичной защиты результатов',
];

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
];

export function CreateActivityModal({ isOpen, onClose, onSave, isCreating }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Технологии');
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('10–14 лет (5–8 класс)');
  const [price, setPrice] = useState(24000);
  const [location, setLocation] = useState('Кабинет 204');
  const [teacherName, setTeacherName] = useState('Алия Сериковна Ахметова');
  const [teacherBio, setTeacherBio] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [requirements, setRequirements] = useState('');

  // 5 Modules
  const [syllabus, setSyllabus] = useState(DEFAULT_MODULES);

  // Learning Outcomes (min 3)
  const [outcomes, setOutcomes] = useState(DEFAULT_OUTCOMES);
  const [newOutcome, setNewOutcome] = useState('');

  // Optional: Create initial group right away
  const [createInitialGroup, setCreateInitialGroup] = useState(true);
  const [groupName, setGroupName] = useState('Группа 1 (Основная)');
  const [groupCapacity, setGroupCapacity] = useState(15);
  const [groupDays, setGroupDays] = useState([1, 3]);
  const [groupStartTime, setGroupStartTime] = useState('15:30');
  const [groupEndTime, setGroupEndTime] = useState('17:00');

  // Validation errors
  const [errors, setErrors] = useState({});

  const handleFillDemoData = () => {
    setTitle('3D-моделирование и цифровое производство');
    setCategory('Технологии');
    setDescription(
      'Практический курс проектирования трёхмерных объектов в Blender и Fusion 360 с печатью собственных изделий на школьном 3D-принтере.'
    );
    setAgeGroup('11–16 лет (6–10 класс)');
    setPrice(28000);
    setLocation('Кабинет 308 (FabLab)');
    setTeacherName('Нурлан Бауржанович Садыков');
    setTeacherBio(
      'Нурлан Бауржанович — инженер-конструктор и сертифицированный тренер по промышленному дизайну со стажем более 7 лет.'
    );
    setTargetAudience('Для увлечённых ребят, мечтающих создавать инженерные прототипы и объекты виртуальной реальности.');
    setRequirements('Специальных навыков не требуется. Ноутбуки и 3D-принтеры предоставляются школьной лабораторией.');
    setSyllabus([
      {
        module: 'Модуль 1',
        title: 'Основы полигонального и сплайнового 3D-моделирования',
        description: 'Координатная сетка, примитивы, полигоны, фаски и базовые операции вращения и выдавливания.',
        hours: '6 ак. ч.',
      },
      {
        module: 'Модуль 2',
        title: 'Параметрическое проектирование в САПР',
        description: 'Создание точных чертежей, работа с сопряжениями, резьбами и сборочными узлами деталей.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 3',
        title: 'Подготовка к аддитивному производству и слайсинг',
        description: 'Знакомство с Cura/PrusaSlicer, выбор плотности заполнения, поддержек и температурных режимов филамента.',
        hours: '8 ак. ч.',
      },
      {
        module: 'Модуль 4',
        title: 'Печать на 3D-принтерах и пост-обработка',
        description: 'Калибровка рабочего стола принтера, запуск печати изделий из PLA/PETG и шлифовка моделей.',
        hours: '12 ак. ч.',
      },
      {
        module: 'Модуль 5',
        title: 'Финальный кейс-проект и выставка',
        description: 'Создание полезного школьного устройства, презентация проекта родителям и вручение напечатанных изделий.',
        hours: '6 ак. ч.',
      },
    ]);
    setOutcomes([
      'Уверенное владение интерфейсом и инструментами 3D-моделирования',
      'Понимание физики аддитивного производства и настройка слайсеров',
      'Создание реальных физических деталей и прототипов с нуля',
      'Защита собственного инженерного проекта перед аудиторией',
    ]);
    setCreateInitialGroup(true);
    setGroupName('Группа FabLab-1');
    setGroupCapacity(14);
    setGroupDays([2, 4]);
    setGroupStartTime('16:00');
    setGroupEndTime('17:30');
    setErrors({});
  };

  const handleModuleChange = (index, field, value) => {
    setSyllabus((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddOutcome = () => {
    if (!newOutcome.trim()) return;
    setOutcomes((prev) => [...prev, newOutcome.trim()]);
    setNewOutcome('');
    if (errors.outcomes) {
      setErrors((prev) => ({ ...prev, outcomes: null }));
    }
  };

  const handleRemoveOutcome = (index) => {
    setOutcomes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleGroupDay = (dayId) => {
    setGroupDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Пожалуйста, укажите название кружка';
    }
    if (!description.trim()) {
      newErrors.description = 'Пожалуйста, введите описание кружка';
    }
    if (price < 0 || isNaN(Number(price))) {
      newErrors.price = 'Стоимость должна быть неотрицательным числом (0 = бесплатно)';
    }
    if (!teacherName.trim()) {
      newErrors.teacherName = 'Укажите ФИО преподавателя';
    }
    if (outcomes.length < 3) {
      newErrors.outcomes = 'Добавьте минимум 3 ключевых результата обучения';
    }

    if (createInitialGroup) {
      if (!groupName.trim()) {
        newErrors.groupName = 'Укажите название группы';
      }
      if (Number(groupCapacity) < 1) {
        newErrors.groupCapacity = 'Вместимость группы должна быть не менее 1 места';
      }
      if (groupDays.length === 0) {
        newErrors.groupDays = 'Выберите хотя бы один день недели для занятий';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const activityData = {
      title: title.trim(),
      category,
      description: description.trim(),
      ageGroup: ageGroup.trim() || '7–17 лет',
      price: Number(price) || 0,
      location: location.trim() || 'Школьный корпус',
      teacherName: teacherName.trim(),
      teacherBio: teacherBio.trim(),
      targetAudience: targetAudience.trim(),
      requirements: requirements.trim(),
      syllabus,
      learningOutcomes: outcomes,
    };

    let initialGroupData = null;
    if (createInitialGroup) {
      initialGroupData = {
        name: groupName.trim(),
        capacity: Number(groupCapacity) || 15,
        daysOfWeek: groupDays,
        startTime: groupStartTime,
        endTime: groupEndTime,
      };
    }

    await onSave(activityData, initialGroupData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ Создать новый кружок или секцию"
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit}>
        {/* Header toolbar with Demo Auto-fill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-subtle)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            💡 Для быстрого показа на школьном демо:
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleFillDemoData}
            style={{ fontWeight: 600 }}
          >
            🚀 Заполнить демо-данными
          </Button>
        </div>

        {/* General Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          {/* Title */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Название кружка <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="Например: 3D-моделирование и прототипирование"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: errors.title ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            {errors.title && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Категория направления
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Age Group */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Возрастная группа
            </label>
            <input
              type="text"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              placeholder="Например: 10–14 лет (5–8 класс)"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Price (in Tenge) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Стоимость в месяц (₸) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
              }}
              placeholder="0 = Бесплатно"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: errors.price ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            {errors.price && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.price}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Место проведения (Кабинет/Зал)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Например: Кабинет 308 (IT-лаборатория)"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Teacher Name */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              ФИО преподавателя <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => {
                setTeacherName(e.target.value);
                if (errors.teacherName) setErrors((prev) => ({ ...prev, teacherName: null }));
              }}
              placeholder="Например: Садыков Нурлан Бауржанович"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: errors.teacherName ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            {errors.teacherName && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.teacherName}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '5px',
            }}
          >
            Подробное описание курса <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            placeholder="Опишите цели, основные темы и формат занятий..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: errors.description ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          {errors.description && (
            <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
              {errors.description}
            </div>
          )}
        </div>

        {/* Syllabus / 5 Modules Accordion / List */}
        <div
          style={{
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              📚 Программа курса (5 учебных модулей)
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Отобразится в деталях карточки каталога
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {syllabus.map((mod, idx) => (
              <div
                key={mod.module || idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      whiteSpace: 'nowrap',
                      paddingTop: '6px',
                    }}
                  >
                    {mod.module}:
                  </span>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => handleModuleChange(idx, 'title', e.target.value)}
                    placeholder="Название модуля"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <input
                    type="text"
                    value={mod.hours}
                    onChange={(e) => handleModuleChange(idx, 'hours', e.target.value)}
                    placeholder="Часы"
                    style={{
                      width: '75px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                    }}
                  />
                </div>
                <textarea
                  rows="2"
                  value={mod.description}
                  onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}
                  placeholder="Краткое содержание модуля..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12.5px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Learning Outcomes */}
        <div
          style={{
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              🎯 Результаты обучения (минимум 3 пункта)
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Пунктов: {outcomes.length}
            </span>
          </div>

          {errors.outcomes && (
            <div
              style={{
                color: 'var(--danger)',
                fontSize: '12px',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              ⚠️ {errors.outcomes}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {outcomes.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span>
                  <span>{item}</span>
                </div>
                {outcomes.length > 3 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOutcome(idx)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px',
                    }}
                    title="Удалить пункт"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Outcome Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOutcome();
                }
              }}
              placeholder="Добавить результат обучения..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddOutcome}
              disabled={!newOutcome.trim()}
            >
              + Добавить
            </Button>
          </div>
        </div>

        {/* Initial Group Option */}
        <div
          style={{
            marginBottom: '22px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            backgroundColor: createInitialGroup ? 'var(--primary-light)' : 'var(--bg-surface)',
            transition: 'background-color 0.2s ease',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--text-primary)',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={createInitialGroup}
              onChange={(e) => setCreateInitialGroup(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>Создать стартовую учебную группу сразу (рекомендуется для демо)</span>
          </label>

          {createInitialGroup && (
            <div
              style={{
                marginTop: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  Название группы
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.groupName
                      ? '1.5px solid var(--danger)'
                      : '1px solid var(--border-color)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  Лимит мест
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={groupCapacity}
                  onChange={(e) => setGroupCapacity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.groupCapacity
                      ? '1.5px solid var(--danger)'
                      : '1px solid var(--border-color)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Days of week */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Дни занятий:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS.map((d) => {
                    const isSelected = groupDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleGroupDay(d.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected
                            ? '2px solid var(--primary)'
                            : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary)' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time */}
              <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={groupStartTime}
                    onChange={(e) => setGroupStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={groupEndTime}
                    onChange={(e) => setGroupEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={isCreating}>
            {isCreating ? 'Создание кружка...' : '✓ Создать и опубликовать кружок'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
