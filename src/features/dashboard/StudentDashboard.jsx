import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useParentDashboard } from './useParentDashboard.js';
import { Card, Badge, Button, Spinner, Modal, PageHeader, CountdownTimer } from '../../shared/ui/index.js';
import { formatCurrency, formatDate, formatDaysOfWeek } from '../../shared/utils/index.js';
import { DEMO_ACHIEVEMENTS } from '../../shared/data/demoData.js';

export function StudentDashboard() {
  const { user } = useAuth();
  const {
    enrollments,
    payments,
    loading,
    error,
    cancelModalOpen,
    cancellingEnrollment,
    isCancelling,
    cancelError,
    toastMessage,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
  } = useParentDashboard(user?.id);

  const mockAchievements = DEMO_ACHIEVEMENTS;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`Личный кабинет ученика: ${user?.fullName || 'Ученик'}`}
        subtitle="Ваши секции, расписание занятий, статус оплат и награды"
      />

      {/* Toast alert */}
      {toastMessage && (
        <div
          role="status"
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--success)',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ✅ {toastMessage}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner size="lg" label="Загрузка данных ученика..." />
        </div>
      )}

      {error && (
        <Card
          style={{
            backgroundColor: 'var(--danger-light)',
            borderColor: 'var(--danger)',
            marginBottom: '24px',
          }}
        >
          <p style={{ color: 'var(--danger)', margin: 0 }}>Ошибка загрузки: {error}</p>
        </Card>
      )}

      {!loading && (
        <div className="dashboard-grid">
          {/* Left Column: My Enrollments */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Мои кружки и записи
              </h2>

              <Link to="/catalog">
                <Button size="sm" variant="outline">
                  + Выбрать кружок
                </Button>
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
                <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '17px' }}>
                  Вы пока не записаны в кружки
                </h3>
                <p
                  style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 16px' }}
                >
                  Откройте каталог кружков и выберите интересное направление для развития!
                </p>
                <Link to="/catalog">
                  <Button variant="primary" size="sm">
                    Перейти в каталог
                  </Button>
                </Link>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {enrollments.map((enr) => {
                  const act = enr.activity;
                  const grp = enr.group;
                  const canCancel =
                    enr.status === 'active' || enr.status === 'pending_parent_approval';

                  return (
                    <Card
                      key={enr.id}
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        borderLeft: `4px solid ${
                          enr.status === 'active'
                            ? 'var(--success)'
                            : enr.status === 'pending_parent_approval'
                              ? 'var(--accent-coral)'
                              : enr.status === 'waitlisted'
                                ? 'var(--warning)'
                                : 'var(--border-color)'
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '10px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              marginBottom: '4px',
                            }}
                          >
                            <Badge variant="info">{act.category || 'Кружок'}</Badge>
                            {act.price === 0 ? (
                              <Badge variant="default">Бесплатно</Badge>
                            ) : (
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: 'var(--primary)',
                                }}
                              >
                                {formatCurrency(act.price)}
                              </span>
                            )}
                          </div>
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              margin: 0,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {act.title}
                          </h3>
                        </div>

                        <div>
                          {enr.status === 'active' && <Badge variant="success">Зачислен</Badge>}
                          {enr.status === 'pending_parent_approval' && (
                            <Badge variant="warning">Бронь (ожидает подтверждения)</Badge>
                          )}
                          {enr.status === 'waitlisted' && (
                            <Badge variant="warning">Лист ожидания (№{enr.queuePosition || 1})</Badge>
                          )}
                          {enr.status === 'cancelled' && <Badge variant="default">Отменено</Badge>}
                          {enr.status === 'cancelled_by_timeout' && (
                            <Badge variant="danger">Истекло</Badge>
                          )}
                        </div>
                      </div>

                      {/* Hold Notice for student */}
                      {enr.status === 'pending_parent_approval' && (
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--accent-coral-light)',
                            color: 'var(--accent-coral)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            fontWeight: 500,
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div>⏱ Запись забронирована. Ожидается подтверждение от родителя.</div>
                          <CountdownTimer expiresAt={enr.holdExpiresAt} variant="badge" />
                        </div>
                      )}

                      {/* Waitlist Notice for student */}
                      {enr.status === 'waitlisted' && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            marginBottom: '12px',
                          }}
                        >
                          📋 Вы в листе ожидания на позиции #{enr.queuePosition || 1}. Как только место освободится, вам придёт уведомление!
                        </div>
                      )}

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '8px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginBottom: '14px',
                          padding: '10px 12px',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          📅 <strong>Расписание:</strong> {formatDaysOfWeek(grp.daysOfWeek)}{' '}
                          {grp.startTime}–{grp.endTime}
                        </div>
                        <div>
                          📍 <strong>Кабинет:</strong> {act.location || 'Школа'}
                        </div>
                        <div>
                          👨‍🏫 <strong>Педагог:</strong> {enr.teacherName}
                        </div>
                      </div>

                      {canCancel && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border-color)',
                          }}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCancelModal(enr)}
                            style={{ color: 'var(--danger)', borderColor: 'var(--border-color)' }}
                          >
                            Отменить запись
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Payments and Achievements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Payment Section */}
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 16px',
                  color: 'var(--text-primary)',
                }}
              >
                Статус оплаты
              </h2>

              <Card style={{ borderRadius: 'var(--radius-lg)' }}>
                {payments.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px 0',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    Нет начислений к оплате
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {payments.map((p) => {
                      const statusBadge =
                        p.status === 'paid' ? (
                          <Badge variant="success">Оплачено</Badge>
                        ) : p.status === 'overdue' ? (
                          <Badge variant="danger">Просрочено</Badge>
                        ) : (
                          <Badge variant="warning">Ожидает оплаты</Badge>
                        );

                      return (
                        <div
                          key={p.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                              Срок: <strong>{formatDate(p.dueDate)}</strong>
                            </span>
                            {statusBadge}
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 700 }}>
                            {formatCurrency(p.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div
                  style={{
                    marginTop: '14px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  ℹ️ Оплата производится родителями в школьной администрации.
                </div>
              </Card>
            </div>

            {/* Achievements Section */}
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 16px',
                  color: 'var(--text-primary)',
                }}
              >
                Награды и достижения
              </h2>

              <Card style={{ borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {mockAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '28px' }}>{ach.icon}</span>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {ach.title}
                        </div>
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
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={closeCancelModal}
        title="Отмена записи в кружок"
        maxWidth="480px"
      >
        <div>
          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}
          >
            Вы уверены, что хотите отменить свою запись в кружок{' '}
            <strong>«{cancellingEnrollment?.activity?.title}»</strong>?
          </p>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-light)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              margin: '0 0 20px',
            }}
          >
            ⚠️ Место сразу перейдёт следующему человеку из листа ожидания.
          </p>

          {cancelError && (
            <div
              style={{
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--danger)',
              }}
            >
              {cancelError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={closeCancelModal} disabled={isCancelling}>
              Не отменять
            </Button>
            <Button
              variant="secondary"
              onClick={confirmCancel}
              disabled={isCancelling}
              style={{
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                borderColor: 'var(--danger)',
              }}
            >
              {isCancelling ? 'Отмена...' : 'Да, отменить запись'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
