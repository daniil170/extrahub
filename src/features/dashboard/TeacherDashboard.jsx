import React, { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Card, Badge, Button, PageHeader } from '../../shared/ui/index.js';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState('group-1');

  const groups = [
    {
      id: 'group-1',
      title: 'Робототехника (Группа 1)',
      schedule: 'Пн, Пт 15:30 - 17:00',
      studentsCount: 14,
      capacity: 15,
    },
    {
      id: 'group-2',
      title: 'Робототехника (Группа 2)',
      schedule: 'Вт, Чт 16:00 - 17:30',
      studentsCount: 12,
      capacity: 15,
    },
  ];

  const studentsList = [
    { id: 'stud-1', name: 'Александр Иванов', class: '7-Б', status: 'present' },
    { id: 'stud-2', name: 'Дарья Смирнова', class: '7-А', status: 'present' },
    { id: 'stud-3', name: 'Илья Кузнецов', class: '8-В', status: 'absent' },
  ];

  return (
    <div>
      <PageHeader
        title={`Кабинет преподавателя: ${user?.fullName || 'Преподаватель'}`}
        subtitle="Журнал посещаемости, список групп и выдача достижений"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div>
          <Card title="Мои группы">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor:
                      selectedGroup === grp.id ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor:
                      selectedGroup === grp.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{grp.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {grp.schedule}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <Badge variant="info">
                      {grp.studentsCount} / {grp.capacity} мест
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card
            title="Журнал посещаемости (Сегодня: 08.09.2026)"
            action={<Button size="sm">Сохранить журнал</Button>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {studentsList.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{st.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Класс: {st.class}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      size="sm"
                      variant={st.status === 'present' ? 'primary' : 'outline'}
                    >
                      Присутствует
                    </Button>
                    <Button
                      size="sm"
                      variant={st.status === 'absent' ? 'danger' : 'outline'}
                    >
                      Отсутствует
                    </Button>
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
