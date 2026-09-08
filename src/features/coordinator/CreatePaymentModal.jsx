import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Badge } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';

export function CreatePaymentModal({
  isOpen,
  onClose,
  activities = [],
  groups = [],
  students = [],
  enrollments = [],
  initialMode = 'group',
  preselectedGroupId = null,
  onSubmitSingle,
  onSubmitGroup,
  isProcessing,
}) {
  const [mode, setMode] = useState(initialMode); // 'group' | 'single'
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [periodTitle, setPeriodTitle] = useState('Оплата за кружок (Октябрь 2026)');
  const [amount, setAmount] = useState(25000);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [validationError, setValidationError] = useState('');

  // Sync mode and preselected group when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'group');
      setValidationError('');
      if (preselectedGroupId) {
        setSelectedGroupId(preselectedGroupId);
        const grp = groups.find((g) => g.id === preselectedGroupId);
        if (grp?.activityId) {
          setSelectedActivityId(grp.activityId);
        }
      } else if (activities.length > 0 && !selectedActivityId) {
        setSelectedActivityId(activities[0].id);
      }
    }
  }, [isOpen, initialMode, preselectedGroupId, activities, groups, selectedActivityId]);

  // Available groups for selected activity
  const availableGroups = useMemo(() => {
    if (!selectedActivityId) return [];
    return groups.filter((g) => g.activityId === selectedActivityId);
  }, [groups, selectedActivityId]);

  // Keep selectedGroupId valid when activity changes
  useEffect(() => {
    if (availableGroups.length > 0) {
      if (!availableGroups.some((g) => g.id === selectedGroupId)) {
        setSelectedGroupId(availableGroups[0].id);
      }
    } else {
      setSelectedGroupId('');
    }
  }, [availableGroups, selectedGroupId]);

  // Update default amount when activity changes
  useEffect(() => {
    const act = activities.find((a) => a.id === selectedActivityId);
    if (act && typeof act.price === 'number') {
      setAmount(act.price);
    }
  }, [selectedActivityId, activities]);

  // Initial student selection
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Students enrolled in selected group
  const groupStudents = useMemo(() => {
    if (!selectedGroupId) return [];
    const activeGroupEnrolls = enrollments.filter(
      (e) => e.groupId === selectedGroupId && e.status === 'active'
    );
    const studentMap = {};
    students.forEach((s) => {
      studentMap[s.id] = s;
    });

    return activeGroupEnrolls.map((e) => {
      const s = studentMap[e.studentId] || {};
      return {
        id: e.studentId,
        fullName: e.studentName || s.fullName || `Ученик (${e.studentId})`,
        className: e.className || s.className || '',
      };
    });
  }, [enrollments, selectedGroupId, students]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedActivityId) {
      setValidationError('Пожалуйста, выберите кружок');
      return;
    }

    if (mode === 'group') {
      if (!selectedGroupId) {
        setValidationError('Пожалуйста, выберите группу для выставления счетов');
        return;
      }
      if (groupStudents.length === 0) {
        setValidationError(
          'В выбранной группе нет зачисленных учеников со статусом "active". Выставление невозможно.'
        );
        return;
      }
    }

    if (mode === 'single' && !selectedStudentId) {
      setValidationError('Пожалуйста, выберите ученика');
      return;
    }

    if (Number(amount) < 0) {
      setValidationError('Сумма не может быть отрицательной');
      return;
    }

    if (!dueDate) {
      setValidationError('Укажите крайний срок оплаты');
      return;
    }

    setValidationError('');

    if (mode === 'group') {
      onSubmitGroup({
        groupId: selectedGroupId,
        activityId: selectedActivityId,
        amount: Number(amount),
        dueDate,
        periodTitle: periodTitle.trim() || 'Оплата за кружок',
      });
    } else {
      onSubmitSingle({
        activityId: selectedActivityId,
        studentId: selectedStudentId,
        amount: Number(amount),
        dueDate,
        periodTitle: periodTitle.trim() || 'Оплата за кружок',
      });
    }
  };

  const totalGroupAmount = (Number(amount) || 0) * groupStudents.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'group' ? '👥 Выставление счетов группе кружка' : '👤 Индивидуальный счёт ученику'
      }
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('group')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: mode === 'group' ? 'var(--primary)' : 'transparent',
              color: mode === 'group' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: mode === 'group' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>👥 Всей группе (Рекомендуется)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('single')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: mode === 'single' ? 'var(--primary)' : 'transparent',
              color: mode === 'single' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: mode === 'single' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>👤 Одному ученику</span>
          </button>
        </div>

        {validationError && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid var(--danger)',
            }}
          >
            ⚠️ {validationError}
          </div>
        )}

        {/* Activity Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            1. Выберите кружок / секцию:
          </label>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.price === 0 ? 'Бесплатно' : formatCurrency(a.price)})
              </option>
            ))}
          </select>
        </div>

        {/* Group Selection (Group Mode) */}
        {mode === 'group' ? (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              2. Выберите группу кружка:
            </label>
            {availableGroups.length > 0 ? (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              >
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || 'Группа'} — {formatDaysOfWeek(g.daysOfWeek)} {g.startTime}–
                    {g.endTime}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                У выбранного кружка пока нет открытых групп
              </div>
            )}

            {/* List of Enrolled Students Preview */}
            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Ученики группы к начислению:
                </span>
                <Badge variant={groupStudents.length > 0 ? 'success' : 'default'}>
                  {groupStudents.length} зачислено
                </Badge>
              </div>

              {groupStudents.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {groupStudents.map((st) => (
                    <span
                      key={st.id}
                      style={{
                        fontSize: '12px',
                        padding: '3px 8px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      👤 {st.fullName} {st.className ? `(${st.className})` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  В этой группе пока нет активных зачисленных учеников
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Student Selection (Single Mode) */
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              2. Выберите ученика:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} {s.className ? `(${s.className})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Period / Purpose of Payment */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            3. Назначение счёта / Период:
          </label>
          <input
            type="text"
            value={periodTitle}
            onChange={(e) => setPeriodTitle(e.target.value)}
            placeholder="Например: Оплата за кружок (Октябрь 2026)"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Amount & Due Date */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              {mode === 'group' ? 'Сумма на 1 ученика (₸):' : 'Сумма к оплате (₸):'}
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Срок оплаты (до):
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Summary Card for Group Mode */}
        {mode === 'group' && (
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--primary-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Зачислено в группу:</span>
              <strong>{groupStudents.length} учеников</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Тариф на человека:</span>
              <strong>{formatCurrency(amount)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px dashed var(--border-color)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              <span>Итого к начислению по группе:</span>
              <span>{formatCurrency(totalGroupAmount)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isProcessing || (mode === 'group' && groupStudents.length === 0)}
          >
            {isProcessing
              ? 'Формирование...'
              : mode === 'group'
                ? `Сформировать ${groupStudents.length} счетов (${formatCurrency(totalGroupAmount)})`
                : `Выставить счёт (${formatCurrency(amount)})`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
