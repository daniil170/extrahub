import React from 'react';
import { useCatalog } from './useCatalog.js';
import { Card, Badge, Button, Spinner, PageHeader } from '../../shared/ui/index.js';
import { formatCurrency } from '../../shared/utils/index.js';

export function CatalogPage() {
  const { activities, loading, error } = useCatalog();

  return (
    <div>
      <PageHeader
        title="Каталог кружков и секций"
        subtitle="Выберите интересные направления для дополнительного развития"
      />

      {loading && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spinner size="lg" label="Загрузка списка кружков..." />
        </div>
      )}

      {error && (
        <Card style={{ backgroundColor: 'var(--danger-light)', borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>Ошибка загрузки каталога: {error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {activities.map((act) => (
            <Card key={act.id} title={act.title}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Badge variant="info">{act.category}</Badge>
                <Badge variant="default">{act.ageGroup}</Badge>
              </div>

              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  minHeight: '42px',
                }}
              >
                {act.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                    Стоимость
                  </span>
                  <strong style={{ fontSize: '16px' }}>
                    {act.price === 0 ? 'Бесплатно' : formatCurrency(act.price)}
                  </strong>
                </div>

                <Button size="sm" variant="primary">
                  Записаться
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
