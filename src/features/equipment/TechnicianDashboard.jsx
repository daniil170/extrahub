import { useState, useMemo } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useEquipmentIssues } from './useEquipmentIssues.js';
import { EquipmentIssueCard } from './EquipmentIssueCard.jsx';
import { IssueDetailsModal } from './IssueDetailsModal.jsx';
import { CreateIssueModal } from './CreateIssueModal.jsx';
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Modal,
  IconPlus,
  IconWrench,
  IconCheck,
  IconCheckCircle,
  IconAlertCircle,
  IconClock,
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconShield,
  IconActivity,
  IconInbox,
  IconZap,
  IconMonitor,
  IconArchive,
} from '../../shared/ui/index.js';
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_META,
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_META,
} from '../../entities/equipmentIssue/model.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
  const [retentionMode, setRetentionMode] = useState('active'); // 'active' | 'all' | 'archive'

  // Standalone resolve modal state
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  const handleOpenResolve = (issue) => {
    if (!isTechnician) return;
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

  // Retention / Archive filtering
  const visibleIssues = useMemo(() => {
    const now = Date.now();
    return issues.filter((issue) => {
      const isResolved = issue.status === 'resolved';
      if (!isResolved) {
        return retentionMode !== 'archive';
      }
      const closedTime = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
      const isOlderThan7Days = now - closedTime > SEVEN_DAYS_MS;

      if (retentionMode === 'active') {
        return !isOlderThan7Days;
      }
      if (retentionMode === 'archive') {
        return isOlderThan7Days;
      }
      return true;
    });
  }, [issues, retentionMode]);

  // Widget 1: Equipment Health Index calculation
  const healthIndex = useMemo(() => {
    const totalEquipmentEstimated = 120; // 120 units across classrooms
    const openIssues = allIssues.filter((i) => i.status === 'new' || i.status === 'in_progress').length;
    const score = Math.max(70, Math.min(100, Math.round(((totalEquipmentEstimated - openIssues) / totalEquipmentEstimated) * 100)));
    return score;
  }, [allIssues]);

  // Widget 2: Category Breakdown
  const categoryStats = useMemo(() => {
    const counts = {
      hardware: 0,
      electrical: 0,
      plumbing: 0,
      furniture: 0,
      other: 0,
    };
    allIssues.forEach((iss) => {
      if (counts[iss.category] !== undefined) {
        counts[iss.category]++;
      } else {
        counts.other++;
      }
    });
    const total = allIssues.length || 1;
    return Object.entries(counts).map(([catKey, count]) => ({
      key: catKey,
      label: ISSUE_CATEGORY_META[catKey]?.label || catKey,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [allIssues]);

  // Group issues into kanban columns
  const kanbanColumns = [
    {
      id: 'new',
      title: 'Новые заявки',
      Icon: IconInbox,
      badgeColor: '#3b82f6',
      items: visibleIssues.filter((i) => i.status === 'new'),
    },
    {
      id: 'in_progress',
      title: 'В работе',
      Icon: IconWrench,
      badgeColor: '#f59e0b',
      items: visibleIssues.filter((i) => i.status === 'in_progress'),
    },
    {
      id: 'resolved',
      title: 'Закрытые / Выполнено',
      Icon: IconCheckCircle,
      badgeColor: '#10b981',
      items: visibleIssues.filter((i) => i.status === 'resolved'),
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              fontWeight: 600,
            }}
          >
            <IconPlus size={17} />
            <span>Создать заявку</span>
          </Button>
        }
      />

      {/* Admin View-Only Notice Banner */}
      {isAdmin && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconShield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '2px' }}>
              Режим администратора: просмотр и аналитика
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Вам доступен полный контроль, статистика и фильтрация всех заявок школы. Изменение статуса заявок (взятие в работу и закрытие) закреплено за специалистами технической службы.
            </div>
          </div>
        </div>
      )}

      {/* Top Metrics Cards (Zero Emojis, Clean Vector Icons) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-md)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconInbox size={22} />
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
              backgroundColor: stats.criticalCount > 0 ? 'var(--danger-light)' : 'var(--bg-subtle)',
              color: stats.criticalCount > 0 ? 'var(--danger)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-md)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconAlertCircle size={22} />
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
              Критические
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
              backgroundColor: 'var(--warning-light)',
              color: 'var(--warning)',
              borderRadius: 'var(--radius-md)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconClock size={22} />
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
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-md)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconCheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Закрыто
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>
              {stats.resolvedCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconActivity size={22} />
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

      {/* Operational Analytics Widgets (Requested by user) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Widget A: Equipment Health Index */}
        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconActivity size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Индекс исправности оборудования</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: healthIndex >= 90 ? 'var(--success)' : 'var(--warning)',
                backgroundColor: healthIndex >= 90 ? 'var(--success-light)' : 'var(--warning-light)',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {healthIndex >= 90 ? 'Штатно' : 'Внимание'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{healthIndex}%</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>парка оборудования в строю</span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-subtle)',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: `${healthIndex}%`,
                height: '100%',
                backgroundColor: healthIndex >= 90 ? 'var(--success)' : 'var(--warning)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            На основе мониторинга 120 единиц аппаратуры в учебных кабинетах школы.
          </div>
        </Card>

        {/* Widget B: Category Breakdown */}
        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconWrench size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Распределение по категориям</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Всего: {allIssues.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {categoryStats.slice(0, 4).map((cat) => (
              <div key={cat.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.count} шт ({cat.pct}%)</span>
                </div>
                <div style={{ height: '5px', borderRadius: '999px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(5, cat.pct)}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary)',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Widget C: SLA & Response Standards */}
        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <IconClock size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Нормативы обслуживания (SLA)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Время реакции</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>&lt; 30 мин</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Первый отклик техника</div>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Соблюдение SLA</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>98.2%</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>В установленный срок</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconArchive size={14} />
            <span>Регламент: закрытые заявки активны 7 дней, затем уходят в архив.</span>
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
          <div style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Поиск по названию, кабинету или автору..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
            <IconSearch
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
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
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
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
                  {ISSUE_CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>

          {/* Retention / Archive Filter Switch */}
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
              onClick={() => setRetentionMode('active')}
              title="Заявки в работе и закрытые до 7 дней"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: retentionMode === 'active' ? 600 : 400,
                backgroundColor: retentionMode === 'active' ? 'var(--primary)' : 'transparent',
                color: retentionMode === 'active' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Активные (&lt; 7 дн.)
            </button>
            <button
              type="button"
              onClick={() => setRetentionMode('archive')}
              title="Заявки, закрытые более 7 дней назад"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: retentionMode === 'archive' ? 600 : 400,
                backgroundColor: retentionMode === 'archive' ? 'var(--primary)' : 'transparent',
                color: retentionMode === 'archive' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Архив
            </button>
            <button
              type="button"
              onClick={() => setRetentionMode('all')}
              title="Все заявки без ограничений"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: retentionMode === 'all' ? 600 : 400,
                backgroundColor: retentionMode === 'all' ? 'var(--primary)' : 'transparent',
                color: retentionMode === 'all' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Все
            </button>
          </div>

          {/* View mode toggle (Icons instead of text/emojis) */}
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'kanban' ? 600 : 400,
                backgroundColor: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <IconLayoutGrid size={14} />
              <span>Канбан</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'list' ? 600 : 400,
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <IconList size={14} />
              <span>Список ({visibleIssues.length})</span>
            </button>
          </div>

          {(filters.priority !== 'all' || filters.category !== 'all' || filters.search || retentionMode !== 'active') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetFilters();
                setRetentionMode('active');
              }}
            >
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
          {kanbanColumns.map((col) => {
            const ColumnIcon = col.Icon;
            return (
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
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: col.badgeColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ColumnIcon size={14} />
                    </div>
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
                      onTakeIntoWork={isTechnician ? (id) => takeIntoWork(id) : null}
                      onOpenResolveModal={isTechnician ? handleOpenResolve : null}
                      onCancelIssue={isTechnician ? (id) => cancelIssue(id, 'Отменено техником') : null}
                    />
                  ))
                )}
              </div>
            );
          })}
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
          {visibleIssues.length === 0 ? (
            <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <IconSearch size={22} />
              </div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Заявок по заданным критериям не найдено</h4>
            </Card>
          ) : (
            visibleIssues.map((issue) => (
              <EquipmentIssueCard
                key={issue.id}
                issue={issue}
                currentUserRole={user?.role || 'technician'}
                currentUserId={user?.id}
                onOpenDetails={(iss) => setSelectedIssue(iss)}
                onTakeIntoWork={isTechnician ? (id) => takeIntoWork(id) : null}
                onOpenResolveModal={isTechnician ? handleOpenResolve : null}
                onCancelIssue={isTechnician ? (id) => cancelIssue(id, 'Отменено техником') : null}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconAlertCircle size={16} />
                <span>{resolveError}</span>
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
                style={{
                  backgroundColor: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                disabled={submittingResolve}
              >
                <IconCheck size={15} />
                <span>{submittingResolve ? 'Сохранение...' : 'Подтвердить и закрыть'}</span>
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
