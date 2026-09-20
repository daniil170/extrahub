import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Sword,
  Sparkles,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Award,
  AlertCircle,
  Layers,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button, Card, Badge, Modal, CoinIcon } from '../../shared/ui/index.js';
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_BADGES,
  RESPONSE_STATUS,
  EVENT_OUTCOME,
} from '../../entities/calendarEvent/model.js';
import { generateVirtualLessons, formatDateKey } from './virtualLessons.js';
import { downloadIcsFile } from './icsExport.js';
import { respondToEventCall } from './api.js';

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const SHORT_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Main Student Interactive Calendar with Week / Month / Agenda views,
 * Boss-events with special glow, RSVP interaction, and iCal (.ics) export.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.events - Firestore clubEvents
 * @param {Array<Object>} props.studentGroups - Groups student is enrolled in
 * @param {Record<string, any>} [props.activitiesMap={}]
 * @param {Array<Object>} [props.eventResponses=[]] - Student's RSVP responses
 * @param {string} props.studentId
 * @param {string} [props.studentName]
 */
export function StudentCalendar({
  events = [],
  studentGroups = [],
  activitiesMap = {},
  eventResponses = [],
  studentId,
  studentName = 'Ученик',
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'list'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'boss_event' | 'exam' | 'competition' | 'lesson'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRsvping, setIsRsvping] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState('');

  // 1. Calculate active date range for the current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      const day = start.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMon);
      start.setHours(0, 0, 0, 0);

      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else {
      // List: 30 days ahead from today
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 30);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // 2. Generate on-the-fly virtual lessons for student groups
  const virtualLessons = useMemo(() => {
    return generateVirtualLessons({
      groups: studentGroups,
      startDate: dateRange.start,
      endDate: dateRange.end,
      activitiesMap,
    });
  }, [studentGroups, dateRange, activitiesMap]);

  // 3. Merge virtual regular lessons with manual Firestore events
  const mergedEvents = useMemo(() => {
    const all = [...virtualLessons, ...(events || [])];
    
    return all.filter((ev) => {
      if (!ev || !ev.startTime) return false;
      const evTime = new Date(ev.startTime);
      if (isNaN(evTime.getTime())) return false;

      // Filter by type
      if (filterType !== 'all') {
        if (filterType === 'boss_event' && !ev.isBossEvent) return false;
        if (filterType !== 'boss_event' && ev.type !== filterType) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [virtualLessons, events, filterType]);

  // Map student responses by eventId
  const responsesMap = useMemo(() => {
    const map = {};
    for (const r of eventResponses) {
      if (r?.eventId) map[r.eventId] = r;
    }
    return map;
  }, [eventResponses]);

  // Navigation handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'week') nextDate.setDate(nextDate.getDate() - 7);
    else if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
    else nextDate.setDate(nextDate.getDate() - 14);
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'week') nextDate.setDate(nextDate.getDate() + 7);
    else if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
    else nextDate.setDate(nextDate.getDate() + 14);
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleExportIcs = () => {
    downloadIcsFile(mergedEvents, 'extrahub-my-schedule.ics', 'Мое расписание ExtraHub');
  };

  const handleRsvp = async (status) => {
    if (!selectedEvent) return;
    setIsRsvping(true);
    setRsvpFeedback('');
    try {
      await respondToEventCall({
        eventId: selectedEvent.id,
        studentId,
        studentName,
        status,
      });
      setRsvpFeedback(status === 'accepted' ? 'Вы подтвердили участие!' : 'Вы отклонили участие.');
    } catch (e) {
      setRsvpFeedback(`Ошибка: ${e.message}`);
    } finally {
      setIsRsvping(false);
    }
  };

  // Build days array for Week view
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const days = [];
    const curr = new Date(dateRange.start);
    for (let i = 0; i < 7; i++) {
      const dKey = formatDateKey(curr);
      const isToday = dKey === formatDateKey(new Date());
      const dayEvents = mergedEvents.filter((e) => formatDateKey(new Date(e.startTime)) === dKey);

      days.push({
        date: new Date(curr),
        dateKey: dKey,
        dayName: DAY_NAMES[i],
        shortDayName: SHORT_DAY_NAMES[i],
        dayNumber: curr.getDate(),
        isToday,
        events: dayEvents,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [viewMode, dateRange, mergedEvents]);

  // Title label for the current range
  const rangeHeaderTitle = useMemo(() => {
    const m1 = dateRange.start.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    if (viewMode === 'month') {
      return m1.charAt(0).toUpperCase() + m1.slice(1);
    }
    if (viewMode === 'week') {
      const d1 = dateRange.start.getDate();
      const d2 = dateRange.end.getDate();
      const m2 = dateRange.end.toLocaleString('ru-RU', { month: 'short' });
      return `${d1} – ${d2} ${m2} ${dateRange.end.getFullYear()}`;
    }
    return 'Ближайшие 30 дней';
  }, [dateRange, viewMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Calendar Controls Top Bar */}
      <Card style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Left: Nav arrows & Current period */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Button size="sm" variant="outline" onClick={handlePrev} style={{ padding: '6px 8px' }}>
                <ChevronLeft size={16} />
              </Button>
              <Button size="sm" variant="outline" onClick={handleToday}>
                Сегодня
              </Button>
              <Button size="sm" variant="outline" onClick={handleNext} style={{ padding: '6px 8px' }}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {rangeHeaderTitle}
            </div>
          </div>

          {/* Right: View Mode toggles & iCal Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Switcher */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '3px',
                border: '1px solid var(--border-color)',
              }}
            >
              {[
                { id: 'week', label: 'Неделя' },
                { id: 'month', label: 'Месяц' },
                { id: 'list', label: 'Список' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: viewMode === v.id ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: viewMode === v.id ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: viewMode === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* iCal Export Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportIcs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileDown size={14} />
              <span>Экспорт .ics</span>
            </Button>
          </div>
        </div>

        {/* Filters Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} />
            Фильтр:
          </span>

          {[
            { id: 'all', label: 'Все события' },
            { id: 'boss_event', label: 'Спец-события' },
            { id: 'exam', label: 'Экзамены' },
            { id: 'competition', label: 'Турниры' },
            { id: 'lesson', label: 'Занятия' },
          ].map((f) => {
            const active = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: active
                    ? f.id === 'boss_event' ? '1px solid #7c3aed' : '1px solid var(--primary)'
                    : '1px solid var(--border-color)',
                  backgroundColor: active
                    ? f.id === 'boss_event' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)'
                    : 'var(--bg-surface)',
                  color: active
                    ? f.id === 'boss_event' ? '#7c3aed' : 'var(--primary)'
                    : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Calendar Views */}
      {viewMode === 'week' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
            gap: '10px',
            overflowX: 'auto',
          }}
        >
          {weekDays.map((day) => (
            <div
              key={day.dateKey}
              style={{
                borderRadius: 'var(--radius-md, 12px)',
                backgroundColor: day.isToday ? 'rgba(59, 130, 246, 0.03)' : 'var(--bg-surface)',
                border: day.isToday
                  ? '2px solid var(--primary, #3b82f6)'
                  : '1px solid var(--border-color, #e2e8f0)',
                padding: '12px 10px',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {day.shortDayName}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: day.isToday ? 'var(--primary)' : 'transparent',
                    color: day.isToday ? '#ffffff' : 'var(--text-primary)',
                  }}
                >
                  {day.dayNumber}
                </span>
              </div>

              {/* Day Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {day.events.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto 0', opacity: 0.5 }}>
                    Нет событий
                  </div>
                ) : (
                  day.events.map((ev) => {
                    const isBoss = ev.isBossEvent;
                    const startTimeStr = new Date(ev.startTime).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const resp = responsesMap[ev.id];

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isBoss
                            ? 'rgba(139, 92, 246, 0.12)'
                            : ev.type === EVENT_TYPES.EXAM
                            ? 'rgba(139, 92, 246, 0.1)'
                            : ev.type === EVENT_TYPES.COMPETITION
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(59, 130, 246, 0.08)',
                          border: isBoss
                            ? '1.5px solid #7c3aed'
                            : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: isBoss ? '#7c3aed' : 'var(--text-secondary)' }}>
                            {startTimeStr}
                          </span>
                          {isBoss && (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed' }}>
                              Спец
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.25,
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {ev.title}
                        </div>

                        {/* Badges / Rewards */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '10.5px' }}>
                          <span style={{ color: '#059669', fontWeight: 700 }}>
                            +{ev.xpReward} XP
                          </span>

                          {resp?.status === 'accepted' ? (
                            <span style={{ color: '#10b981', fontWeight: 700 }}>Иду</span>
                          ) : ev.requiresRsvp ? (
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>RSVP</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List / Agenda View */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mergedEvents.length === 0 ? (
            <Card style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Нет запланированных событий на выбранный период.
            </Card>
          ) : (
            mergedEvents.map((ev) => {
              const isBoss = ev.isBossEvent;
              const dateStr = new Date(ev.startTime).toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              });
              const timeStr = `${new Date(ev.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
              const resp = responsesMap[ev.id];

              return (
                <Card
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md, 12px)',
                    backgroundColor: isBoss ? 'rgba(139, 92, 246, 0.04)' : 'var(--bg-surface)',
                    border: isBoss ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isBoss ? '#7c3aed' : 'var(--primary)',
                        color: '#ffffff',
                        textAlign: 'center',
                        minWidth: '55px',
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>
                        {new Date(ev.startTime).getDate()}
                      </div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        {new Date(ev.startTime).toLocaleDateString('ru-RU', { month: 'short' })}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {isBoss ? (
                          <Badge variant="purple" size="sm">Спец-событие</Badge>
                        ) : (
                          <Badge variant="blue" size="sm">{EVENT_TYPE_LABELS[ev.type] || 'Занятие'}</Badge>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {ev.groupName || ev.activityTitle || ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ev.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          {timeStr}
                        </span>
                        {ev.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Rewards & RSVP */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#059669', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span>+{ev.xpReward} XP</span>
                        {ev.coinsReward > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#b45309' }}>
                            +{ev.coinsReward} <CoinIcon size={18} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {ev.teacherName ? `Преподаватель: ${ev.teacherName}` : 'Награда за участие'}
                      </div>
                    </div>

                    <div>
                      {resp?.status === 'accepted' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '999px',
                          }}
                        >
                          <CheckCircle2 size={15} />
                          Я иду!
                        </span>
                      ) : (
                        <Button size="sm" variant={isBoss ? 'primary' : 'outline'}>
                          Подробнее / RSVP
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {SHORT_DAY_NAMES.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', padding: '6px 0' }}>
                {d}
              </div>
            ))}

            {/* Compute month calendar days */}
            {(() => {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              
              const startDayOffset = (firstDay.getDay() === 0 ? 7 : firstDay.getDay()) - 1;
              const days = [];

              // Previous month padding
              for (let i = 0; i < startDayOffset; i++) {
                days.push({ isPadding: true, key: `pad_${i}` });
              }

              // Days of month
              for (let d = 1; d <= lastDay.getDate(); d++) {
                const dateObj = new Date(year, month, d);
                const dKey = formatDateKey(dateObj);
                const isToday = dKey === formatDateKey(new Date());
                const dayEvents = mergedEvents.filter((e) => formatDateKey(new Date(e.startTime)) === dKey);

                days.push({
                  isPadding: false,
                  key: dKey,
                  dateKey: dKey,
                  dayNumber: d,
                  isToday,
                  events: dayEvents,
                });
              }

              return days.map((cell) => {
                if (cell.isPadding) {
                  return <div key={cell.key} style={{ minHeight: '80px', opacity: 0.2 }} />;
                }

                return (
                  <div
                    key={cell.key}
                    style={{
                      minHeight: '85px',
                      padding: '6px',
                      borderRadius: '8px',
                      backgroundColor: cell.isToday ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-secondary)',
                      border: cell.isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: cell.isToday ? 800 : 600, color: cell.isToday ? 'var(--primary)' : 'var(--text-primary)', textAlign: 'right' }}>
                      {cell.dayNumber}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                      {cell.events.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor: ev.isBossEvent ? '#7c3aed' : 'var(--primary)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {cell.events.length > 3 && (
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          +{cell.events.length - 3} ещё
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>
      )}

      {/* Event Details & RSVP Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => {
            setSelectedEvent(null);
            setRsvpFeedback('');
          }}
          title={selectedEvent.title}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Hero if Boss/Special Event */}
            {selectedEvent.isBossEvent && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.2) 100%)',
                  border: '1.5px solid #7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#6d28d9' }}>
                    {selectedEvent.title}
                  </h4>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    Специальное мероприятие: за участие начисляется повышенный XP и школьные монеты!
                  </div>
                </div>
              </div>
            )}

            {/* Event info list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--primary)" />
                <span>
                  <strong>Время: </strong>
                  {new Date(selectedEvent.startTime).toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  • {new Date(selectedEvent.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} – {new Date(selectedEvent.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {selectedEvent.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span>
                    <strong>Место: </strong> {selectedEvent.location}
                  </span>
                </div>
              )}

              {selectedEvent.teacherName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--primary)" />
                  <span>
                    <strong>Преподаватель: </strong> {selectedEvent.teacherName}
                  </span>
                </div>
              )}

              {/* Rewards Box */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Награда за завершение:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                  <span style={{ color: '#059669' }}>+{selectedEvent.xpReward} XP</span>
                  {selectedEvent.coinsReward > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
                      +{selectedEvent.coinsReward} <CoinIcon size={18} />
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Описание:</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                    {selectedEvent.description}
                  </div>
                </div>
              )}
            </div>

            {/* RSVP status & feedback */}
            {rsvpFeedback && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontSize: '13px',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {rsvpFeedback}
              </div>
            )}

            {/* RSVP Actions */}
            {selectedEvent.requiresRsvp && !selectedEvent.isVirtual && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Button
                  variant="primary"
                  onClick={() => handleRsvp('accepted')}
                  disabled={isRsvping}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {isRsvping ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Я пойду! (RSVP)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleRsvp('declined')}
                  disabled={isRsvping}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <XCircle size={16} />
                  <span>Не смогу</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
