import { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Plus,
  Sparkles,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Edit3,
  School,
  Trash2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useCoordinatorOverview } from './useCoordinatorOverview.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';
import { EditCapacityModal } from './EditCapacityModal.jsx';
import { CreateGroupModal } from './CreateGroupModal.jsx';
import { CreateActivityModal } from './CreateActivityModal.jsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.jsx';
import { ActivityViewMode } from './ActivityViewMode.jsx';
import { ActivityDetailsModal } from '../catalog/ActivityDetailsModal.jsx';

export function CapacityOverview() {
  const [viewMode, setViewMode] = useState('view'); // 'view' | 'manage'
  const [detailsActivity, setDetailsActivity] = useState(null);

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
    createActivityModalOpen,
    isCreatingActivity,
    openCreateActivity,
    closeCreateActivity,
    saveNewActivity,
    // Multi-selection
    selectedGroupIds,
    toggleSelectGroup,
    selectAllGroups,
    clearSelection,
    isGroupSelected,
    // Deletion
    deleteModalOpen,
    deleteTarget,
    isDeleting,
    promptDeleteGroup,
    promptDeleteActivity,
    promptDeleteBatch,
    closeDeleteModal,
    confirmDelete,
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={16} />
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
          <span>Ошибка: {error}</span>
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
        {/* Total Enrolled */}
        <Card>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Всего зачислено учеников
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.totalEnrolled} / {summary.totalCapacity}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Общая заполняемость: <strong>{summary.overallFillRate}%</strong>
          </div>
        </Card>

        {/* Available Spots */}
        <Card>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Свободных мест в кружках
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--success)',
              margin: '6px 0 4px',
            }}
          >
            {summary.totalAvailableSpots}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>мест готово к записи</div>
        </Card>

        {/* 100% Full Groups */}
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
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: summary.fullGroupsCount > 0 ? 'var(--danger)' : 'var(--text-primary)',
              margin: '6px 0 4px',
            }}
          >
            {summary.fullGroupsCount}
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
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
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
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              {viewMode === 'view' ? 'Каталог и структура кружков' : 'Мониторинг групп и управление вместимостью'}
            </h3>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Всего групп: <strong>{groups.length}</strong> &bull; Кружков: <strong>{activities.length}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View / Manage Mode Switcher */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-subtle)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('view')}
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
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'view' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'view' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'view' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Eye size={15} />
                <span>Режим просмотра</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('manage')}
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
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'manage' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'manage' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'manage' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <SlidersHorizontal size={15} />
                <span>Режим работы</span>
              </button>
            </div>

            {viewMode === 'manage' && (
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateActivity}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                <Plus size={15} /> Создать кружок
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'view' ? (
          <ActivityViewMode
            activities={activities}
            groups={groups}
            onOpenDetails={(act) => setDetailsActivity(act)}
          />
        ) : (
          <>
        {/* Multi-Selection and Bulk Actions Toolbar */}
        {groups.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: selectedGroupIds.length > 0 ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedGroupIds.length > 0 ? 'var(--primary)' : 'var(--border-color)'}`,
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={groups.length > 0 && selectedGroupIds.length === groups.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllGroups();
                    } else {
                      clearSelection();
                    }
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary)',
                  }}
                />
                <span>
                  {selectedGroupIds.length === groups.length
                    ? 'Снять выбор со всех'
                    : 'Выбрать все кружки / группы'}
                </span>
              </label>

              {selectedGroupIds.length > 0 && (
                <span
                  style={{
                    fontSize: '12.5px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                  }}
                >
                  Выбрано: {selectedGroupIds.length} из {groups.length}
                </span>
              )}
            </div>

            {selectedGroupIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  style={{ fontSize: '12.5px' }}
                >
                  Сбросить
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={promptDeleteBatch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--danger)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} />
                  <span>Удалить выбранные ({selectedGroupIds.length})</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Section for Activities without groups (if any) */}
        {activities.filter((a) => !groups.some((g) => g.activityId === a.id)).length > 0 && (
          <div
            style={{
              marginBottom: '22px',
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={15} color="var(--primary)" />
              <span>Новые кружки без сформированных групп:</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {activities
                .filter((a) => !groups.some((g) => g.activityId === a.id))
                .map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <Badge variant="info" style={{ fontSize: '11px' }}>
                          {act.category}
                        </Badge>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {act.price === 0 ? 'Бесплатно' : formatCurrency(act.price)}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {act.teacherName}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {act.location}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openCreateGroup(act)}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={14} /> Открыть группу
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => promptDeleteActivity(act)}
                        title="Удалить кружок из базы данных"
                        style={{ padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <School size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Нет активных учебных групп
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                margin: '0 0 16px',
                maxWidth: '440px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Создайте новый кружок или откройте учебную группу для существующей школьной секции.
            </p>
            <Button
              variant="primary"
              onClick={openCreateActivity}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Создать первый кружок
            </Button>
          </Card>
        ) : (
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

            const isSelected = isGroupSelected(group.id);

            return (
              <Card
                key={group.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `3px solid ${group.statusColor}`,
                  backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.05)' : undefined,
                  outline: isSelected ? '2px solid var(--primary)' : undefined,
                  transition: 'all 0.15s ease',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectGroup(group.id)}
                        title="Выбрать секцию"
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: 'var(--primary)',
                        }}
                      />
                      <Badge variant="info">{group.category}</Badge>
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={13} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Стоимость:</strong>{' '}
                        {group.price === 0 ? 'Бесплатно' : formatCurrency(group.price)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Seat Count */}
                  <div style={{ marginBottom: '16px' }}>
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
                      <span style={{ color: 'var(--text-secondary)' }}>SEATS</span>
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
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={13} /> Лимит мест
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openCreateGroup(parentActivity)}
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={13} /> Новая группа
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => promptDeleteGroup(group)}
                    title="Удалить эту группу из базы данных"
                    style={{
                      padding: '0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        )}
        </>
        )}
      </div>

      {/* Activity Details Modal (view curriculum / syllabus in view mode) */}
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createGroupModalOpen}
        onClose={closeCreateGroup}
        activity={selectedActivity}
        onSave={saveNewGroup}
        isCreating={isCreatingGroup}
      />

      {/* Create Activity (Club) Modal */}
      <CreateActivityModal
        isOpen={createActivityModalOpen}
        onClose={closeCreateActivity}
        onSave={saveNewActivity}
        isCreating={isCreatingActivity}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        target={deleteTarget}
        isDeleting={isDeleting}
      />
    </div>
  );
}
