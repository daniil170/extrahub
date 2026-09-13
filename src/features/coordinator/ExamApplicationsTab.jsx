import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  subscribeCoordinatorExamApplications,
  decideExamApplicationRecord,
} from '../exam/api.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

export function ExamApplicationsTab() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'resolved'

  useEffect(() => {
    const unsubscribe = subscribeCoordinatorExamApplications((apps) => {
      setApplications(apps);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDecision = async (app, status) => {
    setProcessingId(app.id);
    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      await decideExamApplicationRecord({
        applicationId: app.id,
        studentId: app.studentId,
        groupId: app.groupId,
        status,
        coordinatorId: user?.id || 'coordinator',
      });

      setFeedbackMessage(
        status === 'passed'
          ? `Ученик ${app.studentName || 'ученик'} успешно сдал экзамен и зачислен в группу!`
          : `Заявка ученика ${app.studentName || 'ученик'} отклонена (экзамен не сдан).`
      );
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      console.error('Error deciding exam application:', err);
      setErrorMessage(err.message || 'Ошибка при сохранении решения по экзамену');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filter === 'pending') return app.status === 'pending';
    if (filter === 'resolved') return app.status === 'passed' || app.status === 'failed';
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
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
              Заявки на вступительные экзамены
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Кружки олимпийского резерва с обязательным вступительным испытанием
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
            Обработанные
          </Button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {feedbackMessage && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--success)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{feedbackMessage}</span>
        </div>
      )}

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
              ? 'На данный момент нет новых заявок, ожидающих решения.'
              : 'Заявки на вступительные экзамены пока не поступали.'}
          </p>
        </Card>
      )}

      {/* Application Cards */}
      {!loading && filteredApps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredApps.map((app) => {
            const isProcessing = processingId === app.id;

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
                  {/* Info Left Column */}
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
                        <Badge variant="warning">Ожидает решения</Badge>
                      )}
                      {app.status === 'passed' && (
                        <Badge variant="success">Сдал (Зачислен)</Badge>
                      )}
                      {app.status === 'failed' && (
                        <Badge variant="danger">Не сдал</Badge>
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
                          {app.className ? `(${app.className})` : ''}
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

                  {/* Actions Column */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      alignSelf: 'center',
                    }}
                  >
                    {app.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(app, 'failed')}
                          disabled={isProcessing}
                          style={{
                            borderColor: 'var(--danger)',
                            color: 'var(--danger)',
                          }}
                        >
                          <XCircle size={15} style={{ marginRight: '4px' }} />
                          Не сдал
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleDecision(app, 'passed')}
                          disabled={isProcessing}
                          style={{
                            backgroundColor: 'var(--success)',
                            borderColor: 'var(--success)',
                          }}
                        >
                          <CheckCircle2 size={15} style={{ marginRight: '4px' }} />
                          {isProcessing ? 'Обработка...' : 'Сдал (Зачислить)'}
                        </Button>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Решение принято {app.decidedAt ? formatDate(app.decidedAt) : ''}
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
