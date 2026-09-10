import { useState } from 'react';
import {
  ISSUE_PRIORITY_META,
  ISSUE_STATUS_META,
  ISSUE_CATEGORY_META,
} from '../../entities/equipmentIssue/model.js';
import { Card, Badge, Button, IconMapPin, IconWrench, IconCheck } from '../../shared/ui/index.js';
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
  const [confirmCancel, setConfirmCancel] = useState(false);

  const priorityMeta = ISSUE_PRIORITY_META[issue.priority] || ISSUE_PRIORITY_META.medium;
  const statusMeta = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.new;
  const categoryMeta = ISSUE_CATEGORY_META[issue.category] || ISSUE_CATEGORY_META.other;

  const isCritical = issue.priority === 'critical';
  const isTechnician = currentUserRole === 'technician';
  const isOwnerTeacher = issue.reportedBy === currentUserId && currentUserRole === 'teacher';

  const cardBorderColor = isCritical && issue.status !== 'resolved'
    ? 'var(--danger)'
    : issue.status === 'in_progress'
      ? 'var(--warning)'
      : 'var(--border-color)';

  const cardBackground = isCritical && issue.status !== 'resolved'
    ? 'rgba(230, 57, 70, 0.03)'
    : 'var(--bg-surface)';

  return (
    <Card
      style={{
        border: `1px solid ${cardBorderColor}`,
        backgroundColor: cardBackground,
        boxShadow: isCritical && issue.status !== 'resolved'
          ? '0 2px 8px rgba(230, 57, 70, 0.12)'
          : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        padding: '16px 18px',
      }}
    >
      {/* Top Tag & Badges Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {categoryMeta.label}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <IconMapPin size={13} style={{ color: 'var(--text-muted)' }} />
            <span>{issue.location}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Badge variant={priorityMeta.badgeVariant}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: priorityMeta.color,
                display: 'inline-block',
                marginRight: '5px',
              }}
            />
            {priorityMeta.label}
          </Badge>
          <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
        </div>
      </div>

      {/* Title */}
      <h4
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        {issue.title}
      </h4>

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
            alt="Фото неисправности"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
            onClick={() => onOpenDetails && onOpenDetails(issue)}
            title="Нажмите для увеличения"
          />
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Прикреплено фото</span>
        </div>
      )}

      {/* Resolution Report Box if resolved */}
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
            Отчёт о решении:
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
          <span>Заявитель: <b>{issue.reportedByName || 'Учитель'}</b></span>
          {issue.assignedToName && (
            <span style={{ marginLeft: '8px' }}>
              • Исполнитель: <b>{issue.assignedToName}</b>
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
          marginTop: '2px',
        }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenDetails && onOpenDetails(issue)}
        >
          Подробнее / Чат
        </Button>

        {/* Technician action: Take in work (NOT available for admin) */}
        {isTechnician && issue.status === 'new' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onTakeIntoWork && onTakeIntoWork(issue.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconWrench size={13} />
            <span>Взять в работу</span>
          </Button>
        )}

        {/* Technician action: Resolve (NOT available for admin) */}
        {isTechnician && issue.status === 'in_progress' && (
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
            onClick={() => onOpenResolveModal && onOpenResolveModal(issue)}
          >
            <IconCheck size={14} />
            <span>Закрыть заявку</span>
          </Button>
        )}

        {/* Teacher action: Cancel new issue with confirmation */}
        {isOwnerTeacher && issue.status === 'new' && (
          confirmCancel ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>Отменить?</span>
              <button
                type="button"
                onClick={() => {
                  onCancelIssue && onCancelIssue(issue.id);
                  setConfirmCancel(false);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Нет
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border-color)',
              }}
              onClick={() => setConfirmCancel(true)}
            >
              Отменить
            </Button>
          )
        )}
      </div>
    </Card>
  );
}
