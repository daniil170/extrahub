import {
  ISSUE_PRIORITY_META,
  ISSUE_STATUS_META,
  ISSUE_CATEGORY_META,
} from '../../entities/equipmentIssue/model.js';
import { Card, Badge, Button } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/date.js';

/**
 * Card representing a single equipment breakdown issue
 * @param {Object} props
 * @param {import('../../entities/equipmentIssue/model.js').EquipmentIssue} props.issue
 * @param {string} props.currentUserRole
 * @param {string} [props.currentUserId]
 * @param {(issue: any) => void} [props.onOpenDetails]
 * @param {(issueId: string) => void} [props.onTakeIntoWork]
 * @param {(issue: any) => void} [props.onOpenResolveModal]
 * @param {(issueId: string) => void} [props.onCancelIssue]
 */
export function EquipmentIssueCard({
  issue,
  currentUserRole,
  currentUserId,
  onOpenDetails,
  onTakeIntoWork,
  onOpenResolveModal,
  onCancelIssue,
}) {
  const priorityMeta = ISSUE_PRIORITY_META[issue.priority] || ISSUE_PRIORITY_META.medium;
  const statusMeta = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.new;
  const categoryMeta = ISSUE_CATEGORY_META[issue.category] || ISSUE_CATEGORY_META.other;

  const isCritical = issue.priority === 'critical';
  const isTechnicianOrAdmin = currentUserRole === 'technician' || currentUserRole === 'admin';
  const isOwnerTeacher = issue.reportedBy === currentUserId && currentUserRole === 'teacher';

  const cardBorderColor = isCritical
    ? 'var(--danger)'
    : issue.status === 'in_progress'
      ? 'var(--warning)'
      : 'var(--border-color)';

  const cardBackground = isCritical && issue.status !== 'resolved'
    ? 'rgba(230, 57, 70, 0.04)'
    : 'var(--bg-surface)';

  return (
    <Card
      style={{
        border: `1.5px solid ${cardBorderColor}`,
        backgroundColor: cardBackground,
        boxShadow: isCritical && issue.status !== 'resolved'
          ? '0 0 12px rgba(230, 57, 70, 0.18)'
          : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Priority Banner for Critical */}
      {isCritical && issue.status !== 'resolved' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--danger)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            width: 'fit-content',
          }}
        >
          <span>🚨</span>
          <span>Требует немедленного внимания</span>
        </div>
      )}

      {/* Header: Title and Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px' }} title={categoryMeta.label}>
              {categoryMeta.icon}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {categoryMeta.label}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              📍 <b>{issue.location}</b>
            </span>
          </div>

          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
            {issue.title}
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
          <Badge variant={priorityMeta.badgeVariant}>
            {priorityMeta.icon} {priorityMeta.label}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {issue.description}
      </p>

      {/* Photo Preview if uploaded */}
      {issue.photoUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={issue.photoUrl}
            alt="Превью неисправности"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
            onClick={() => onOpenDetails && onOpenDetails(issue)}
            title="Нажмите для увеличения"
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Прикреплено фото поломки</span>
        </div>
      )}

      {/* Resolution Box if resolved */}
      {issue.status === 'resolved' && issue.resolutionComment && (
        <div
          style={{
            backgroundColor: 'var(--success-light)',
            borderLeft: '3px solid var(--success)',
            padding: '8px 12px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '2px' }}>
            ✓ Решение техника:
          </div>
          <div style={{ color: 'var(--text-primary)' }}>{issue.resolutionComment}</div>
        </div>
      )}

      {/* Footer Info: Author, Technician, Date */}
      <div
        style={{
          paddingTop: '10px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <div>
          <span>Сообщил: <b>{issue.reportedByName || 'Учитель'}</b></span>
          {issue.assignedToName && (
            <span style={{ marginLeft: '8px' }}>
              • Мастер: <b>{issue.assignedToName}</b>
            </span>
          )}
        </div>
        <div>{formatDate(issue.createdAt)}</div>
      </div>

      {/* Actions Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '4px',
        }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenDetails && onOpenDetails(issue)}
        >
          Подробнее / Чат
        </Button>

        {/* Technician quick action: Take in work */}
        {isTechnicianOrAdmin && issue.status === 'new' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onTakeIntoWork && onTakeIntoWork(issue.id)}
          >
            🛠️ Взять в работу
          </Button>
        )}

        {/* Technician quick action: Resolve */}
        {isTechnicianOrAdmin && issue.status === 'in_progress' && (
          <Button
            size="sm"
            style={{
              backgroundColor: 'var(--success)',
              color: '#ffffff',
              border: 'none',
            }}
            onClick={() => onOpenResolveModal && onOpenResolveModal(issue)}
          >
            ✓ Закрыть заявку
          </Button>
        )}

        {/* Teacher action: Cancel new issue */}
        {isOwnerTeacher && issue.status === 'new' && (
          <Button
            size="sm"
            variant="outline"
            style={{ color: 'var(--danger)', borderColor: 'var(--border-color)' }}
            onClick={() => onCancelIssue && onCancelIssue(issue.id)}
          >
            Отменить
          </Button>
        )}
      </div>
    </Card>
  );
}
