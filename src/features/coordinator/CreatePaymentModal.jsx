import { useState, useEffect } from 'react';
import { Modal, Button } from '../../shared/ui/index.js';

export function CreatePaymentModal({
  isOpen,
  onClose,
  activities = [],
  students = [],
  onSubmitSingle,
  isProcessing,
}) {
  const [mode, setMode] = useState('single'); // 'single' | 'group'
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState(3500);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [validationError, setValidationError] = useState('');

  // Update default amount when activity changes
  useEffect(() => {
    const act = activities.find((a) => a.id === selectedActivityId);
    if (act && typeof act.price === 'number') {
      setAmount(act.price);
    }
  }, [selectedActivityId, activities]);

  useEffect(() => {
    if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [activities, students, selectedActivityId, selectedStudentId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedActivityId) {
      setValidationError('Пожалуйста, выберите кружок');
      return;
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
      setValidationError('Укажите срок оплаты');
      return;
    }

    setValidationError('');

    if (mode === 'single') {
      onSubmitSingle({
        activityId: selectedActivityId,
        studentId: selectedStudentId,
        amount: Number(amount),
        dueDate,
      });
    } else {
      // In group mode, issue to all active students
      students.forEach((st) => {
        onSubmitSingle({
          activityId: selectedActivityId,
          studentId: st.id,
          amount: Number(amount),
          dueDate,
        });
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Выставить счёт на оплату" maxWidth="500px">
      <form onSubmit={handleSubmit}>
        {/* Mode Selector */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('single')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: mode === 'single' ? 'var(--primary)' : 'transparent',
              color: mode === 'single' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: mode === 'single' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👤 Одному ученику
          </button>
          <button
            type="button"
            onClick={() => setMode('group')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: mode === 'group' ? 'var(--primary)' : 'transparent',
              color: mode === 'group' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: mode === 'group' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👥 Всей группе кружка
          </button>
        </div>

        {validationError && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {validationError}
          </div>
        )}

        {/* Activity Selection */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Кружок / Направление:
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
                {a.title} ({a.price === 0 ? 'Бесплатно' : `${a.price} ₽`})
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection (if single mode) */}
        {mode === 'single' ? (
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Ученик:
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
        ) : (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12.5px',
              color: 'var(--primary)',
              marginBottom: '14px',
            }}
          >
            ℹ️ Счета будут сформированы автоматически для всех активных учеников выбранного кружка (
            {students.length} учеников).
          </div>
        )}

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
              Сумма к оплате (₽):
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '15px',
                fontWeight: 700,
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

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isProcessing}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={isProcessing}>
            {isProcessing
              ? 'Формирование...'
              : mode === 'single'
                ? 'Выставить счёт'
                : 'Выставить всей группе'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
