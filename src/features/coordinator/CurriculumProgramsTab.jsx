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
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { useCoordinatorOverview } from './useCoordinatorOverview.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek, exportToExcel } from '../../shared/utils/index.js';
import { EditCapacityModal } from './EditCapacityModal.jsx';
import { CreateGroupModal } from './CreateGroupModal.jsx';
import { CreateActivityModal } from './CreateActivityModal.jsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.jsx';
import { ActivityDetailsModal } from '../catalog/ActivityDetailsModal.jsx';

export function CurriculumProgramsTab() {
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

  const handleExportToExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const data = groups.map((g, idx) => {
      const act = activities.find((a) => a.id === g.activityId) || {};
      const cap = Number(g.capacity) || 0;
      const enrolled = Number(g.enrolledCount) || 0;
      const fillRate = cap > 0 ? Math.round((enrolled / cap) * 100) : 0;

      return {
        '№': idx + 1,
        'Кружок': g.activityTitle || act.title || 'Кружок',
        'Категория': g.category || act.category || 'Внеурочная деятельность',
        'Стоимость (₸/мес)': typeof act.price === 'number' ? act.price : 0,
        'Локация / Кабинет': g.location || act.location || 'Школьный корпус',
        'Преподаватель': act.teacherName || '—',
        'Группа': g.name || 'Группа',
        'Расписание': `${formatDaysOfWeek(g.daysOfWeek)} ${g.startTime || '15:30'}–${g.endTime || '17:00'}`,
        'Вместимость (мест)': cap,
        'Записано (учеников)': enrolled,
        'Заполненность (%)': fillRate,
        'Статус мест': fillRate >= 100 ? '100% заполнено' : fillRate >= 80 ? 'Заканчиваются' : 'Свободно',
        'В листе ожидания (чел.)': g.waitlistCount || 0,
      };
    });

    exportToExcel({
      filename: `extrahub-curriculum-programs-${todayStr}`,
      sheetName: 'Учебные программы',
      data: data.length > 0 ? data : [{ 'Сообщение': 'Нет данных о группах' }],
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка учебных программ и каталога кружков..." />
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

      {/* PROMINENT TOP COMMAND BAR: Heading, Summary & Create Program Button */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '2px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(14, 124, 107, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Создание учебных программ
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Всего кружков и клубов: <strong>{activities.length}</strong> &bull; Групп в расписании: <strong>{groups.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls in Command Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="md"
            onClick={handleExportToExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Выгрузить реестр в Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} color="var(--primary)" />
            <span>Экспорт в Excel</span>
          </Button>

          {/* Primary Action Button: Create Activity */}
          <Button
            variant="primary"
            size="md"
            onClick={openCreateActivity}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '14px',
              padding: '10px 20px',
              boxShadow: '0 2px 8px rgba(14, 124, 107, 0.25)',
            }}
          >
            <Plus size={17} />
            <span>Создать кружок / клуб</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Group & Program Management */}
      <>
        {/* Multi-Selection and Bulk Actions Toolbar */}
        {groups.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: selectedGroupIds.length > 0 ? 'rgba(14, 124, 107, 0.08)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedGroupIds.length > 0 ? 'var(--primary)' : 'var(--border-color)'}`,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* Section for Activities without groups */}
        {activities.filter((a) => !groups.some((g) => g.activityId === a.id)).length > 0 && (
          <div
            style={{
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
              <span>Новые программы без сформированных групп (требуется открыть группу):</span>
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
                      padding: '14px',
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {act.teacherName || '—'}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {act.location || 'Школа'}</span>
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
                        title="Удалить программу из базы данных"
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

        {/* Groups Management Grid */}
        {groups.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <School size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Нет активных учебных программ
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
              Создайте первую школьную программу (кружок или клуб) и сформируйте группы расписания.
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
                    borderLeft: `4px solid ${group.statusColor}`,
                    backgroundColor: isSelected ? 'rgba(14, 124, 107, 0.05)' : undefined,
                    outline: isSelected ? '2px solid var(--primary)' : undefined,
                    transition: 'all 0.15s ease',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
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
                        <span style={{ color: 'var(--text-secondary)' }}>МЕСТА</span>
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

      {/* Activity Details Modal */}
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
