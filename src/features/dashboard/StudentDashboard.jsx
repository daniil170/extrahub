import React from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useSchedule } from '../schedule/useSchedule.js';
import { Card, Badge, PageHeader, Spinner } from '../../shared/ui/index.js';
import { formatDaysOfWeek } from '../../shared/utils/index.js';

export function StudentDashboard() {
  const { user } = useAuth();
  const { schedule, loading } = useSchedule(user?.id);

  const mockAchievements = [
    { id: 'ach-1', title: 'Первый робот', desc: 'Собрана первая рабочая модель робота', icon: '🤖' },
    { id: 'ach-2', title: 'Шахматный дебют', desc: 'Победа в первом школьном турнире', icon: '♟️' },
  ];

  return (
    <div>
      <PageHeader
        title={`Личный кабинет ученика: ${user?.fullName || 'Ученик'}`}
        subtitle="Ваши секции, расписание занятий и полученные награды"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <Card title="Моё расписание" style={{ marginBottom: '24px' }}>
            {loading ? (
              <Spinner label="Загрузка расписания..." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.activityTitle}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {item.location} • Преподаватель: {item.teacherName}
                      </div>
                    </div>
                    <Badge variant="info">
                      {formatDaysOfWeek([item.dayOfWeek])} {item.startTime} - {item.endTime}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Активные записи в секции">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <strong>Робототехника и Arduino</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Группа 1 (Пн, Пт)</div>
                </div>
                <Badge variant="success">Активен</Badge>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                }}
              >
                <div>
                  <strong>Шахматный клуб</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Группа 2 (Ср)</div>
                </div>
                <Badge variant="warning">Ожидает подтверждения родителем</Badge>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Достижения и бейджи">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mockAchievements.map((ach) => (
                <div key={ach.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '28px' }}>{ach.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{ach.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {ach.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
