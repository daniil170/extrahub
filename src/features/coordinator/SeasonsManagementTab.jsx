import { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge, Modal, Spinner } from '../../shared/ui/index.js';
import { LEAGUE_CONFIG } from '../../entities/league/model.js';
import {
  subscribeAllSeasons,
  subscribeSeasonDivisions,
  createSeasonCall,
  finalizeSeasonAndPromoteCall,
} from '../league/api.js';
import { formatDate } from '../../shared/utils/index.js';

export function SeasonsManagementTab() {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Season Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Finalize Season Modal state
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [nextSeasonName, setNextSeasonName] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');
  const [finalizeResult, setFinalizeResult] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllSeasons((list) => {
      setSeasons(list);
      const active = list.find((s) => s.status === 'active') || list[0] || null;
      setActiveSeason(active);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeSeason?.id) return;
    const unsubscribe = subscribeSeasonDivisions(activeSeason.id, (divs) => {
      setDivisions(divs);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeSeason?.id]);

  const handleCreateSeason = async (e) => {
    if (e) e.preventDefault();
    if (!seasonName.trim()) {
      setCreateError('Укажите название сезона');
      return;
    }
    setIsCreating(true);
    setCreateError('');

    try {
      await createSeasonCall({
        name: seasonName.trim(),
        startDate,
        endDate,
      });

      setToastMessage('Новый сезон успешно создан и все ученики распределены в Бронзовую лигу!');
      setCreateModalOpen(false);
      setSeasonName('');
    } catch (err) {
      setCreateError(err.message || 'Ошибка создания сезона');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinalizeSeason = async () => {
    if (!activeSeason?.id) return;
    setIsFinalizing(true);
    setFinalizeError('');

    try {
      const res = await finalizeSeasonAndPromoteCall({
        seasonId: activeSeason.id,
        nextSeasonName: nextSeasonName.trim() || undefined,
      });

      setFinalizeResult(res.summary);
      setToastMessage('Сезон успешно завершён! Топ-5 повышены, нижние 5 понижены в лиги.');
    } catch (err) {
      setFinalizeError(err.message || 'Ошибка завершения сезона');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          style={{
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

      {/* Header Actions Card */}
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
              }}
            >
              Управление соревновательными сезонами и лигами
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Контроль учебных четвертей, дивизионов (Бронза, Серебро, Золото, Алмаз) и автоматического повышения/понижения
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Создать новый сезон</span>
            </Button>

            {activeSeason && activeSeason.status === 'active' && (
              <Button
                variant="primary"
                onClick={() => {
                  setFinalizeResult(null);
                  setFinalizeModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trophy size={15} />
                <span>Завершить сезон и распределить лиги</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Season Info */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spinner size="md" label="Загрузка сезонов..." />
          </div>
        ) : activeSeason ? (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeSeason.name}
                  </span>
                  <Badge variant={activeSeason.status === 'active' ? 'success' : 'default'}>
                    {activeSeason.status === 'active' ? 'Текущий активный сезон' : 'Завершён'}
                  </Badge>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Период: <strong>{formatDate(activeSeason.startDate)}</strong> — <strong>{formatDate(activeSeason.endDate)}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Дивизионов</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {divisions.length || 1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
            Нет активного сезона. Нажмите «Создать новый сезон», чтобы инициализировать лиги.
          </div>
        )}
      </Card>

      {/* Divisions Grid */}
      {divisions.length > 0 && (
        <Card style={{ borderRadius: 'var(--radius-lg)' }}>
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
            }}
          >
            Дивизионы текущего сезона
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            {divisions.map((div) => {
              const rankMeta = LEAGUE_CONFIG.RANKS[div.rank] || LEAGUE_CONFIG.RANKS.bronze;

              return (
                <div
                  key={div.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: `1px solid ${rankMeta.badgeColor}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '24px' }}>{rankMeta.icon}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {div.name || rankMeta.label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Группа {div.groupNumber || 1}
                      </div>
                    </div>
                  </div>

                  <Badge variant="default">До 30 уч.</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create Season Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Создание нового учебного сезона"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateSeason} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Название сезона / четверти:
            </label>
            <input
              type="text"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              placeholder="Например: Осенний сезон 2026 (1 четверть)"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Дата начала:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Дата окончания:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Все активные ученики школы будут автоматически распределены в Бронзовую лигу с 0 очков за сезон.
          </div>

          {createError && (
            <div style={{ color: 'var(--danger)', fontSize: '13px' }}>
              {createError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={isCreating}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Создание...' : 'Создать сезон'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finalize Season Modal */}
      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Завершение сезона и распределение лиг"
        maxWidth="520px"
      >
        <div>
          {finalizeResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--success-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>Сезон успешно завершён и сформирован новый сезон!</span>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <div>Всего учеников обработано: <strong>{finalizeResult.totalStudentsProcessed}</strong></div>
                <div style={{ color: 'var(--success)' }}>
                  Повышено в лигу выше (топ-5): <strong>+{finalizeResult.promotedCount}</strong>
                </div>
                <div style={{ color: 'var(--danger)' }}>
                  Понижено в лигу ниже (нижние 5): <strong>-{finalizeResult.relegatedCount}</strong>
                </div>
                <div>Сохранили лигу: <strong>{finalizeResult.maintainedCount}</strong></div>
                <div>Создано дивизионов в новом сезоне: <strong>{finalizeResult.newDivisionsCount}</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setFinalizeModalOpen(false)}>
                  Готово
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Внимание!</strong> Это действие необратимо. Текущий сезон будет закрыт, результаты зафиксированы, топ-5 участников каждой группы будут повышены в следующий ранг, а нижние 5 — переведены в ранг ниже.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Название следующего сезона (опционально):
                </label>
                <input
                  type="text"
                  value={nextSeasonName}
                  onChange={(e) => setNextSeasonName(e.target.value)}
                  placeholder="Например: Зимний сезон 2026 (2 четверть)"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {finalizeError && (
                <div style={{ color: 'var(--danger)', fontSize: '13px' }}>
                  {finalizeError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" onClick={() => setFinalizeModalOpen(false)} disabled={isFinalizing}>
                  Отмена
                </Button>
                <Button variant="danger" onClick={handleFinalizeSeason} disabled={isFinalizing}>
                  {isFinalizing ? 'Завершение и перераспределение...' : 'Да, завершить сезон'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
