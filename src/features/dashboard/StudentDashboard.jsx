import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  CheckCircle2,
  Clock,
  ClipboardList,
  Calendar,
  MapPin,
  User,
  Info,
  AlertTriangle,
  Trophy,
  Award,
  Star,
  Medal,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useParentDashboard } from './useParentDashboard.js';
import { subscribeStudentExamApplications } from '../exam/api.js';
import { Card, Badge, Button, Spinner, Modal, PageHeader, CountdownTimer } from '../../shared/ui/index.js';
import { formatCurrency, formatDate, formatDaysOfWeek } from '../../shared/utils/index.js';
import { DEMO_ACHIEVEMENTS } from '../../shared/data/demoData.js';

const ACHIEVEMENT_ICONS = [Trophy, Award, Star, Medal];

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

  const [examApplications, setExamApplications] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeStudentExamApplications(user.id, (apps) => {
      setExamApplications(apps || []);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

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

            {enrollments.length === 0 && examApplications.length === 0 ? (
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
                  <Rocket size={24} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: '16px' }}>
                  Вы пока не записаны в кружки
                </h3>
                <p
                  style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}
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
                {/* Exam Applications */}
                {examApplications.map((app) => (
                  <Card
                    key={app.id}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${
                        app.status === 'passed'
                          ? 'var(--success)'
                          : app.status === 'failed'
                            ? 'var(--danger)'
                            : 'var(--warning)'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <Badge variant="warning">Олимпийский резерв</Badge>
                          <Badge variant="default">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <GraduationCap size={13} />
                              Вступительный экзамен
                            </span>
                          </Badge>
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
                          {app.activityTitle || 'Олимпийский резерв'}
                        </h3>
                        {app.groupName && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            Группа: {app.groupName}
                          </div>
                        )}
                      </div>

                      <div>
                        {app.status === 'pending' && (
                          <Badge variant="warning">Заявка на экзамен подана</Badge>
                        )}
                        {app.status === 'passed' && (
                          <Badge variant="success">Экзамен сдан</Badge>
                        )}
                        {app.status === 'failed' && (
                          <Badge variant="danger">Экзамен не сдан</Badge>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '12.5px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        marginTop: '6px',
                      }}
                    >
                      {app.status === 'pending' &&
                        'Заявка передана координатору. Ожидайте проведения и проверки вступительного испытания.'}
                      {app.status === 'passed' &&
                        'Поздравляем! Вступительный экзамен сдан. Вы зачислены в секцию.'}
                      {app.status === 'failed' &&
                        'К сожалению, вступительный экзамен не сдан. Попробуйте выбрать другие направления в каталоге.'}
                    </div>
                  </Card>
                ))}

                {/* Regular Enrollments */}
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

                        <div>
                          {enr.status === 'active' && <Badge variant="success">Зачислен</Badge>}
                          {enr.status === 'pending_parent_approval' && (
                            <Badge variant="warning">Бронь</Badge>
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

                      {/* Hold Notice for student */}
                      {enr.status === 'pending_parent_approval' && (
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
                            <span>Запись забронирована. Ожидается подтверждение от родителя.</span>
                          </div>
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
                          <span>Вы в листе ожидания на позиции #{enr.queuePosition || 1}.</span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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

          {/* Right Column: Payments and Achievements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Payment Section */}
            <div>
              <h2
                style={{
                  fontSize: '17px',
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
                          <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Info size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  <span>Оплата производится родителями в администрации школы.</span>
                </div>
              </Card>
            </div>

            {/* Achievements Section */}
            <div>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  margin: '0 0 16px',
                  color: 'var(--text-primary)',
                }}
              >
                Награды и достижения
              </h2>

              <Card style={{ borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {mockAchievements.map((ach, idx) => {
                    const IconComp = ACHIEVEMENT_ICONS[idx % ACHIEVEMENT_ICONS.length];
                    return (
                      <div
                        key={ach.id}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={18} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {ach.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ach.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              fontSize: '14px',
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
              {isCancelling ? 'Отмена...' : 'Да, отменить запись'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
