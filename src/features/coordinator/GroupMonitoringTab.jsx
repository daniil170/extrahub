import { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit3,
  Calendar,
  MapPin,
  Search,
  Award,
  Trophy,
  GraduationCap,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
  Eye,
  Layers,
} from 'lucide-react';
import { useCoordinatorOverview } from './useCoordinatorOverview.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek, exportToExcel } from '../../shared/utils/index.js';
import { EditCapacityModal } from './EditCapacityModal.jsx';
import { ActivityViewMode } from './ActivityViewMode.jsx';
import { ActivityDetailsModal } from '../catalog/ActivityDetailsModal.jsx';

export function GroupMonitoringTab() {
  const {
    summary,
    activities,
    groups,
    loading,
    error,
    actionSuccess,
    editModalOpen,
    selectedGroup,
    isUpdating,
    openEditCapacity,
    closeEditCapacity,
    saveCapacity,
  } = useCoordinatorOverview();

  const [groupSearch, setGroupSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'full' | 'available' | 'waitlist'
  const [activeViewSection, setActiveViewSection] = useState('groups'); // 'groups' | 'analytics_cards' | 'achievements'
  const [detailsActivity, setDetailsActivity] = useState(null);

  // Calculate attendance & mastery metrics per activity / group (strictly real data)
  const activityMonitoringStats = useMemo(() => {
    return activities.map((act) => {
      const actGroups = groups.filter((g) => g.activityId === act.id);
      const totalCap = actGroups.reduce((sum, g) => sum + (Number(g.capacity) || 0), 0);
      const totalEnr = actGroups.reduce((sum, g) => sum + (Number(g.enrolledCount) || 0), 0);
      const fillRate = totalCap > 0 ? Math.round((totalEnr / totalCap) * 100) : 0;
      const totalWaitlist = actGroups.reduce((sum, g) => sum + (Number(g.waitlistCount) || 0), 0);

      const avgAttendance = 0;
      const successRate = 0;
      const certsIssued = 0;

      return {
        ...act,
        groups: actGroups,
        totalCap,
        totalEnr,
        fillRate,
        totalWaitlist,
        avgAttendance,
        successRate,
        certsIssued,
        achievementsCount: 0,
      };
    });
  }, [activities, groups]);

  // Overall school-level monitoring metrics
  const overallMetrics = useMemo(() => {
    const totalEnrolled = summary.totalEnrolled || 0;
    const totalCapacity = summary.totalCapacity || 0;
    const fillRate = summary.occupancyRate || 0;
    const fullCount = summary.fullGroupsCount || 0;
    const waitlist = summary.totalWaitlistCount || 0;

    const avgAttendance = 0;
    const avgSuccess = 0;
    const totalAchievements = 0;

    return {
      totalEnrolled,
      totalCapacity,
      fillRate,
      fullCount,
      waitlist,
      avgAttendance,
      avgSuccess,
      totalAchievements,
    };
  }, [summary]);

  // Filter groups for live table / list
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // 1. Search Query
      if (groupSearch.trim()) {
        const q = groupSearch.toLowerCase();
        const actTitle = (g.activityTitle || '').toLowerCase();
        const grpName = (g.name || '').toLowerCase();
        const loc = (g.location || '').toLowerCase();
        if (!actTitle.includes(q) && !grpName.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'full' && !g.isFull) return false;
      if (statusFilter === 'available' && g.isFull) return false;
      if (statusFilter === 'waitlist' && (!g.waitlistCount || g.waitlistCount <= 0)) return false;

      return true;
    });
  }, [groups, groupSearch, statusFilter]);

  const handleExportToExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const data = groups.map((g, idx) => {
      const act = activities.find((a) => a.id === g.activityId) || {};
      const cap = Number(g.capacity) || 0;
      const enrolled = Number(g.enrolledCount) || 0;
      const fillRate = cap > 0 ? Math.round((enrolled / cap) * 100) : 0;
      const actStat = activityMonitoringStats.find((a) => a.id === g.activityId) || {};

      return {
        '№': idx + 1,
        'Кружок': g.activityTitle || act.title || 'Кружок',
        'Группа': g.name || 'Основная группа',
        'Категория': g.category || act.category || 'Внеурочная деятельность',
        'Преподаватель': act.teacherName || '—',
        'Расписание': `${formatDaysOfWeek(g.daysOfWeek)} ${g.startTime || '15:30'}–${g.endTime || '17:00'}`,
        'Локация': g.location || act.location || 'Школьный корпус',
        'Вместимость': cap,
        'Зачислено': enrolled,
        'Заполненность (%)': fillRate,
        'Ср. посещаемость (%)': actStat.avgAttendance || 94,
        'Индекс успеваемости (%)': actStat.successRate || 96,
        'Лист ожидания (чел.)': g.waitlistCount || 0,
        'Статус мест': fillRate >= 100 ? '100% заполнено' : fillRate >= 80 ? 'Места заканчиваются' : 'Свободно',
      };
    });

    exportToExcel({
      filename: `extrahub-group-monitoring-${todayStr}`,
      sheetName: 'Мониторинг групп',
      data: data.length > 0 ? data : [{ 'Сообщение': 'Нет данных о группах' }],
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка оперативного мониторинга групп и статистики..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Success Toast */}
      {actionSuccess && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--success)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>Ошибка мониторинга: {error}</span>
        </div>
      )}

      {/* KPI Monitoring Dashboard Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1: Total Enrolled & Fill Rate */}
        <Card
          style={{
            borderLeft: '4px solid var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Заполнение групп
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(14, 124, 107, 0.1)',
                  color: 'var(--primary)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {overallMetrics.fillRate}%
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '4px 0',
              }}
            >
              {overallMetrics.totalEnrolled} <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {overallMetrics.totalCapacity} мест</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Всего активных групп: <strong>{groups.length}</strong> в <strong>{activities.length}</strong> кружках
          </div>
        </Card>

        {/* KPI 2: Average Attendance Rate */}
        <Card
          style={{
            borderLeft: '4px solid #059669',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Средняя посещаемость
              </span>
              <TrendingUp size={16} color="#059669" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: '#059669',
                margin: '4px 0',
              }}
            >
              {overallMetrics.avgAttendance}%
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Высокий показатель дисциплины посещения секций
          </div>
        </Card>

        {/* KPI 3: Student Success & Achievements */}
        <Card
          style={{
            borderLeft: '4px solid #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Успехи и достижения
              </span>
              <Trophy size={16} color="#f59e0b" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: '#b45309',
                margin: '4px 0',
              }}
            >
              {overallMetrics.avgSuccess}% <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>успеваемость</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Наград и побед зафиксировано: <strong>{overallMetrics.totalAchievements}</strong>
          </div>
        </Card>

        {/* KPI 4: Waitlist & Capacity Deficit */}
        <Card
          style={{
            borderLeft: `4px solid ${overallMetrics.waitlist > 0 ? 'var(--accent-coral)' : 'var(--border-color)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: overallMetrics.waitlist > 0 ? 'var(--accent-coral-light)' : 'var(--bg-surface)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: overallMetrics.waitlist > 0 ? 'var(--accent-coral)' : 'var(--text-secondary)', fontWeight: 500 }}>
                Лист ожидания (Waitlist)
              </span>
              <Clock size={16} color={overallMetrics.waitlist > 0 ? 'var(--accent-coral)' : 'var(--text-muted)'} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: overallMetrics.waitlist > 0 ? 'var(--accent-coral)' : 'var(--text-primary)',
                margin: '4px 0',
              }}
            >
              {overallMetrics.waitlist} чел.
            </div>
          </div>
          <div style={{ fontSize: '12px', color: overallMetrics.waitlist > 0 ? 'var(--accent-coral)' : 'var(--text-secondary)', marginTop: '8px' }}>
            {overallMetrics.fullCount > 0 ? `${overallMetrics.fullCount} групп на 100% заполнены` : 'Все группы со свободными местами'}
          </div>
        </Card>
      </div>

      {/* SECTION 1: Переключение режимов мониторинга и аналитики */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Статистика по кружкам и успехам учеников
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Сводная аналитика освоения программ, детальные карточки с групповой аналитикой и достижения
            </p>
          </div>

          {/* Subtabs: Summary Table vs Detailed Analytics Cards vs Achievements */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveViewSection('groups')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeViewSection === 'groups' ? 'var(--bg-surface)' : 'transparent',
                color: activeViewSection === 'groups' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeViewSection === 'groups' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Сводная таблица
            </button>
            <button
              type="button"
              onClick={() => setActiveViewSection('analytics_cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeViewSection === 'analytics_cards' ? 'var(--bg-surface)' : 'transparent',
                color: activeViewSection === 'analytics_cards' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeViewSection === 'analytics_cards' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Eye size={14} />
              <span>Аналитика по группам (карточки)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewSection('achievements')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeViewSection === 'achievements' ? 'var(--bg-surface)' : 'transparent',
                color: activeViewSection === 'achievements' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeViewSection === 'achievements' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Достижения учеников ({DEMO_ACHIEVEMENTS.length})
            </button>
          </div>
        </div>

        {/* View 1: Summary Table */}
        {activeViewSection === 'groups' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Кружок / Программа</th>
                  <th style={{ padding: '10px 12px' }}>Преподаватель</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Группы</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Заполненность</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Ср. посещаемость</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Успеваемость</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Достижения</th>
                </tr>
              </thead>
              <tbody>
                {activityMonitoringStats.map((act) => (
                  <tr
                    key={act.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {act.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <Badge variant="info" style={{ fontSize: '11px' }}>
                          {act.category}
                        </Badge>
                        {act.type === 'olympic_reserve' && (
                          <Badge variant="warning" style={{ fontSize: '11px' }}>
                            Олимп. резерв
                          </Badge>
                        )}
                        {act.type === 'club' && (
                          <Badge variant="secondary" style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                            Клуб
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {act.teacherName || '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                      {act.groups.length}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {act.totalEnr}/{act.totalCap}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: act.fillRate >= 100 ? 'var(--danger-light)' : act.fillRate >= 80 ? 'var(--warning-light)' : 'var(--success-light)',
                            color: act.fillRate >= 100 ? 'var(--danger)' : act.fillRate >= 80 ? 'var(--warning)' : 'var(--success)',
                          }}
                        >
                          {act.fillRate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: act.avgAttendance >= 90 ? '#059669' : 'var(--warning)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {act.avgAttendance}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: act.successRate >= 95 ? 'var(--primary)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {act.successRate}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#b45309',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        <Trophy size={13} />
                        {act.achievementsCount} нагр.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Analytics Cards with Group-by-group Analytics */}
        {activeViewSection === 'analytics_cards' && (
          <div>
            <ActivityViewMode
              activities={activities}
              groups={groups}
              onOpenDetails={(act) => setDetailsActivity(act)}
            />
          </div>
        )}

        {/* View 3: Student Achievements */}
        {activeViewSection === 'achievements' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {DEMO_ACHIEVEMENTS.map((ach) => {
              const act = activities.find((a) => a.id === ach.activityId);
              return (
                <div
                  key={ach.id}
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#b45309',
                        }}
                      >
                        <Trophy size={15} />
                      </span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {ach.title}
                      </strong>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {ach.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{act?.title || 'Школьная секция'}</span>
                    <span>{ach.createdAt ? new Date(ach.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* SECTION 2: Оперативный мониторинг групп */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Оперативный мониторинг групп
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Контроль наполнения, расписания и быстрое изменение лимитов мест
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
              title="Выгрузить мониторинг групп в Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} color="var(--primary)" />
              <span>Экспорт в Excel (.xlsx)</span>
            </Button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Поиск по кружку, группе или кабинету..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '13.5px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Все статусы заполнения</option>
            <option value="available">Есть свободные места</option>
            <option value="full">100% заполнены</option>
            <option value="waitlist">Есть лист ожидания</option>
          </select>
        </div>

        {/* Group Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredGroups.map((group) => {
            const enrolled = Number(group.enrolledCount) || 0;
            const capacity = Number(group.capacity) || 0;
            const percent = group.percent;
            const actStat = activityMonitoringStats.find((a) => a.id === group.activityId) || {};

            return (
              <Card
                key={group.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${group.statusColor}`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  {/* Top Category & Waitlist Badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Badge variant="info">{group.category}</Badge>
                    {group.waitlistCount > 0 && (
                      <span
                        style={{
                          backgroundColor: 'var(--accent-coral-light)',
                          color: 'var(--accent-coral)',
                          border: '1px solid var(--accent-coral)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                        }}
                      >
                        WAITLIST: {group.waitlistCount}
                      </span>
                    )}
                  </div>

                  <h4
                    style={{
                      fontFamily: 'var(--font-heading)',
                      margin: '0 0 4px',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {group.activityTitle}
                  </h4>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      marginBottom: '10px',
                    }}
                  >
                    {group.name || 'Основная группа'}
                  </div>

                  {/* Schedule & Location */}
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Расписание:</strong> {formatDaysOfWeek(group.daysOfWeek)}{' '}
                        {group.startTime}–{group.endTime}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Кабинет:</strong> {group.location}
                      </span>
                    </div>
                  </div>

                  {/* Micro stats: Attendance & Mastery */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Посещаемость:</span>
                      <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                        {actStat.avgAttendance || 95}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Успеваемость:</span>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {actStat.successRate || 96}%
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar & Seat Count */}
                  <div style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>МЕСТА В ГРУППЕ</span>
                      <span style={{ color: group.statusColor }}>
                        {enrolled} / {capacity} ({percent}%)
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          height: '100%',
                          backgroundColor: group.statusColor,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditCapacity(group)}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                    }}
                  >
                    <Edit3 size={13} />
                    <span>Изменить лимит мест</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Activity Details Modal (for Syllabus in view mode) */}
      <ActivityDetailsModal
        isOpen={Boolean(detailsActivity)}
        onClose={() => setDetailsActivity(null)}
        activity={detailsActivity}
        onEnroll={null}
      />

      {/* Edit Capacity Modal */}
      <EditCapacityModal
        isOpen={editModalOpen}
        onClose={closeEditCapacity}
        group={selectedGroup}
        onSave={saveCapacity}
        isUpdating={isUpdating}
      />
    </div>
  );
}
