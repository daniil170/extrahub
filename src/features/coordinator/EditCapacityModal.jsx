import { useState, useEffect } from 'react';
import { Modal, Button } from '../../shared/ui/index.js';

export function EditCapacityModal({ isOpen, onClose, group, onSave, isUpdating }) {
  const [capacity, setCapacity] = useState(group?.capacity || 15);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (group) {
      setCapacity(group.capacity || 15);
      setValidationError('');
    }
  }, [group]);

  if (!group) return null;

  const currentEnrolled = Number(group.enrolledCount) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(capacity);
    if (isNaN(num) || num < 1) {
      setValidationError('Вместимость должна быть не менее 1 места');
      return;
    }
    if (num < currentEnrolled) {
      setValidationError(
        `Внимание: в группе уже записано ${currentEnrolled} учеников. Вместимость не может быть меньше этого числа.`
      );
      return;
    }
    setValidationError('');
    onSave(num);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Изменить лимит мест группы" maxWidth="460px">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {group.activityTitle} — {group.name || 'Группа'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Текущая занятость: <strong>{currentEnrolled}</strong> учеников
          </div>
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

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Новая максимальная вместимость (кол-во мест):
          </label>
          <input
            type="number"
            min={currentEnrolled || 1}
            max={100}
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value);
              setValidationError('');
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '16px',
              fontWeight: 700,
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isUpdating}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={isUpdating}>
            {isUpdating ? 'Сохранение...' : 'Сохранить лимит'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
