import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, User, Calendar, MapPin, CreditCard } from 'lucide-react';
import { useParentInvite } from './useParentInvite.js';
import { Card, Badge, Button, Spinner, PageHeader } from '../../shared/ui/index.js';
import { formatCurrency, formatDate, formatDaysOfWeek } from '../../shared/utils/index.js';

export function ParentInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    inviteData,
    loading,
    error,
    isExpired,
    isAccepted,
    isRejected,
    isSubmitting,
    actionError,
    approve,
    reject,
  } = useParentInvite(token);

  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spinner size="lg" label="Загрузка данных приглашения..." />
      </div>
    );
  }

  // 1. Expired state
  if (isExpired) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '0 16px' }}>
        <Card
          style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 'var(--radius-lg)' }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--warning-light)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Clock size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Срок действия брони истёк
          </h2>
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 24px',
            }}
          >
            Срок действия брони истёк. Место было передано следующему участнику из листа ожидания.
          </p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>
            Перейти в каталог кружков
          </Button>
        </Card>
      </div>
    );
  }

  // 2. Already accepted state or just accepted
  if (isAccepted) {
    const studentName = inviteData?.student?.fullName || 'ребёнка';
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '0 16px' }}>
        <Card
          style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 'var(--radius-lg)' }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Запись подтверждена!
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              margin: '0 0 24px',
            }}
          >
            Запись уже подтверждена! Ждём {studentName} на занятиях.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => navigate('/parent')}>
              В родительский кабинет
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>
              В каталог кружков
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Rejected state
  if (isRejected) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '0 16px' }}>
        <Card
          style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 'var(--radius-lg)' }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <XCircle size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Запись отклонена
          </h2>
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 24px',
            }}
          >
            Вы отклонили запись в кружок. Забронированное место освобождено для других желающих.
          </p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>
            Перейти в каталог кружков
          </Button>
        </Card>
      </div>
    );
  }

  // 4. General Error state
  if (error || !inviteData) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '0 16px' }}>
        <Card style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
          <h3 style={{ color: 'var(--danger)', margin: '0 0 8px' }}>Приглашение не найдено</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            {error ||
              'Ссылка устарела или недействительна. Пожалуйста, обратитесь к координатору школы.'}
          </p>
          <Link to="/catalog">
            <Button variant="outline" size="sm">
              Вернуться в каталог
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { student, activity, group, teacher, paymentTerms, invite } = inviteData;

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 16px' }}>
      <PageHeader
        title="Подтверждение записи ребёнка"
        subtitle="Школьная платформа ExtraHub &bull; Внеурочная деятельность"
      />

      <Card style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Статус приглашения
          </span>
          <Badge variant="warning">Ожидает вашего решения</Badge>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: 'var(--danger)',
              fontSize: '13.5px',
              marginBottom: '20px',
            }}
          >
            {actionError}
          </div>
        )}

        {/* Details Grid */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}
        >
          {/* Student */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  fontWeight: 700,
                }}
              >
                Ученик
              </div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '2px',
                }}
              >
                {student.fullName}
              </div>
            </div>
            {student.className && <Badge variant="info">{student.className}</Badge>}
          </div>

          {/* Activity */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Кружок / Секция</div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              {activity.title}
            </div>
          </div>

          {/* Teacher */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Преподаватель</div>
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <User size={14} color="var(--primary)" />
              <span>{teacher.fullName}</span>
            </div>
          </div>

          {/* Schedule & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Расписание занятий
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ flexShrink: 0 }} />
                <span>{formatDaysOfWeek(group.daysOfWeek)} &bull; {group.startTime}–{group.endTime}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Место проведения
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <span>{activity.location}</span>
              </div>
            </div>
          </div>

          {/* Cost & Payment terms */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Стоимость занятий:
              </span>
              <strong style={{ fontSize: '18px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {activity.price === 0 ? 'Бесплатно' : formatCurrency(activity.price)}
              </strong>
            </div>

            {paymentTerms?.dueDate && activity.price > 0 && (
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Условия оплаты:</strong> срок внесения первого взноса до{' '}
                  <strong>{formatDate(paymentTerms.dueDate)}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Hold Expiration notice */}
          {invite?.expiresAt && (
            <div style={{ fontSize: '12px', color: 'var(--accent-coral)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} style={{ flexShrink: 0 }} />
              <span>Бронь удерживается до {formatDate(invite.expiresAt)}</span>
            </div>
          )}
        </div>

        {/* Mandatory Agreement Checkbox */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '13.5px',
              lineHeight: 1.45,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span>
              Я ознакомлен(а) с расписанием, стоимостью кружка и сроком внесения первого взноса.
            </span>
          </label>
        </div>

        {/* Rejection Confirmation dialog */}
        {showRejectConfirm ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--danger-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger)',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                color: 'var(--danger)',
                fontWeight: 600,
              }}
            >
              Вы уверены, что хотите отклонить запись ребёнка?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectConfirm(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={reject}
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--danger)',
                  color: '#ffffff',
                  borderColor: 'var(--danger)',
                }}
              >
                {isSubmitting ? 'Отклонение...' : 'Да, отклонить запись'}
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outline"
              onClick={() => setShowRejectConfirm(true)}
              disabled={isSubmitting}
            >
              Отклонить
            </Button>

            <Button
              variant="primary"
              onClick={approve}
              disabled={!agreementChecked || isSubmitting}
            >
              {isSubmitting ? 'Подтверждение...' : 'Подтвердить запись ребёнка'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
