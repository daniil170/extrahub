import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { Modal, Button, Spinner } from '../../shared/ui/index.js';
import { updateLeagueProfileCall } from './api.js';

/**
 * Modal to customize league nickname and privacy settings
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('../../entities/league/model.js').LeagueMembership} props.membership
 * @param {() => void} [props.onSuccess]
 */
export function LeaguePrivacyModal({ isOpen, onClose, membership, onSuccess }) {
  const [useRealName, setUseRealName] = useState(true);
  const [pseudonym, setPseudonym] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (membership) {
      setUseRealName(membership.useRealName !== undefined ? membership.useRealName : true);
      setPseudonym(membership.pseudonym || '');
      setError('');
      setSuccessMsg('');
    }
  }, [membership, isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!useRealName && !pseudonym.trim()) {
      setError('Пожалуйста, укажите псевдоним (никнейм) для анонимного отображения');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateLeagueProfileCall({
        useRealName,
        pseudonym: pseudonym.trim(),
      });

      setSuccessMsg('Настройки приватности успешно сохранены!');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения настроек');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки приватности в рейтинге лиги"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Shield size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>
            Вы можете скрыть своё настоящее имя в таблице дивизиона, чтобы соревноваться инкогнито под выбранным псевдонимом.
          </span>
        </div>

        {/* Toggle Real Name vs Pseudonym */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="privacyOption"
              checked={useRealName}
              onChange={() => setUseRealName(true)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} />
                <span>Показывать моё настоящее ФИО</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Ваше имя будет видно другим участникам вашей группы в таблице лидеров
              </div>
            </div>
          </label>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="privacyOption"
              checked={!useRealName}
              onChange={() => setUseRealName(false)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <EyeOff size={14} />
                <span>Скрыть настоящее имя (Использовать псевдоним)</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Вместо ФИО будет отображаться ваш секретный игровой никнейм
              </div>
            </div>
          </label>
        </div>

        {/* Pseudonym Input */}
        {!useRealName && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Ваш игровой псевдоним (никнейм):
            </label>
            <input
              type="text"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              placeholder="Например: CyberFox, StarCoder, Neo77"
              maxLength={30}
              required={!useRealName}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving || Boolean(successMsg)}>
            {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
