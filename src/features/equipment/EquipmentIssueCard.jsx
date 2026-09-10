import { useState } from 'react';
import {
  MapPin,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ISSUE_PRIORITY_META,
  ISSUE_STATUS_META,
  ISSUE_CATEGORY_META,
} from '../../entities/equipmentIssue/model.js';
import { Card, Badge, Button } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/date.js';

/**
 * Modern minimalist equipment issue card (Linear/Vercel aesthetic)
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

  const isTechnician = currentUserRole === 'technician';
  const isOwnerTeacher = issue.reportedBy === currentUserId && currentUserRole === 'teacher';

  // Left accent stripe encodes priority cleanly without filled colored pill badges
  const priorityBorderColors = {
    critical: 'var(--danger)',
    high: 'var(--warning)',
    medium: 'var(--primary)',
    low: 'var(--border-color)',
  };

  const stripeColor = priorityBorderColors[issue.priority] || 'var(--border-color)';

  const priorityVariants = {
    critical: 'critical',
    high: 'warning',
    medium: 'primary',
    low: 'default',
  };

  const statusVariants = {
    new: 'primary',
    in_progress: 'warning',
    resolved: 'success',
    cancelled: 'default',
  };

  return (
    <Card
      interactive
      style={{
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${stripeColor}`,
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 16px',
        minHeight: '190px',
        gap: '10px',
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Meta Bar: Location, Category, and Monospace Status Tags */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <MapPin size={12} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span>{issue.location}</span>
            </span>

            <span style={{ color: 'var(--border-color)' }}>•</span>

            <span
              style={{
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {categoryMeta.label}
            </span>
          </div>

          {/* Monospace uppercase tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {issue.priority === 'critical' && (
              <Badge variant={priorityVariants.critical}>
                {priorityMeta.label}
              </Badge>
            )}
            {issue.priority === 'high' && (
              <Badge variant={priorityVariants.high}>
                {priorityMeta.label}
              </Badge>
            )}
            <Badge variant={statusVariants[issue.status] || 'default'}>
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        {/* Title: Largest and Boldest Element on the Card */}
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            lineHeight: 1.35,
            margin: 0,
            cursor: 'pointer',
          }}
          onClick={() => onOpenDetails && onOpenDetails(issue)}
        >
          {issue.title}
        </h4>

        {/* Description: Clamped strictly to 2 lines for uniform card height */}
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        >
          {issue.description}
        </p>

        {/* Optional photo attached badge */}
        {issue.photoUrl && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <ImageIcon size={11} />
            <span>Фотография прикреплена</span>
          </div>
        )}
      </div>

      {/* Bottom Section: Footer metadata row + Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
        {/* Compact Metadata Row (Icons instead of repetitive Russian text) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={`Заявитель: ${issue.reportedByName || 'Преподаватель'}`}
            >
              <User size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{issue.reportedByName || 'Преподаватель'}</span>
            </span>

            {issue.assignedToName && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`Исполнитель: ${issue.assignedToName}`}
              >
                <Wrench size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>{issue.assignedToName}</span>
              </span>
            )}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
            }}
          >
            <Clock size={11} strokeWidth={2} />
            <span>{formatDate(issue.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons Toolbar (Docked at bottom, uniform height) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDetails && onOpenDetails(issue)}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Подробнее
          </Button>

          {/* Technician Action: Take in work */}
          {isTechnician && issue.status === 'new' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onTakeIntoWork && onTakeIntoWork(issue.id)}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              <Wrench size={12} strokeWidth={2} />
              <span>В работу</span>
            </Button>
          )}

          {/* Technician Action: Resolve with report */}
          {isTechnician && issue.status === 'in_progress' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onOpenResolveModal && onOpenResolveModal(issue)}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              <CheckCircle2 size={12} strokeWidth={2} />
              <span>Закрыть</span>
            </Button>
          )}

          {/* Teacher Action: Cancel issue */}
          {isOwnerTeacher && issue.status === 'new' && (
            confirmCancel ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    onCancelIssue && onCancelIssue(issue.id);
                    setConfirmCancel(false);
                  }}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Точно?
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmCancel(false)}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Нет
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmCancel(true)}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  color: 'var(--text-muted)',
                }}
              >
                Отменить
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
