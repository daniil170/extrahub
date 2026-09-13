import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal, Button, Spinner } from '../../shared/ui/index.js';

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  target,
  isDeleting,
}) {
  if (!isOpen || !target) return null;

  const isBatch = target.type === 'batch';
  const isActivity = target.type === 'activity';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
          <Trash2 size={18} />
          <span>Подтверждение удаления</span>
        </div>
      }
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.08))',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {isBatch ? (
              <>
                Вы собираетесь удалить <strong>{target.title}</strong> из базы данных.
              </>
            ) : isActivity ? (
              <>
                Вы собираетесь удалить кружок <strong>«{target.title}»</strong> и все его группы из базы данных.
              </>
            ) : (
              <>
                Вы собираетесь удалить группу <strong>«{target.title}»</strong> из базы данных.
              </>
            )}
            <div style={{ marginTop: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Данные будут безвозвратно стёрты из Firestore. Записанные ученики (если они были) потеряют привязку к этой группе.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
            }}
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>{isBatch ? 'Удалить выбранные' : 'Да, удалить'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
