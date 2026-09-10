import { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useEquipmentIssues } from './useEquipmentIssues.js';
import { EquipmentIssueCard } from './EquipmentIssueCard.jsx';
import { IssueDetailsModal } from './IssueDetailsModal.jsx';
import { CreateIssueModal } from './CreateIssueModal.jsx';
import { PageHeader, Card, Button, Spinner, Modal } from '../../shared/ui/index.js';
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_META,
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_META,
} from '../../entities/equipmentIssue/model.js';

/**
 * Technician and Administrator maintenance dashboard (/technician)
 */
export function TechnicianDashboard() {
  const { user } = useAuth();
  const {
    issues,
    allIssues,
    loading,
    error,
    stats,
    filters,
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    setSearchQuery,
    resetFilters,
    createIssue,
    takeIntoWork,
    resolveIssue,
    cancelIssue,
    addComment,
    getComments,
  } = useEquipmentIssues();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Standalone resolve modal state
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const handleOpenResolve = (issue) => {
    setResolvingIssue(issue);
    setResolutionComment('');
    setResolveError('');
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolutionComment.trim()) {
      setResolveError('Укажите отчёт о выполненной работе');
      return;
    }
    try {
      setSubmittingResolve(true);
      await resolveIssue(resolvingIssue.id, resolutionComment.trim());
      setResolvingIssue(null);
    } catch (err) {
      setResolveError(err.message || 'Ошибка');
    } finally {
      setSubmittingResolve(false);
    }
  };

  // Group issues into kanban columns
  const kanbanColumns = [
    {
      id: 'new',
      title: 'Новые заявки',
      icon: '📥',
      badgeColor: '#3b82f6',
      items: issues.filter((i) => i.status === 'new'),
    },
    {
      id: 'in_progress',
      title: 'В работе',
      icon: '⚙️',
      badgeColor: '#f59e0b',
      items: issues.filter((i) => i.status === 'in_progress'),
    },
    {
      id: 'resolved',
      title: 'Закрытые / Выполнено',
      icon: '✅',
      badgeColor: '#10b981',
      items: issues.filter((i) => i.status === 'resolved'),
    },
  ];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '56px' }}>
      <PageHeader
        title="Панель технической службы и ремонта"
        subtitle="Мониторинг неисправностей оборудования, исполнение заявок и статистика ремонтов"
        action={
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>➕</span>
            <span>Создать заявку</span>
          </Button>
        }
      />

      {/* Top Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              fontSize: '28px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            📋
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Всего открыто
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stats.totalOpen}
            </div>
          </div>
        </Card>

        <Card
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: stats.criticalCount > 0 ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
            backgroundColor: stats.criticalCount > 0 ? 'rgba(230, 57, 70, 0.06)' : 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              backgroundColor: stats.criticalCount > 0 ? 'var(--danger-light)' : 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🚨
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                color: stats.criticalCount > 0 ? 'var(--danger)' : 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Критические заявки
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: stats.criticalCount > 0 ? 'var(--danger)' : 'var(--text-primary)',
              }}
            >
              {stats.criticalCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              fontSize: '28px',
              backgroundColor: 'var(--warning-light)',
              borderRadius: 'var(--radius-md)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⏳
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              В работе
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>
              {stats.inProgressCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              fontSize: '28px',
              backgroundColor: 'var(--success-light)',
              borderRadius: 'var(--radius-md)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Успешно закрыто
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>
              {stats.resolvedCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              fontSize: '28px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⏱️
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Ср. время ремонта
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stats.avgResolutionHours}
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and View Controls Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search bar */}
          <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="🔍 Поиск по названию, кабинету или автору..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Select Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Приоритет:</span>
            <select
              value={filters.priority}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <option value="all">Все приоритеты</option>
              <option value="critical">🔴 Критический</option>
              <option value="high">🟠 Высокий</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">🟢 Низкий</option>
            </select>
          </div>

          {/* Select Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Категория:</span>
            <select
              value={filters.category}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <option value="all">Все категории</option>
              {Object.values(ISSUE_CATEGORIES).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {ISSUE_CATEGORY_META[catKey].icon} {ISSUE_CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>

          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'kanban' ? 600 : 400,
                backgroundColor: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              📋 Канбан
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'list' ? 600 : 400,
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              📑 Список ({issues.length})
            </button>
          </div>

          {(filters.priority !== 'all' || filters.category !== 'all' || filters.search) && (
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      </Card>

      {/* Loading & Error */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner size="lg" label="Загрузка данных технической службы..." />
        </div>
      ) : error ? (
        <Card style={{ borderColor: 'var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
          {error}
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '400px',
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{col.icon}</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{col.title}</h4>
                </div>
                <span
                  style={{
                    backgroundColor: col.badgeColor,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {col.items.length}
                </span>
              </div>

              {/* Items in Column */}
              {col.items.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  В этой колонке нет заявок
                </div>
              ) : (
                col.items.map((issue) => (
                  <EquipmentIssueCard
                    key={issue.id}
                    issue={issue}
                    currentUserRole={user?.role || 'technician'}
                    currentUserId={user?.id}
                    onOpenDetails={(iss) => setSelectedIssue(iss)}
                    onTakeIntoWork={(id) => takeIntoWork(id)}
                    onOpenResolveModal={handleOpenResolve}
                    onCancelIssue={(id) => cancelIssue(id, 'Отменено техником')}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px',
          }}
        >
          {issues.length === 0 ? (
            <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Заявок по заданным критериям не найдено</h4>
            </Card>
          ) : (
            issues.map((issue) => (
              <EquipmentIssueCard
                key={issue.id}
                issue={issue}
                currentUserRole={user?.role || 'technician'}
                currentUserId={user?.id}
                onOpenDetails={(iss) => setSelectedIssue(iss)}
                onTakeIntoWork={(id) => takeIntoWork(id)}
                onOpenResolveModal={handleOpenResolve}
                onCancelIssue={(id) => cancelIssue(id, 'Отменено техником')}
              />
            ))
          )}
        </div>
      )}

      {/* Standalone Resolve Modal */}
      {resolvingIssue && (
        <Modal
          isOpen={Boolean(resolvingIssue)}
          onClose={() => setResolvingIssue(null)}
          title={`Закрытие заявки: ${resolvingIssue.title}`}
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {resolveError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                }}
              >
                ⚠️ {resolveError}
              </div>
            )}

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Кабинет: <b>{resolvingIssue.location}</b> | Заявитель: <b>{resolvingIssue.reportedByName}</b>
            </div>

            <div>
              <label
                htmlFor="quick-resolve-comment"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Отчёт о решении проблемы (обязательно) *
              </label>
              <textarea
                id="quick-resolve-comment"
                rows={3}
                placeholder="Опишите, что было сделано (замена деталей, настройка, ремонт)..."
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResolvingIssue(null)}
                disabled={submittingResolve}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: 'var(--success)', color: '#ffffff', border: 'none' }}
                disabled={submittingResolve}
              >
                {submittingResolve ? 'Сохранение...' : '✓ Подтвердить и закрыть'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details & Discussion Modal */}
      <IssueDetailsModal
        isOpen={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        currentUser={user}
        onTakeIntoWork={takeIntoWork}
        onResolve={resolveIssue}
        onCancel={cancelIssue}
        onAddComment={addComment}
        onGetComments={getComments}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createIssue}
      />
    </div>
  );
}
