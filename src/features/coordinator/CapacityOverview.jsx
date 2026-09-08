import { useCoordinatorOverview } from './useCoordinatorOverview.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';
import { EditCapacityModal } from './EditCapacityModal.jsx';
import { CreateGroupModal } from './CreateGroupModal.jsx';

export function CapacityOverview() {
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
    createGroupModalOpen,
    selectedActivity,
    isCreatingGroup,
    openCreateGroup,
    closeCreateGroup,
    saveNewGroup,
  } = useCoordinatorOverview();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка аналитики вместимости групп..." />
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
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          ✅ {actionSuccess}
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
          }}
        >
          ⚠️ Ошибка: {error}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Clubs & Groups */}
        <Card>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Кружки и секции</div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.totalActivities} / {summary.totalGroups}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            кружков / активных групп
          </div>
        </Card>

        {/* Overall Occupancy */}
        <Card>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Общая заполненность школы
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.occupancyRate}%
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <strong>{summary.totalEnrolled}</strong> из <strong>{summary.totalCapacity}</strong>{' '}
            мест занято
          </div>
        </Card>

        {/* Full Groups Alert Zone */}
        <Card
          style={{
            borderColor: summary.fullGroupsCount > 0 ? 'var(--danger)' : 'var(--border-color)',
            backgroundColor:
              summary.fullGroupsCount > 0 ? 'var(--danger-light)' : 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: summary.fullGroupsCount > 0 ? 'var(--danger)' : 'var(--text-secondary)',
            }}
          >
            100% заполненные группы
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: summary.fullGroupsCount > 0 ? 'var(--danger)' : 'var(--text-primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.fullGroupsCount} {summary.fullGroupsCount > 0 ? '🚨' : ''}
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: summary.fullGroupsCount > 0 ? 'var(--danger)' : 'var(--text-muted)',
            }}
          >
            {summary.fullGroupsCount > 0 ? 'Требуется открытие доп. групп' : 'Свободные места есть'}
          </div>
        </Card>

        {/* Total Waitlist */}
        <Card
          style={{
            borderColor:
              summary.totalWaitlistCount > 0 ? 'var(--accent-coral)' : 'var(--border-color)',
            backgroundColor:
              summary.totalWaitlistCount > 0 ? 'var(--accent-coral-light)' : 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color:
                summary.totalWaitlistCount > 0 ? 'var(--accent-coral)' : 'var(--text-secondary)',
            }}
          >
            Лист ожидания (Waitlist)
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: summary.totalWaitlistCount > 0 ? 'var(--accent-coral)' : 'var(--text-primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.totalWaitlistCount} чел.
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: summary.totalWaitlistCount > 0 ? 'var(--accent-coral)' : 'var(--text-muted)',
            }}
          >
            учеников ожидают очереди
          </div>
        </Card>
      </div>

      {/* Group List / Grid */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Мониторинг групп и управление вместимостью
          </h3>
          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Всего групп: <strong>{groups.length}</strong>
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {groups.map((group) => {
            const enrolled = Number(group.enrolledCount) || 0;
            const capacity = Number(group.capacity) || 0;
            const percent = group.percent;
            const parentActivity = activities.find((a) => a.id === group.activityId) || {
              id: group.activityId,
              title: group.activityTitle,
            };

            return (
              <Card
                key={group.id}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${group.statusColor}`,
                }}
              >
                <div>
                  {/* Category and Waitlist Badge */}
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
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}
                      >
                        Очередь: {group.waitlistCount} чел.
                      </span>
                    )}
                  </div>

                  <h4
                    style={{
                      margin: '0 0 4px',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {group.activityTitle}
                  </h4>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      marginBottom: '10px',
                    }}
                  >
                    {group.name || 'Основная группа'}
                  </div>

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
                    <div>
                      📅 <strong>Расписание:</strong> {formatDaysOfWeek(group.daysOfWeek)}{' '}
                      {group.startTime}–{group.endTime}
                    </div>
                    <div>
                      📍 <strong>Кабинет:</strong> {group.location}
                    </div>
                    <div>
                      💳 <strong>Стоимость:</strong>{' '}
                      {group.price === 0 ? 'Бесплатно' : formatCurrency(group.price)}
                    </div>
                  </div>

                  {/* Progress Bar & Seat Count */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Заполненность</span>
                      <span style={{ color: group.statusColor }}>
                        {enrolled} / {capacity} мест ({percent}%)
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          height: '100%',
                          backgroundColor: group.statusColor,
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions for Coordinator */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditCapacity(group)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    ✏️ Лимит мест
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openCreateGroup(parentActivity)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    + Новая группа
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Capacity Modal */}
      <EditCapacityModal
        isOpen={editModalOpen}
        onClose={closeEditCapacity}
        group={selectedGroup}
        onSave={saveCapacity}
        isUpdating={isUpdating}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createGroupModalOpen}
        onClose={closeCreateGroup}
        activity={selectedActivity}
        onSave={saveNewGroup}
        isCreating={isCreatingGroup}
      />
    </div>
  );
}
