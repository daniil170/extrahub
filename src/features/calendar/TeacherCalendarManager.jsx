import { useState } from 'react';
import {
  Plus,
  Sword,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Modal, Badge, CoinIcon } from '../../shared/ui/index.js';
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_OUTCOME,
  BOSS_EVENT_CONFIG,
} from '../../entities/calendarEvent/model.js';
import { createClubEventCall, markEventOutcomeCall } from './api.js';

/**
 * Modal for creating special club events / Boss-events / exams
 */
export function CreateEventModal({
  isOpen,
  onClose,
  teacherGroups = [],
  teacherId,
  teacherName,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: EVENT_TYPES.BOSS_EVENT,
    groupId: teacherGroups[0]?.id || '',
    date: new Date().toISOString().substring(0, 10),
    startTime: '16:00',
    endTime: '17:30',
    location: 'Актовый зал / Главный корпус',
    isBossEvent: true,
    xpReward: BOSS_EVENT_CONFIG.DEFAULT_BOSS_XP,
    coinsReward: BOSS_EVENT_CONFIG.DEFAULT_BOSS_COINS,
    requiresRsvp: true,
    hasDeadline: false,
    deadlineDate: '',
    deadlineTime: '23:59',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (newType) => {
    const isBoss = newType === EVENT_TYPES.BOSS_EVENT;
    setFormData((prev) => ({
      ...prev,
      type: newType,
      isBossEvent: isBoss,
      xpReward: isBoss
        ? Math.max(prev.xpReward, BOSS_EVENT_CONFIG.MIN_BOSS_XP)
        : newType === EVENT_TYPES.EXAM
        ? 150
        : newType === EVENT_TYPES.COMPETITION
        ? 200
        : 50,
      coinsReward: isBoss ? BOSS_EVENT_CONFIG.DEFAULT_BOSS_COINS : 10,
      requiresRsvp: isBoss || newType === EVENT_TYPES.COMPETITION || newType === EVENT_TYPES.EXAM,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Пожалуйста, введите название события.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedGroup = teacherGroups.find((g) => g.id === formData.groupId);
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();
      
      let deadlineDateTime = null;
      if (formData.hasDeadline && formData.deadlineDate) {
        deadlineDateTime = new Date(`${formData.deadlineDate}T${formData.deadlineTime}:00`).toISOString();
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        groupId: formData.groupId || null,
        groupName: selectedGroup?.name || '',
        activityId: selectedGroup?.activityId || null,
        activityTitle: selectedGroup?.activityTitle || selectedGroup?.name || '',
        teacherId: teacherId || '',
        teacherName: teacherName || 'Преподаватель',
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location.trim() || 'Главный корпус',
        isBossEvent: formData.isBossEvent,
        xpReward: Number(formData.xpReward) || 0,
        coinsReward: Number(formData.coinsReward) || 0,
        requiresRsvp: Boolean(formData.requiresRsvp),
        deadlineTime: deadlineDateTime,
        targetAudience: formData.groupId ? 'group' : 'all',
      };

      await createClubEventCall(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка создания события');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать специальное событие" size="lg">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Type selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Тип события
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { type: EVENT_TYPES.BOSS_EVENT, label: 'Специальное событие', desc: 'Хакатон / финальный проект' },
              { type: EVENT_TYPES.EXAM, label: 'Экзамен / Зачёт', desc: 'Проверка знаний' },
              { type: EVENT_TYPES.COMPETITION, label: 'Хакатон / Турнир', desc: 'Олимпиада / соревнование' },
              { type: EVENT_TYPES.DEADLINE, label: 'Дедлайн', desc: 'Сдача проекта' },
              { type: EVENT_TYPES.LESSON, label: 'Занятие', desc: 'Спец-урок' },
            ].map((opt) => {
              const active = formData.type === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleTypeChange(opt.type)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: active
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border-color)',
                    backgroundColor: active
                      ? 'rgba(59, 130, 246, 0.08)'
                      : 'var(--bg-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Название события *
          </label>
          <input
            type="text"
            required
            placeholder="например, Финал Хакатона Роботов: Битва с Боссом"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Group & Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Целевая группа
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Для всех групп / всей школы</option>
              {teacherGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Место проведения
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Date & Times */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Дата проведения
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Начало
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Окончание
            </label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Rewards (XP & Coins) */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: formData.isBossEvent ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-secondary)',
            border: formData.isBossEvent ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} color="var(--primary)" />
            <span>Награды за успешное участие / прохождение</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Опыт (XP)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Монеты школы (<CoinIcon size={18} />)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={formData.coinsReward}
                onChange={(e) => setFormData({ ...formData, coinsReward: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Описание / Правила участия
          </label>
          <textarea
            rows={3}
            placeholder="Опишите регламент, требования к подготовке и условия получения награды..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '13.5px',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Создание...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Создать событие</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal for grading event outcome and awarding points
 */
export function EventOutcomeModal({
  isOpen,
  onClose,
  event,
  studentResponses = [],
  enrolledStudents = [],
  onSuccess,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [outcome, setOutcome] = useState('attended');
  const [grade, setGrade] = useState('Отлично (Зачёт)');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!event) return null;

  // Build combined list of students
  const studentList = enrolledStudents.length > 0 ? enrolledStudents : studentResponses.map((r) => ({
    id: r.studentId,
    name: r.studentName,
  }));

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Выберите ученика для проставления результата');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const studentObj = studentList.find((s) => s.id === selectedStudentId);
      const res = await markEventOutcomeCall({
        eventId: event.id,
        studentId: selectedStudentId,
        studentName: studentObj?.name || 'Ученик',
        outcome,
        grade,
        feedback,
      });

      setSuccessMsg(`Результат сохранен! ${outcome === 'attended' && event.xpReward ? `Начислено +${event.xpReward} XP` : ''}`);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения результата');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Итоги события: ${event.title}`} size="md">
      <form onSubmit={handleGradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {event.isBossEvent && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#7c3aed',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            <span>Подтверждение участия автоматически начислит +{event.xpReward} XP и +{event.coinsReward} монет в профиль ученика!</span>
          </div>
        )}

        {error && (
          <div style={{ color: '#dc2626', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ color: '#059669', fontSize: '13px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
            {successMsg}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Выберите ученика *
          </label>
          <select
            required
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              const existingResp = studentResponses.find((r) => r.studentId === e.target.value);
              if (existingResp) {
                setOutcome(existingResp.outcome === 'absent' ? 'absent' : 'attended');
                setGrade(existingResp.grade || 'Отлично (Зачёт)');
                setFeedback(existingResp.feedback || '');
              }
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
            }}
          >
            <option value="">-- Выберите ученика --</option>
            {studentList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        </div>

        {/* Outcome Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Результат участия
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setOutcome('attended')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: outcome === 'attended' ? '2px solid #10b981' : '1px solid var(--border-color)',
                backgroundColor: outcome === 'attended' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                fontWeight: 700,
                color: outcome === 'attended' ? '#059669' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Участвовал / Сдал
            </button>
            <button
              type="button"
              onClick={() => setOutcome('absent')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: outcome === 'absent' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: outcome === 'absent' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)',
                fontWeight: 700,
                color: outcome === 'absent' ? '#dc2626' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Не явился
            </button>
          </div>
        </div>

        {/* Grade / Award label */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Оценка / Зачет
          </label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="например, 1 место, Зачет, Отлично"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Teacher Feedback */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Комментарий преподавателя
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Отличная защита проекта, продемонстрировал глубокие знания..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Закрыть
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Сохранить результат'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Teacher Events & Boss-Events Management Tab
 */
export function TeacherCalendarManager({
  teacherId,
  teacherName,
  teacherGroups = [],
  events = [],
  eventResponses = [],
  onRefresh,
}) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [outcomeModalEvent, setOutcomeModalEvent] = useState(null);

  const teacherEvents = (events || []).filter(
    (e) => !e.isVirtual && (e.teacherId === teacherId || !e.teacherId || e.targetAudience === 'all')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Card */}
      <Card
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1.5px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 'var(--radius-lg, 16px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={26} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Специальные события, экзамены и календарь
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Назначайте проектные хакатоны, олимпиады и экзамены с начислением XP и школьных монет
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            <span>+ Создать событие</span>
          </Button>
        </div>
      </Card>

      {/* Events List */}
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            Запланированные события ({teacherEvents.length})
          </h4>
        </div>

        {teacherEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>У вас пока нет созданных специальных событий или экзаменов.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teacherEvents.map((ev) => {
              const responses = eventResponses.filter((r) => r.eventId === ev.id);
              const attendedCount = responses.filter((r) => r.outcome === 'attended').length;
              const acceptedCount = responses.filter((r) => r.status === 'accepted').length;

              return (
                <div
                  key={ev.id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: ev.isBossEvent ? '1.5px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-color)',
                    backgroundColor: ev.isBossEvent ? 'rgba(139, 92, 246, 0.03)' : 'var(--bg-surface)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {ev.isBossEvent ? (
                        <Badge variant="purple" size="sm">Спец-событие</Badge>
                      ) : (
                        <Badge variant="blue" size="sm">{EVENT_TYPE_LABELS[ev.type] || 'Событие'}</Badge>
                      )}

                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {ev.groupName ? `Группа: ${ev.groupName}` : 'Для всей школы'}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ev.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {new Date(ev.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}{' '}
                        {new Date(ev.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        +{ev.xpReward} XP / +{ev.coinsReward} монет
                      </span>

                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} />
                        RSVP: {acceptedCount} | Зачтено: {attendedCount}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setOutcomeModalEvent(ev)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Award size={14} />
                      <span>Итоги и оценки</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        teacherGroups={teacherGroups}
        teacherId={teacherId}
        teacherName={teacherName}
        onSuccess={onRefresh}
      />

      {outcomeModalEvent && (
        <EventOutcomeModal
          isOpen={Boolean(outcomeModalEvent)}
          onClose={() => setOutcomeModalEvent(null)}
          event={outcomeModalEvent}
          studentResponses={eventResponses.filter((r) => r.eventId === outcomeModalEvent.id)}
          enrolledStudents={[]}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

