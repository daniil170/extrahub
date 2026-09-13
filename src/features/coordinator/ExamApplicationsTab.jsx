import { useState, useEffect } from 'react';
import {
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { subscribeCoordinatorExamApplications } from '../exam/api.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

export function ExamApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'resolved'

  useEffect(() => {
    const unsubscribe = subscribeCoordinatorExamApplications(
      (apps) => {
        setApplications(apps);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err?.code === 'permission-denied') {
          setErrorMessage(
            'Недостаточно прав для чтения заявок на экзамен. Пожалуйста, задеплойте обновлённые правила: firebase deploy --only firestore:rules'
          );
        } else {
          setErrorMessage(err.message || 'Ошибка при загрузке заявок');
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredApps = applications.filter((app) => {
    if (filter === 'pending') return app.status === 'pending';
    if (filter === 'resolved') return app.status === 'passed' || app.status === 'failed';
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const passedCount = applications.filter((a) => a.status === 'passed').length;
  const failedCount = applications.filter((a) => a.status === 'failed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Summary */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Мониторинг вступительных экзаменов
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Статистика заявок в секции олимпийского резерва (оценивание проводит преподаватель)
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Все ({applications.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'pending' ? 'primary' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Ожидают ({pendingCount})
            </Button>
            <Button
              size="sm"
              variant={filter === 'resolved' ? 'primary' : 'outline'}
              onClick={() => setFilter('resolved')}
            >
              Обработаны ({passedCount + failedCount})
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Всего заявок</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{applications.length}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>На проверке</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)', marginTop: '2px' }}>{pendingCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Успешно сдали</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>{passedCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Не сдали</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)', marginTop: '2px' }}>{failedCount}</div>
          </div>
        </div>
      </div>

      {/* Info Notice for Coordinator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span>
          <strong>Примечание:</strong> Оценку («Прошёл» / «Не прошёл») и баллы выставляет назначенный преподаватель курса в своём личном кабинете. Данный раздел предоставляет координатору сводную статистику для контроля процесса.
        </span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner size="md" label="Загрузка заявок на экзамен..." />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredApps.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <h4
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              margin: '0 0 6px',
              color: 'var(--text-primary)',
            }}
          >
            Нет заявок на экзамен
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {filter === 'pending'
              ? 'На данный момент нет новых заявок, ожидающих проверки преподавателем.'
              : 'Заявки на вступительные экзамены пока не поступали.'}
          </p>
        </Card>
      )}

      {/* Application Cards (Read-only for Coordinator) */}
      {!loading && filteredApps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredApps.map((app) => {
            return (
              <Card
                key={app.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${
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
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  {/* Info Column */}
                  <div style={{ flex: '1 1 320px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Badge variant="warning">Олимпийский резерв</Badge>
                      {app.status === 'pending' && (
                        <Badge variant="warning">Ожидает проверки учителем</Badge>
                      )}
                      {app.status === 'passed' && (
                        <Badge variant="success">Прошёл (Зачислен)</Badge>
                      )}
                      {app.status === 'failed' && (
                        <Badge variant="danger">Не прошёл</Badge>
                      )}
                      {app.score !== null && app.score !== undefined && (
                        <Badge variant="default">
                          Балл: {app.score} / {app.maxScore || 100}
                        </Badge>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-heading)',
                        margin: '0 0 8px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {app.activityTitle || 'Кружок олимпийского резерва'}
                    </h4>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '8px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>
                          <strong>Ученик:</strong> {app.studentName || 'Не указан'}{' '}
                          {app.className ? `(${app.className} кл.)` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>
                          <strong>Группа:</strong> {app.groupName || 'Основная'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>
                          <strong>Подано:</strong> {app.appliedAt ? formatDate(app.appliedAt) : 'Недавно'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Evaluation Details Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: '6px',
                      alignSelf: 'center',
                    }}
                  >
                    {app.status === 'pending' ? (
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--warning)',
                          backgroundColor: 'var(--warning-light)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={14} />
                        <span>На проверке у учителя</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: app.status === 'passed' ? 'var(--success)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {app.status === 'passed' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                          <span>{app.status === 'passed' ? 'Экзамен сдан' : 'Экзамен не сдан'}</span>
                        </div>
                        {app.gradedAt && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Проверено {formatDate(app.gradedAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
