import React from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Card, Badge, Button, PageHeader } from '../../shared/ui/index.js';

export function CoordinatorDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Всего кружков', value: 14, change: '+2 в этом сезоне' },
    { label: 'Активных групп', value: 28, change: '100% укомплектовано' },
    { label: 'Записано учеников', value: 412, change: '84% охват школы' },
    { label: 'Ожидают подтверждения', value: 18, change: 'В листе ожидания' },
  ];

  return (
    <div>
      <PageHeader
        title={`Панель координатора: ${user?.fullName || 'Координатор'}`}
        subtitle="Сводная аналитика, управление активностями школы и контроль зачисления"
        action={<Button variant="primary">+ Добавить кружок</Button>}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {stats.map((stat, i) => (
          <Card key={i}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>{stat.value}</div>
            <Badge variant="info">{stat.change}</Badge>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card title="Популярные секции">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Робототехника и Arduino</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Преподаватель: Михаил Петров
                </div>
              </div>
              <Badge variant="success">26 / 30 мест (87%)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Театральная студия "Маска"</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Преподаватель: Елена Васильева
                </div>
              </div>
              <Badge variant="success">20 / 20 мест (100%)</Badge>
            </div>
          </div>
        </Card>

        <Card title="Оперативные действия">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button variant="outline">Сформировать ведомость посещаемости</Button>
            <Button variant="outline">Экспорт отчёта по оплатам</Button>
            <Button variant="outline">Рассылка напоминаний родителям</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
