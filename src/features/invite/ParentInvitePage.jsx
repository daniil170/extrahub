import React from 'react';
import { useParams } from 'react-router-dom';
import { useParentInvite } from './useParentInvite.js';
import { Card, Badge, Button, Spinner, PageHeader } from '../../shared/ui/index.js';
import { formatCurrency, formatDate } from '../../shared/utils/index.js';

export function ParentInvitePage() {
  const { token } = useParams();
  const { invite, loading, error, isAccepted, accept } = useParentInvite(token);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка приглашения..." />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <Card style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Приглашение не найдено</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Ссылка устарела или недействительна. Обратитесь к школьному координатору.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <PageHeader
        title="Подтверждение записи ребенка"
        subtitle="Школьная платформа ExtraHub"
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Статус</span>
          <Badge variant={isAccepted ? 'success' : 'warning'}>
            {isAccepted ? 'Подтверждено' : 'Ожидает вашего решения'}
          </Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ученик</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{invite.studentName}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Кружок / Секция</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{invite.activityTitle}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Расписание занятий</div>
            <div style={{ fontSize: '14px' }}>{invite.groupSchedule}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Стоимость</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
              {invite.price === 0 ? 'Бесплатно' : formatCurrency(invite.price)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Действует до</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {formatDate(invite.expiresAt)}
            </div>
          </div>
        </div>

        {isAccepted ? (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            ✅ Запись успешно подтверждена! Ждём ребенка на занятиях.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="outline">Отклонить</Button>
            <Button variant="primary" onClick={() => accept('parent-1')}>
              Подтвердить запись
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
