import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Backpack,
  Clock,
  ClipboardList,
  Calendar,
  MapPin,
  User,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useParentDashboard } from './useParentDashboard.js';
import { Card, Badge, Button, Spinner, Modal, PageHeader, CountdownTimer } from '../../shared/ui/index.js';
import { formatCurrency, formatDate, formatDaysOfWeek } from '../../shared/utils/index.js';

export function ParentDashboard() {
  const {
    children,
    activeStudentId,
    setActiveStudentId,
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
  } = useParentDashboard();

  const activeChild = children.find((c) => c.id === activeStudentId) || children[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title="Кабинет родителя"
        subtitle="Управление записями детей, контроль расписания и статусы оплаты"
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
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--success)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Children Selector Tabs */}
      {children.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            padding: '6px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            width: 'fit-content',
            maxWidth: '100%',
            flexWrap: 'wrap',
            border: '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '0 8px 0 6px',
            }}
          >
            Ребёнок:
          </span>
          {children.map((child) => {
            const isSelected = child.id === activeStudentId;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setActiveStudentId(child.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{child.fullName}</span>
                {child.className && (
                  <span
                    style={{
                      fontSize: '12px',
                      opacity: isSelected ? 0.9 : 0.7,
                    }}
                  >
                    ({child.className})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner size="lg" label="Загрузка данных кабинета..." />
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
          {/* Left Column: My Activities & Enrollments */}
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
                  fontSize: '18px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Мои кружки и записи {activeChild ? `(${activeChild.fullName})` : ''}
              </h2>

              <Link to="/catalog">
                <Button size="sm" variant="outline">
                  + Найти новый кружок
                </Button>
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Backpack size={24} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: '16px' }}>
                  Нет активных записей
                </h3>
                <p
                  style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}
                >
                  Ученик пока не записан ни в один кружок. Выберите интересующее направление в
                  каталоге.
                </p>
                <Link to="/catalog">
                  <Button variant="primary" size="sm">
                    Перейти в каталог кружков
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
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${
                          enr.status === 'active'
                            ? 'var(--success)'
                            : enr.status === 'pending_parent_approval'
                              ? 'var(--warning)'
                              : enr.status === 'waitlisted'
                                ? 'var(--warning)'
                                : 'var(--border-color)'
                        }`,
                      }}
                    >
                      {/* Card Header */}
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
                                  fontFamily: 'var(--font-heading)',
                                  color: 'var(--primary)',
                                }}
                              >
                                {formatCurrency(act.price)}
                              </span>
                            )}
                          </div>
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-heading)',
                              margin: 0,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {act.title}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {enr.status === 'active' && <Badge variant="success">Зачислен</Badge>}
                          {enr.status === 'pending_parent_approval' && (
                            <Badge variant="warning">Бронь (ожидает)</Badge>
                          )}
                          {enr.status === 'waitlisted' && (
                            <Badge variant="warning">Ожидание #{enr.queuePosition || 1}</Badge>
                          )}
                          {enr.status === 'cancelled' && <Badge variant="default">Отменено</Badge>}
                          {enr.status === 'cancelled_by_timeout' && (
                            <Badge variant="danger">Истекло</Badge>
                          )}
                        </div>
                      </div>

                      {/* Pending Hold Notice */}
                      {enr.status === 'pending_parent_approval' && enr.holdExpiresAt && (
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            fontSize: '12px',
                            fontWeight: 500,
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} />
                            <span>
                              Бронь места удерживается до {formatDate(enr.holdExpiresAt)}. Пожалуйста,
                              подтвердите участие или отмените бронь.
                            </span>
                          </div>
                          <CountdownTimer expiresAt={enr.holdExpiresAt} variant="badge" />
                        </div>
                      )}

                      {/* Waitlist Notice */}
                      {enr.status === 'waitlisted' && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            fontSize: '12px',
                            fontWeight: 500,
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <ClipboardList size={13} />
                          <span>Заявка находится в листе ожидания на позиции #{enr.queuePosition || 1}.</span>
                        </div>
                      )}

                      {/* Schedule and Teacher Details */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '8px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginBottom: '14px',
                          padding: '10px 12px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span><strong>Расписание:</strong> {formatDaysOfWeek(grp.daysOfWeek)} {grp.startTime}–{grp.endTime}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                          <span><strong>Кабинет:</strong> {act.location || 'Школа'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          <span><strong>Педагог:</strong> {enr.teacherName}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      {canCancel && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            paddingTop: '12px',
                            marginTop: '12px',
                            borderTop: '1px solid var(--border-color)',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-cancel-enrollment"
                            onClick={() => openCancelModal(enr)}
                            title="Отменить запись в кружок"
                          >
                            <span>Отменить запись</span>
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Payment Status */}
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                margin: '0 0 16px',
                color: 'var(--text-primary)',
              }}
            >
              Статус оплаты
            </h2>

            <Card style={{ borderRadius: 'var(--radius-md)' }}>
              {payments.length === 0 ? (
                <div
                  style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}
                >
                  Нет выставленных счетов
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-subtle)',
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
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Срок: <strong>{formatDate(p.dueDate)}</strong>
                          </span>
                          {statusBadge}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginTop: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '17px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatCurrency(p.amount)}
                          </span>
                          {p.paidAt && (
                            <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                              Оплачено {formatDate(p.paidAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Offline payment memo */}
              <div
                style={{
                  marginTop: '18px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  borderLeft: '3px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Info size={14} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Оплата занятий:</strong> производится офлайн через администрацию школы.
                  После внесения средств координатор обновит статус в системе.
                </div>
              </div>
            </Card>
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
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}
          >
            Вы уверены, что хотите отменить запись в кружок{' '}
            <strong>«{cancellingEnrollment?.activity?.title}»</strong>?
          </p>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-light)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              margin: '0 0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={15} />
            <span>Место сразу перейдёт следующему человеку из листа ожидания.</span>
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
              variant="danger"
              onClick={confirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Отмена записи...' : 'Да, отменить запись'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
