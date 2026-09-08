import React from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Card, Badge, Button, PageHeader } from '../../shared/ui/index.js';
import { formatCurrency } from '../../shared/utils/index.js';

export function ParentDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Кабинет родителя: ${user?.fullName || 'Родитель'}`}
        subtitle="Контроль записей детей, подтверждение заявок и оплата занятий"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Заявки, требующие вашего подтверждения">
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--warning)',
                backgroundColor: 'var(--warning-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Шахматный клуб "Гроссмейстер"</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Ребенок: <b>Александр Иванов (7-Б)</b> • Бесплатно
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="outline">
                  Отклонить
                </Button>
                <Button size="sm" variant="primary">
                  Подтвердить
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Мои дети и их секции">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <strong>Александр Иванов (7-Б класс)</strong>
                  <Badge variant="success">2 активные секции</Badge>
                </div>
                <ul
                  style={{
                    paddingLeft: '20px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <li>Робототехника и Arduino (Пн, Пт 15:30 - 17:00)</li>
                  <li>Шахматный клуб (Ср 16:00 - 17:30)</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Счета и оплата">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Сентябрь 2026: Робототехника
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ fontSize: '16px' }}>{formatCurrency(3500)}</strong>
                  <Badge variant="success">Оплачено</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
