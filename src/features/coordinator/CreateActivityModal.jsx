import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { BookOpen, Target, AlertTriangle, Check } from 'lucide-react';
import { db } from '../../app/config/firebase.js';
import { Modal, Button } from '../../shared/ui/index.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

const CATEGORIES = [
  'Технологии',
  'Искусство',
  'Спорт',
  'Языки',
  'Наука',
  'Другое',
];

const SUBJECTS = [
  'Информатика',
  'Математика',
  'Физика',
  'Химия',
  'Биология',
  'Английский язык',
  'Робототехника',
  'География',
];

const DEFAULT_EMPTY_MODULES = [
  { module: 'Модуль 1', title: '', description: '', hours: '' },
  { module: 'Модуль 2', title: '', description: '', hours: '' },
  { module: 'Модуль 3', title: '', description: '', hours: '' },
  { module: 'Модуль 4', title: '', description: '', hours: '' },
  { module: 'Модуль 5', title: '', description: '', hours: '' },
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
  const [activityType, setActivityType] = useState('circle'); // 'circle' | 'club' | 'olympic_reserve'
  const [subject, setSubject] = useState('Информатика');
  const [allowedClasses, setAllowedClasses] = useState([7, 8, 9, 10, 11]);
  const [allowedShifts, setAllowedShifts] = useState(() => schoolConfig.shifts.map((s) => s.id));
  const [requiresExam, setRequiresExam] = useState(false);
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('10–14 лет (5–8 класс)');
  const [price, setPrice] = useState(24000);
  const [location, setLocation] = useState('Кабинет 204');
  const [teacherId, setTeacherId] = useState('');
  const [teachersList, setTeachersList] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [teacherBio, setTeacherBio] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setTeachersList(list);
          setTeacherId(list[0].id);
          setTeacherName(list[0].fullName || list[0].displayName || list[0].email || 'Преподаватель');
        } else {
          const fallbackList = [
            { id: 'teacher-1', fullName: 'Алия Сериковна Ахметова', email: 'aliya.akhmetova@school.kz' },
            { id: 'teacher-2', fullName: 'Серик Сакенович Нурпеисов', email: 'serik.nurpeisov@school.kz' },
            { id: 'teacher-3', fullName: 'Данияр Бауржанович Омаров', email: 'daniyar.omarov@school.kz' },
            { id: 'teacher-4', fullName: 'Динара Маратовна Касымова', email: 'dinara.kassymova@school.kz' },
          ];
          setTeachersList(fallbackList);
          setTeacherId(fallbackList[0].id);
          setTeacherName(fallbackList[0].fullName);
        }
      } catch (err) {
        console.warn('Could not fetch teachers list, using default list:', err);
        const fallbackList = [
          { id: 'teacher-1', fullName: 'Алия Сериковна Ахметова', email: 'aliya.akhmetova@school.kz' },
          { id: 'teacher-2', fullName: 'Серик Сакенович Нурпеисов', email: 'serik.nurpeisov@school.kz' },
          { id: 'teacher-3', fullName: 'Данияр Бауржанович Омаров', email: 'daniyar.omarov@school.kz' },
          { id: 'teacher-4', fullName: 'Динара Маратовна Касымова', email: 'dinara.kassymova@school.kz' },
        ];
        setTeachersList(fallbackList);
        setTeacherId(fallbackList[0].id);
        setTeacherName(fallbackList[0].fullName);
      }
    }
    fetchTeachers();
  }, []);

  // 5 Modules (Optional)
  const [syllabus, setSyllabus] = useState(DEFAULT_EMPTY_MODULES);

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
    if (!teacherId || !teacherId.trim()) {
      newErrors.teacherId = 'Выберите преподавателя из списка';
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

    const cleanedSyllabus = syllabus
      .filter((m) => Boolean(m.title?.trim() || m.description?.trim()))
      .map((m) => ({
        module: m.module || '',
        title: (m.title || '').trim(),
        description: (m.description || '').trim(),
        hours: (m.hours || '').trim(),
      }));

    const activityData = {
      title: title.trim(),
      category,
      type: activityType,
      subject: activityType === 'olympic_reserve' ? subject.trim() : '',
      allowedClasses: allowedClasses.map(Number),
      allowedShifts: allowedShifts.map(Number),
      requiresExam: Boolean(requiresExam),
      description: description.trim(),
      ageGroup: ageGroup.trim() || `${allowedClasses.join(', ')} классы`,
      price: Number(price) || 0,
      location: location.trim() || 'Школьный корпус',
      teacherId: teacherId.trim(),
      teacherName: teacherName.trim() || 'Преподаватель школы',
      teacherBio: teacherBio.trim(),
      targetAudience: targetAudience.trim(),
      requirements: requirements.trim(),
      syllabus: cleanedSyllabus,
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
        type: activityType,
        requiresExam: Boolean(requiresExam),
        allowedClasses: allowedClasses.map(Number),
        allowedShifts: allowedShifts.map(Number),
        teacherId: teacherId.trim(),
      };
    }

    await onSave(activityData, initialGroupData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать новый кружок или секцию"
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit}>
        {/* General Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          {/* Activity Type Selection */}
          <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Тип школьной программы <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActivityType('circle')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${activityType === 'circle' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: activityType === 'circle' ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-primary)',
                  color: activityType === 'circle' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Обычный кружок (секция)</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityType('club')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${activityType === 'club' ? '#10b981' : 'var(--border-color)'}`,
                  backgroundColor: activityType === 'club' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
                  color: activityType === 'club' ? '#10b981' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Клуб</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityType('olympic_reserve')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${activityType === 'olympic_reserve' ? 'var(--accent-coral, #f97316)' : 'var(--border-color)'}`,
                  backgroundColor: activityType === 'olympic_reserve' ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-primary)',
                  color: activityType === 'olympic_reserve' ? 'var(--accent-coral, #f97316)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Олимпийский резерв</span>
              </button>
            </div>
          </div>

          {/* Subject (Only if Olympic Reserve) */}
          {activityType === 'olympic_reserve' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Школьный предмет олимпийского резерва <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Allowed Classes (5 - 11) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Доступные классы (5–11)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAllowedClasses([5, 6, 7, 8, 9, 10, 11])}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  Все (5–11)
                </button>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <button
                  type="button"
                  onClick={() => setAllowedClasses([5, 6, 7, 8, 9])}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  5–9 кл.
                </button>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <button
                  type="button"
                  onClick={() => setAllowedClasses([10, 11])}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  10–11 кл.
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[5, 6, 7, 8, 9, 10, 11].map((cls) => {
                const checked = allowedClasses.includes(cls);
                return (
                  <label
                    key={cls}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: checked ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-primary)',
                      color: checked ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: checked ? 600 : 400,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setAllowedClasses((prev) =>
                          prev.includes(cls)
                            ? prev.filter((c) => c !== cls)
                            : [...prev, cls].sort((a, b) => a - b)
                        );
                      }}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>{cls} кл.</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Allowed Shifts & Exam Required */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Доступные смены
            </label>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', height: '40px', flexWrap: 'wrap' }}>
              {schoolConfig.shifts.map((shiftObj) => (
                <label
                  key={shiftObj.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={allowedShifts.includes(shiftObj.id)}
                    onChange={() => {
                      setAllowedShifts((prev) =>
                        prev.includes(shiftObj.id)
                          ? prev.filter((s) => s !== shiftObj.id)
                          : [...prev, shiftObj.id].sort()
                      );
                    }}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>{shiftObj.name || `${shiftObj.id} смена`}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Вступительный экзамен
            </label>
            <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                <input
                  type="checkbox"
                  checked={requiresExam}
                  onChange={(e) => setRequiresExam(e.target.checked)}
                  style={{ width: '17px', height: '17px', accentColor: 'var(--danger)' }}
                />
                <span style={{ fontWeight: requiresExam ? 600 : 400, color: requiresExam ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {requiresExam ? 'Нужен вступительный экзамен' : 'Свободная запись (без экзамена)'}
                </span>
              </label>
            </div>
          </div>

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

          {/* Teacher Selection */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Назначить преподавателя из системы <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => {
                const selId = e.target.value;
                setTeacherId(selId);
                const found = teachersList.find((t) => t.id === selId);
                if (found) {
                  setTeacherName(found.fullName || found.displayName || found.email || '');
                } else {
                  setTeacherName('');
                }
                if (errors.teacherId) setErrors((prev) => ({ ...prev, teacherId: null }));
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: errors.teacherId ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- Выберите преподавателя --</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name || t.displayName || t.email} {t.email ? `(${t.email})` : ''}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.teacherId}
              </div>
            )}
            {teacherName && teacherId && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                Выбранный преподаватель: <strong style={{ color: 'var(--text-primary)' }}>{teacherName}</strong>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--primary)" />
              <span>Программа курса (опционально)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Заполните от 0 до 5 модулей при наличии
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="var(--primary)" />
              <span>Результаты обучения (минимум 3 пункта)</span>
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={14} />
              <span>{errors.outcomes}</span>
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
                  <Check size={14} color="var(--primary)" />
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
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
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
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
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
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
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
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
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
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
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
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isCreating ? (
              'Создание кружка...'
            ) : (
              <>
                <Check size={15} />
                <span>Создать и опубликовать кружок</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
