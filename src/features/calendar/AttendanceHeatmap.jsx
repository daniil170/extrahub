import { useState, useMemo } from 'react';
import {
  Flame,
  Calendar as CalendarIcon,
  Sparkles,
  Trophy,
  CheckCircle2,
  Sword,
  Info,
} from 'lucide-react';
import { Card, Badge, CoinIcon } from '../../shared/ui/index.js';

const DAY_LABELS = ['Пн', '', 'Ср', '', 'Пт', '', 'Вс'];
const MONTH_NAMES = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
];

/**
 * Generates the past N weeks of day cells leading up to today
 * @param {number} weeksCount
 * @returns {{ weeks: Array<Array<{ date: Date, dateKey: string, dayOfWeek: number }>>, monthLabels: Array<{ label: string, colIndex: number }> }}
 */
function generateHeatmapGrid(weeksCount = 14) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  // End on current week's Sunday (ISO day 7)
  const currentIsoDay = now.getDay() === 0 ? 7 : now.getDay();
  const daysUntilSunday = 7 - currentIsoDay;
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + daysUntilSunday);

  const totalDays = weeksCount * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const weeks = [];
  const monthLabels = [];
  let lastMonth = -1;

  let currDate = new Date(startDate);
  for (let w = 0; w < weeksCount; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const y = currDate.getFullYear();
      const m = String(currDate.getMonth() + 1).padStart(2, '0');
      const dayNum = String(currDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayNum}`;

      if (currDate.getMonth() !== lastMonth) {
        lastMonth = currDate.getMonth();
        monthLabels.push({
          label: MONTH_NAMES[lastMonth],
          colIndex: w,
        });
      }

      weekDays.push({
        date: new Date(currDate),
        dateKey,
        dayOfWeek: d, // 0 = Mon, 6 = Sun
        isFuture: currDate > now,
      });

      currDate.setDate(currDate.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  return { weeks, monthLabels };
}

/**
 * Attendance Activity Heatmap (Contribution Graph)
 * 
 * @param {Object} props
 * @param {Array<Object>} [props.attendanceHistory=[]] - Array of attendance records
 * @param {Array<Object>} [props.eventResponses=[]] - Array of student's event responses
 * @param {Array<Object>} [props.events=[]] - Array of club events
 * @param {number} [props.currentStreak=0] - Student's current weekly streak
 * @param {string} [props.studentName]
 */
export function AttendanceHeatmap({
  attendanceHistory = [],
  eventResponses = [],
  events = [],
  currentStreak = 0,
  studentName = 'Ученик',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const { weeks, monthLabels } = useMemo(() => generateHeatmapGrid(15), []);

  // Map events and attendance by dateKey
  const activityMap = useMemo(() => {
    const map = {};

    // 1. Process attendance records (regular classes)
    for (const att of attendanceHistory) {
      if (!att) continue;
      // Extract date string YYYY-MM-DD
      const dateKey = att.date ? String(att.date).substring(0, 10) : '';
      if (!dateKey) continue;

      if (!map[dateKey]) {
        map[dateKey] = {
          count: 0,
          xpEarned: 0,
          coinsEarned: 0,
          hasBossEvent: false,
          items: [],
        };
      }

      if (att.status === 'present' || att.status === 'attended' || att.attended) {
        map[dateKey].count += 1;
        map[dateKey].xpEarned += (att.xpEarned || 50);
        map[dateKey].coinsEarned += (att.coinsEarned || 10);
        map[dateKey].items.push({
          type: 'lesson',
          title: att.activityName || att.groupName || 'Регулярное занятие',
          xp: att.xpEarned || 50,
          coins: att.coinsEarned || 10,
        });
      }
    }

    // 2. Process special event responses (boss events, tournaments, exams)
    const eventsById = {};
    for (const ev of events) {
      if (ev?.id) eventsById[ev.id] = ev;
    }

    for (const resp of eventResponses) {
      if (!resp || resp.outcome !== 'attended') continue;
      const ev = eventsById[resp.eventId];
      if (!ev) continue;

      const dateKey = ev.startTime ? String(ev.startTime).substring(0, 10) : '';
      if (!dateKey) continue;

      if (!map[dateKey]) {
        map[dateKey] = {
          count: 0,
          xpEarned: 0,
          coinsEarned: 0,
          hasBossEvent: false,
          items: [],
        };
      }

      map[dateKey].count += 1;
      const xp = ev.xpReward || (ev.isBossEvent ? 300 : 100);
      const coins = ev.coinsReward || (ev.isBossEvent ? 50 : 20);
      map[dateKey].xpEarned += xp;
      map[dateKey].coinsEarned += coins;
      if (ev.isBossEvent) {
        map[dateKey].hasBossEvent = true;
      }

      map[dateKey].items.push({
        type: ev.isBossEvent ? 'boss_event' : (ev.type || 'special_event'),
        title: ev.title || 'Специальное событие',
        isBoss: ev.isBossEvent,
        xp,
        coins,
      });
    }

    return map;
  }, [attendanceHistory, eventResponses, events]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalActiveDays = 0;
    let totalXpEarned = 0;
    let totalBossWins = 0;

    Object.values(activityMap).forEach((dayData) => {
      if (dayData.count > 0) {
        totalActiveDays += 1;
        totalXpEarned += dayData.xpEarned;
        if (dayData.hasBossEvent) {
          totalBossWins += 1;
        }
      }
    });

    return { totalActiveDays, totalXpEarned, totalBossWins };
  }, [activityMap]);

  /**
   * Helper to get visual background color and shadow based on activity level
   */
  const getCellVisual = (dayInfo) => {
    if (dayInfo.isFuture) {
      return {
        bg: 'transparent',
        border: '1px dashed var(--border-color, #e2e8f0)',
        cursor: 'default',
        opacity: 0.35,
      };
    }

    const data = activityMap[dayInfo.dateKey];
    if (!data || data.count === 0) {
      return {
        bg: 'var(--bg-secondary, #f1f5f9)',
        border: '1px solid var(--border-color, #e2e8f0)',
        cursor: 'pointer',
      };
    }

    if (data.hasBossEvent) {
      return {
        bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        border: '1px solid #be185d',
        boxShadow: '0 0 8px rgba(236, 72, 153, 0.65)',
        cursor: 'pointer',
        transform: 'scale(1.15)',
        zIndex: 2,
      };
    }

    if (data.count >= 3 || data.xpEarned >= 150) {
      return {
        bg: '#15803d',
        border: '1px solid #14532d',
        cursor: 'pointer',
      };
    }

    if (data.count >= 2 || data.xpEarned >= 100) {
      return {
        bg: '#22c55e',
        border: '1px solid #16a34a',
        cursor: 'pointer',
      };
    }

    return {
      bg: '#86efac',
      border: '1px solid #4ade80',
      cursor: 'pointer',
    };
  };

  return (
    <Card
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header with Title & Stats Pill */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="var(--primary, #3b82f6)" />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Карта активности и посещаемости
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            График занятий, хакатонов и побед над Боссами за последние 15 недель
          </p>
        </div>

        {/* Quick Stats badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#ea580c',
            }}
          >
            <Flame size={14} />
            <span>Серия: {currentStreak} нед.</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#db2777',
            }}
          >
            <Sword size={14} />
            <span>Боссы: {stats.totalBossWins}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#059669',
            }}
          >
            <Sparkles size={14} />
            <span>+{stats.totalXpEarned.toLocaleString('ru-RU')} XP</span>
          </div>
        </div>
      </div>

      {/* Contribution Grid Container */}
      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'inline-block', minWidth: '600px' }}>
          {/* Month Labels Header */}
          <div style={{ display: 'flex', marginLeft: '30px', marginBottom: '6px', height: '16px' }}>
            {weeks.map((_, colIdx) => {
              const mLabel = monthLabels.find((m) => m.colIndex === colIdx);
              return (
                <div
                  key={colIdx}
                  style={{
                    width: '15px',
                    marginRight: '3px',
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mLabel ? mLabel.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid Rows (7 days per column) */}
          <div style={{ display: 'flex' }}>
            {/* Day of week labels on left */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                marginRight: '8px',
                width: '22px',
              }}
            >
              {DAY_LABELS.map((lbl, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '14px',
                    lineHeight: '14px',
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {weeks.map((week, colIdx) => (
                <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {week.map((dayInfo, rowIdx) => {
                    const visual = getCellVisual(dayInfo);
                    const activity = activityMap[dayInfo.dateKey];

                    return (
                      <div
                        key={rowIdx}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            date: dayInfo.date,
                            dateKey: dayInfo.dateKey,
                            data: activity,
                            rect,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          backgroundColor: visual.bg,
                          border: visual.border,
                          boxShadow: visual.boxShadow || 'none',
                          transform: visual.transform || 'none',
                          zIndex: visual.zIndex || 1,
                          opacity: visual.opacity || 1,
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip Popup */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredCell.rect.left + 8}px`,
            top: `${hoveredCell.rect.top - 12}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none',
            maxWidth: '260px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '3px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px' }}>
            {hoveredCell.date.toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })}
          </div>
          {hoveredCell.data && hoveredCell.data.count > 0 ? (
            <div>
              <div style={{ color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>+{hoveredCell.data.xpEarned} XP</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#fde047' }}>
                  +{hoveredCell.data.coinsEarned} <CoinIcon size={12} />
                </span>
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '14px', fontSize: '11px', color: '#cbd5e1' }}>
                {hoveredCell.data.items.map((item, i) => (
                  <li key={i} style={{ color: item.isBoss ? '#f472b6' : '#cbd5e1', fontWeight: item.isBoss ? 700 : 400 }}>
                    {item.isBoss ? '⚔️ ' : ''}{item.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ color: '#94a3b8' }}>Занятий в этот день не было</div>
          )}
        </div>
      )}

      {/* Legend footer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>Меньше</span>
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: 'var(--bg-secondary, #f1f5f9)', border: '1px solid var(--border-color, #e2e8f0)' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#86efac' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#22c55e' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#15803d' }} />
          <span>Больше</span>
          <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#db2777', fontWeight: 600 }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#db2777', boxShadow: '0 0 6px rgba(236,72,153,0.8)' }} />
            ⚔️ Босс-Событие
          </span>
        </div>

        <div>
          Всего активных дней: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalActiveDays}</strong>
        </div>
      </div>
    </Card>
  );
}
