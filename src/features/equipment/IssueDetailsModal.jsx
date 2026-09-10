import { useState, useEffect } from 'react';
import {
  Modal,
  Badge,
  Button,
  IconMapPin,
  IconAlertCircle,
  IconCheck,
  IconCheckCircle,
  IconWrench,
} from '../../shared/ui/index.js';
import {
  ISSUE_PRIORITY_META,
  ISSUE_STATUS_META,
  ISSUE_CATEGORY_META,
} from '../../entities/equipmentIssue/model.js';
import { formatDate } from '../../shared/utils/date.js';

/**
 * Modal dialog showing detailed view of an issue and discussion thread
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('../../entities/equipmentIssue/model.js').EquipmentIssue|null} props.issue
 * @param {Object} props.currentUser
 * @param {(issueId: string) => Promise<any>} props.onTakeIntoWork
 * @param {(issueId: string, comment: string) => Promise<any>} props.onResolve
 * @param {(issueId: string) => Promise<any>} props.onCancel
 * @param {(issueId: string, text: string) => Promise<any>} props.onAddComment
 * @param {(issueId: string) => Promise<any[]>} props.onGetComments
 */
export function IssueDetailsModal({
  isOpen,
  onClose,
  issue,
  currentUser,
  onTakeIntoWork,
  onResolve,
  onCancel,
  onAddComment,
  onGetComments,
}) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolution form toggle
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionComment, setResolutionComment] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (issue?.id && isOpen) {
      setIsResolving(false);
      setResolutionComment('');
      setActionError('');
      setConfirmCancel(false);
      onGetComments?.(issue.id).then((data) => {
        setComments(data || []);
      });
    }
  }, [issue?.id, isOpen, onGetComments]);

  if (!issue) return null;

  const priorityMeta = ISSUE_PRIORITY_META[issue.priority] || ISSUE_PRIORITY_META.medium;
  const statusMeta = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.new;
  const categoryMeta = ISSUE_CATEGORY_META[issue.category] || ISSUE_CATEGORY_META.other;

  // Strict role permission: only technician can take tickets or resolve them
  const isTechnician = currentUser?.role === 'technician';
  const isOwnerTeacher = issue.reportedBy === currentUser?.id && currentUser?.role === 'teacher';

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      setActionError('');
      const newComment = await onAddComment(issue.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setActionError('Не удалось отправить сообщение');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleExecuteTakeIntoWork = async () => {
    try {
      setActionError('');
      await onTakeIntoWork(issue.id);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Ошибка');
    }
  };

  const handleExecuteResolve = async (e) => {
    e.preventDefault();
    if (!resolutionComment.trim()) {
      setActionError('Укажите комментарий о решении проблемы');
      return;
    }
    try {
      setSubmittingResolution(true);
      setActionError('');
      await onResolve(issue.id, resolutionComment.trim());
      setIsResolving(false);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Ошибка при закрытии заявки');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleExecuteCancel = async () => {
    try {
      setActionError('');
      await onCancel(issue.id);
      setConfirmCancel(false);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Ошибка при отмене заявки');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>{issue.title}</span>
        </div>
      }
      maxWidth="700px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {actionError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IconAlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Status & Meta Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Статус</div>
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Приоритет</div>
            <Badge variant={priorityMeta.badgeVariant}>
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: priorityMeta.color,
                  marginRight: 5,
                }}
              />
              {priorityMeta.label}
            </Badge>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Локация</div>
            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconMapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{issue.location}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Категория</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{categoryMeta.label}</div>
          </div>
        </div>

        {/* Detailed description */}
        <div>
          <h5 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Описание поломки:
          </h5>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0,
              padding: '12px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            {issue.description}
          </p>
        </div>

        {/* Attached Photo */}
        {issue.photoUrl && (
          <div>
            <h5 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Прикрепленное фото:
            </h5>
            <div style={{ textAlign: 'center' }}>
              <img
                src={issue.photoUrl}
                alt="Фото неисправности"
                style={{
                  maxWidth: '100%',
                  maxHeight: '280px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>
          </div>
        )}

        {/* Resolution Comment Box if resolved */}
        {issue.status === 'resolved' && (
          <div
            style={{
              backgroundColor: 'var(--success-light)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--success)',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconCheckCircle size={16} />
              <span>Выполненные работы по ремонту:</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {issue.resolutionComment || 'Работы завершены без дополнительных комментариев.'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Мастер: <b>{issue.assignedToName || 'Техническая служба'}</b> • Закрыто:{' '}
              {formatDate(issue.resolvedAt || issue.updatedAt)}
            </div>
          </div>
        )}

        {/* Workflow Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Автор заявки: <b>{issue.reportedByName || 'Преподаватель'}</b> • Создана: {formatDate(issue.createdAt)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Technician actions only */}
            {isTechnician && issue.status === 'new' && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleExecuteTakeIntoWork}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconWrench size={15} />
                <span>Взять заявку в работу</span>
              </Button>
            )}

            {isTechnician && issue.status === 'in_progress' && !isResolving && (
              <Button
                size="sm"
                style={{
                  backgroundColor: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setIsResolving(true)}
              >
                <IconCheck size={15} />
                <span>Закрыть с отчётом</span>
              </Button>
            )}

            {/* Teacher cancellation with confirmation */}
            {isOwnerTeacher && issue.status === 'new' && (
              confirmCancel ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={handleExecuteCancel}
                  >
                    Точно отменить?
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Назад
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                  onClick={() => setConfirmCancel(true)}
                >
                  Отменить заявку
                </Button>
              )
            )}
          </div>
        </div>

        {/* Resolution Form (Technician closing issue) */}
        {isResolving && (
          <form
            onSubmit={handleExecuteResolve}
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
              Закрытие заявки: отчёт о выполненной работе
            </h4>
            <div>
              <label
                htmlFor="resolution-comment"
                style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}
              >
                Опишите, какие действия были предприняты (замена детали, ремонт, настройка) *
              </label>
              <textarea
                id="resolution-comment"
                rows={3}
                placeholder="Например: Заменен автоматический выключатель, протянуты клеммы, проверено под нагрузкой."
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsResolving(false)}
                disabled={submittingResolution}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                style={{
                  backgroundColor: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                disabled={submittingResolution}
              >
                <IconCheck size={14} />
                <span>{submittingResolution ? 'Сохранение...' : 'Подтвердить и закрыть'}</span>
              </Button>
            </div>
          </form>
        )}

        {/* Comments / Discussion Thread */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Переписка и уточнения ({comments.length})
          </h4>

          {/* Comments List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '220px',
              overflowY: 'auto',
              marginBottom: '14px',
            }}
          >
            {comments.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                Пока нет комментариев. Вы можете задать вопрос или уточнить детали ниже.
              </div>
            ) : (
              comments.map((c) => {
                const isMyMessage = c.authorId === currentUser?.id;
                const roleLabel =
                  c.authorRole === 'technician'
                    ? 'Техник'
                    : c.authorRole === 'admin'
                    ? 'Администратор'
                    : 'Преподаватель';
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isMyMessage ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      maxWidth: '85%',
                      alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.authorName}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {roleLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {c.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Напишите сообщение технику или преподавателю..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? '...' : 'Отправить'}
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
