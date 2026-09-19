import { useState, useEffect } from 'react';
import { Award, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal, Button, Badge, Spinner } from '../../shared/ui/index.js';
import { awardSpecialRecognitionCall, fetchTeacherDailyRecognitionQuota } from './api.js';

const PRESET_AMOUNTS = [25, 50, 100, 150];
const PRESET_REASONS = [
  'Победа в олимпиаде / конкурсе',
  'Отличная активность и лидерство на занятии',
  'Успешная защита творческого проекта',
  'Помощь товарищам по команде',
  'Идеальное решение нестандартной задачи',
];

/**
 * Teacher Modal to award special recognition XP to a student
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {Object} props.student
 * @param {string} props.student.id
 * @param {string} props.student.fullName
 * @param {string} [props.student.className]
 * @param {string} props.groupId
 * @param {() => void} [props.onSuccess]
 */
export function AwardRecognitionModal({
  isOpen,
  onClose,
  student,
  groupId,
  onSuccess,
}) {
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');
  const [customAmount, setCustomAmount] = useState(false);
  const [quota, setQuota] = useState({ usedToday: 0, remainingToday: 5, maxDaily: 5 });
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && groupId) {
      setLoadingQuota(true);
      setError('');
      setSuccessMsg('');
      fetchTeacherDailyRecognitionQuota(groupId)
        .then((q) => setQuota(q))
        .catch(() => {})
        .finally(() => setLoadingQuota(false));
    }
  }, [isOpen, groupId]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!student?.id || !groupId) return;
    if (!reason.trim()) {
      setError('Пожалуйста, укажите причину награждения');
      return;
    }
    if (amount <= 0 || amount > 500) {
      setError('Сумма награды должна быть от 1 до 500 XP');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await awardSpecialRecognitionCall({
        studentId: student.id,
        groupId,
        amount: Number(amount),
        reason: reason.trim(),
      });

      setSuccessMsg(`Ученику ${student.fullName} успешно начислено +${amount} XP!`);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setReason('');
        setAmount(50);
        setSuccessMsg('');
      }, 1800);
    } catch (err) {
      setError(err.message || 'Ошибка начисления награды');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Отметить ученика за особые успехи"
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Recipient Header */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Получатель награды
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {student?.fullName || 'Ученик'}
            </div>
            {student?.className && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Класс: {student.className}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Дневной лимит группы</div>
            <div style={{ marginTop: '2px' }}>
              {loadingQuota ? (
                <Spinner size="sm" />
              ) : (
                <Badge variant={quota.remainingToday > 0 ? 'success' : 'danger'}>
                  Осталось: {quota.remainingToday} из {quota.maxDaily}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Amount Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Количество очков опыта (XP):
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setAmount(val);
                  setCustomAmount(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '60px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: amount === val && !customAmount ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: amount === val && !customAmount ? 'var(--primary-light)' : 'var(--bg-surface)',
                  color: amount === val && !customAmount ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                +{val} XP
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomAmount(true)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: customAmount ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: customAmount ? 'var(--primary-light)' : 'var(--bg-surface)',
                color: customAmount ? 'var(--primary)' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Другое...
            </button>
          </div>

          {customAmount && (
            <div style={{ marginTop: '8px' }}>
              <input
                type="number"
                min="1"
                max="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Введите сумму XP (от 1 до 500)"
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
          )}
        </div>

        {/* Reason Input & Quick Presets */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Причина награждения (за что выдаётся):
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: Победа в дебатах, блестящий ответ у доски..."
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '13.5px',
              boxSizing: 'border-box',
              marginBottom: '8px',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Быстрые шаблоны:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || quota.remainingToday <= 0 || Boolean(successMsg)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              'Начисление...'
            ) : (
              <>
                <Award size={15} />
                <span>Начислить +{amount} XP</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
