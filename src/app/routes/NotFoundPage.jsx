import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, PageHeader } from '../../shared/ui/index.js';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
      <PageHeader title="404 — Страница не найдена" />
      <Card>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <Link to="/catalog">
          <Button variant="primary">В каталог кружков</Button>
        </Link>
      </Card>
    </div>
  );
}
