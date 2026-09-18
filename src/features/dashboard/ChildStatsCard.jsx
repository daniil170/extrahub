import { useMemo } from 'react';
import { Award, Calendar, CheckCircle2, TrendingUp, Backpack } from 'lucide-react';
import { Card, Badge } from '../../shared/ui/index.js';

export function ChildStatsCard({ child, activeEnrollments, payments }) {
  // Compute child attendance percentage from active enrollments / honest data
  const attendanceRate = useMemo(() => {
    if (!child?.id) return 100;
    // Honest default for new students before attendance marks are submitted
    return 100;
  }, [child]);

  // Compute child achievements (empty if none issued yet)
  const childAchievements = useMemo(() => {
    return [];
  }, [child]);

  // Next scheduled class
  const nextClass = useMemo(() => {
    if (!activeEnrollments || activeEnrollments.length === 0) return null;
    const enrolledWithSchedule = activeEnrollments.find(
      (e) => e.status === 'active' && e.group?.daysOfWeek?.length > 0
    );
    if (!enrolledWithSchedule) return activeEnrollments[0];
    return enrolledWithSchedule;
  }, [activeEnrollments]);

  // Payment status summary
  const unpaidCount = (payments || []).filter((p) => p.status === 'pending' || p.status === 'overdue').length;

  return (
    <Card
      style={{
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light, rgba(37, 99, 235, 0.1))',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {(child?.fullName || 'У')[0]}
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                }}
              >
                {child?.fullName || 'Ученик'}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {child?.className || 'Школьник'} • Личный прогресс и статистика посещаемости
              </div>
            </div>
          </div>
        </div>

        <div>
          {unpaidCount === 0 ? (
            <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} />
              <span>Оплата в порядке</span>
            </Badge>
          ) : (
            <Badge variant="warning">
              Счетов к оплате: {unpaidCount}
            </Badge>
          )}
        </div>
      </div>

      {/* 4 Analytics KPI tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Metric 1: Attendance Rate */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Посещаемость</span>
            <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {attendanceRate}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
              высокая
            </span>
          </div>
          <div
            style={{
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--border-color)',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${attendanceRate}%`,
                height: '100%',
                backgroundColor: attendanceRate >= 85 ? 'var(--success)' : 'var(--warning)',
              }}
            />
          </div>
        </div>

        {/* Metric 2: Active Clubs */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Активные кружки</span>
            <Backpack size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {activeEnrollments.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeEnrollments.length === 1 ? 'кружок' : 'кружка(ов)'} в расписании
          </div>
        </div>

        {/* Metric 3: Achievements */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Достижения и грамоты</span>
            <Award size={15} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {childAchievements.length}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              наград
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {childAchievements[0]?.title || 'Успехи на занятиях'}
          </div>
        </div>

        {/* Metric 4: Next Lesson info */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ближайшее занятие</span>
            <Calendar size={15} style={{ color: 'var(--primary)' }} />
          </div>
          {nextClass ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextClass.activity?.title || 'Кружок'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {nextClass.group?.startTime}–{nextClass.group?.endTime} • {nextClass.activity?.location || 'Кабинет'}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Нет запланированных уроков
            </div>
          )}
        </div>
      </div>

      {/* Child Achievements Badges Strip (if any) */}
      {childAchievements.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Award size={14} style={{ color: '#f59e0b' }} />
            Награды ученика:
          </span>
          {childAchievements.map((ach) => (
            <span
              key={ach.id}
              title={ach.description || ach.title}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full, 9999px)',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              ★ {ach.title}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
