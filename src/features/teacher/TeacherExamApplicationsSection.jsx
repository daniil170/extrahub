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
  Award,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  subscribeTeacherExamApplications,
  subscribeCoordinatorExamApplications,
  decideExamApplicationRecord,
} from '../exam/api.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

export function TeacherExamApplicationsSection() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeTeacherExamApplications(
      user.id,
      (apps) => {
        if (apps.length > 0) {
          setApplications(apps);
          setLoading(false);
        } else {
          // If no apps with this specific teacherId, check all exam applications in demo
          const unsubAll = subscribeCoordinatorExamApplications(
            (allApps) => {
              const myApps = allApps.filter(
                (a) => !a.teacherId || a.teacherId === user.id || a.teacherId === 'teacher-1'
              );
              setApplications(myApps.length > 0 ? myApps : allApps);
              setLoading(false);
            },
            () => {
              setApplications(apps);
              setLoading(false);
            }
          );
          return () => unsubAll();
        }
      },
      (err) => {
        setLoading(false);
        if (err?.code === 'permission-denied') {
          setErrorMessage(
            'Недостаточно прав для чтения заявок на экзамен. Убедитесь, что правила firestore.rules обновлены в облаке.'
          );
        } else {
          setErrorMessage(err.message || 'Ошибка загрузки заявок на экзамен');
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

  const handleScoreChange = (appId, val) => {
    setScores((prev) => ({ ...prev, [appId]: val }));
  };

  const handleDecision = async (app, status) => {
    setProcessingId(app.id);
    setFeedbackMessage(null);
    setErrorMessage(null);

    const scoreInput = scores[app.id];

    try {
      await decideExamApplicationRecord({
        applicationId: app.id,
        status,
        score: scoreInput,
        maxScore: 100,
        studentId: app.studentId,
        groupId: app.groupId,
        gradedBy: user?.id || 'teacher',
      });

      setFeedbackMessage(
        status === 'passed'
          ? `Ученик ${app.studentName || 'ученик'} успешно сдал экзамен${
              scoreInput ? ` (балл: ${scoreInput})` : ''
            } и зачислен в группу!`
          : `Заявка ученика ${app.studentName || 'ученик'} отклонена (экзамен не сдан).`
      );
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      console.error('Error grading exam application:', err);
      setErrorMessage(err.message || 'Ошибка при выставлении оценки за экзамен');
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
  const resolvedCount = applications.filter((a) => a.status === 'passed' || a.status === 'failed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header card with filters */}
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
              Проверка вступительных экзаменов
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Оценивание кандидатов в ваши секции олимпийского резерва
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant={filter === 'pending' ? 'primary' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Ожидают проверки ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'resolved' ? 'primary' : 'outline'}
            onClick={() => setFilter('resolved')}
          >
            Проверенные ({resolvedCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Все ({applications.length})
          </Button>
        </div>
      </div>

      {/* Success Notification */}
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

      {/* Error Notification */}
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
          <Spinner size="md" label="Загрузка экзаменационных заявок..." />
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
            {filter === 'pending'
              ? 'Нет заявок, ожидающих проверки'
              : 'Список заявок пуст'}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {filter === 'pending'
              ? 'Все кандидаты проверены. Новые заявки от учеников появятся здесь автоматически.'
              : 'Пока кандидаты не подавали заявки на вступительные экзамены в ваши группы.'}
          </p>
        </Card>
      )}

      {/* Applications List */}
      {!loading && filteredApps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredApps.map((app) => {
            const isProcessing = processingId === app.id;
            const currentScore = scores[app.id] ?? (app.score ?? '');

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
                  {/* Candidate and Subject Details */}
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
                        <Badge variant="warning">Ожидает вашего решения</Badge>
                      )}
                      {app.status === 'passed' && (
                        <Badge variant="success">Экзамен сдан (Зачислен)</Badge>
                      )}
                      {app.status === 'failed' && (
                        <Badge variant="danger">Экзамен не сдан</Badge>
                      )}
                      {app.score !== null && app.score !== undefined && (
                        <Badge variant="default" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Award size={12} />
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

                  {/* Teacher Evaluation & Action Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '10px',
                      alignSelf: 'center',
                    }}
                  >
                    {app.status === 'pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        {/* Optional Score Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label
                            htmlFor={`score-${app.id}`}
                            style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}
                          >
                            Балл (0–100):
                          </label>
                          <input
                            id={`score-${app.id}`}
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Напр. 85"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(app.id, e.target.value)}
                            style={{
                              width: '90px',
                              padding: '6px 8px',
                              fontSize: '13px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              textAlign: 'center',
                            }}
                          />
                        </div>

                        {/* Decision Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                            Не прошёл
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
                            {isProcessing ? 'Обработка...' : 'Прошёл'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: app.status === 'passed' ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {app.status === 'passed' ? 'Решение: Прошёл' : 'Решение: Не прошёл'}
                        </div>
                        {app.score !== null && app.score !== undefined && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Итоговый балл: <strong>{app.score}</strong> / {app.maxScore || 100}
                          </div>
                        )}
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
