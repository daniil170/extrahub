import { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Sword,
  Sparkles,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, Badge, Button, CoinIcon } from '../../shared/ui/index.js';
import { EVENT_TYPES } from '../../entities/calendarEvent/model.js';

/**
 * Calculates human readable remaining time until a date
 * @param {string|Date} targetDate
 * @returns {string}
 */
export function formatTimeRemaining(targetDate) {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return 'Время наступило';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;

  if (diffDays > 0) {
    return `Через ${diffDays} дн. ${remHours > 0 ? `${remHours} ч.` : ''}`.trim();
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffHours > 0) {
    return `Через ${diffHours} ч. ${diffMins % 60} мин.`;
  }

  return `Через ${diffMins} мин.`;
}

/**
 * Widget displaying urgent upcoming deadlines and Boss-events
 * 
 * @param {Object} props
 * @param {Array<Object>} props.events - List of club events
 * @param {Array<Object>} [props.eventResponses=[]] - Student's RSVP responses
 * @param {Function} [props.onSelectEvent] - Callback when clicking an event
 * @param {Function} [props.onOpenCalendar] - Callback to switch to calendar tab
 */
export function DeadlinesWidget({
  events = [],
  eventResponses = [],
  onSelectEvent,
  onOpenCalendar,
}) {
  const [now, setNow] = useState(Date.now());

  // Update countdown every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter urgent events: deadlines, boss-events, exams, competitions in the next 14 days
  const urgentEvents = (events || [])
    .filter((e) => {
      if (!e || !e.startTime) return false;
      const t = new Date(e.deadlineTime || e.startTime).getTime();
      return t >= now && (e.isBossEvent || e.type === EVENT_TYPES.DEADLINE || e.type === EVENT_TYPES.EXAM || e.type === EVENT_TYPES.COMPETITION);
    })
    .sort((a, b) => {
      const ta = new Date(a.deadlineTime || a.startTime).getTime();
      const tb = new Date(b.deadlineTime || b.startTime).getTime();
      return ta - tb;
    })
    .slice(0, 5);

  const responsesMap = {};
  for (const r of eventResponses) {
    if (r?.eventId) responsesMap[r.eventId] = r;
  }

  if (urgentEvents.length === 0) {
    return (
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--primary)" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Ближайшие дедлайны и события</h4>
          </div>
        </div>
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Sparkles size={24} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
          <div>Все дедлайны закрыты, активных мероприятий на этой неделе нет.</div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--primary)" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
            Ближайшие дедлайны и события
          </h4>
          <span
            style={{
              fontSize: '11.5px',
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              fontWeight: 700,
            }}
          >
            {urgentEvents.length}
          </span>
        </div>

        {onOpenCalendar && (
          <button
            onClick={onOpenCalendar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <span>Весь календарь</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {urgentEvents.map((ev) => {
          const resp = responsesMap[ev.id];
          const timeLabel = formatTimeRemaining(ev.deadlineTime || ev.startTime);
          const isBoss = ev.isBossEvent;

          return (
            <div
              key={ev.id}
              onClick={() => onSelectEvent && onSelectEvent(ev)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md, 10px)',
                backgroundColor: isBoss ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-surface)',
                border: isBoss
                  ? '1.5px solid rgba(139, 92, 246, 0.35)'
                  : '1px solid var(--border-color, #e2e8f0)',
                cursor: onSelectEvent ? 'pointer' : 'default',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  {isBoss ? (
                    <Badge variant="purple" size="sm">Спец-событие</Badge>
                  ) : ev.type === EVENT_TYPES.EXAM ? (
                    <Badge variant="purple" size="sm">Экзамен</Badge>
                  ) : ev.type === EVENT_TYPES.COMPETITION ? (
                    <Badge variant="warning" size="sm">Турнир</Badge>
                  ) : (
                    <Badge variant="danger" size="sm">Дедлайн</Badge>
                  )}

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {ev.groupName || ev.activityTitle || ''}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ev.title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {timeLabel}
                  </span>

                  {ev.xpReward > 0 && (
                    <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      +{ev.xpReward} XP
                      {ev.coinsReward > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#b45309' }}>
                          +{ev.coinsReward} <CoinIcon size={16} />
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* RSVP status badge */}
              <div>
                {resp?.status === 'accepted' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: 'var(--success, #10b981)',
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Иду
                  </span>
                ) : resp?.status === 'declined' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: 'var(--danger, #ef4444)',
                      fontWeight: 600,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    <XCircle size={13} />
                    Отклонено
                  </span>
                ) : ev.requiresRsvp ? (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#db2777',
                      fontWeight: 700,
                      backgroundColor: 'rgba(236, 72, 153, 0.12)',
                      padding: '4px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    RSVP
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
