import { useState } from 'react';
import { useCatalog } from './useCatalog.js';
import { useEnrollment } from '../enrollment/useEnrollment.js';
import { EnrollmentModal } from '../enrollment/EnrollmentModal.jsx';
import { ActivityDetailsModal } from './ActivityDetailsModal.jsx';
import { Card, Badge, Button, Spinner, PageHeader } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';

export function CatalogPage() {
  const {
    filteredActivities,
    categories,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    dayOfWeek,
    setDayOfWeek,
    ageGroup,
    setAgeGroup,
    onlyAvailable,
    setOnlyAvailable,
    hasActiveFilters,
    resetFilters,
  } = useCatalog();

  const {
    isOpen: isEnrollmentOpen,
    activeActivity,
    selectedGroupId,
    setSelectedGroupId,
    selectedStudentId,
    setSelectedStudentId,
    isSubmitting,
    enrollmentResult,
    conflictError,
    generalError,
    openEnrollment,
    closeEnrollment,
    submitEnrollment,
    userRole,
  } = useEnrollment();

  const [detailsActivity, setDetailsActivity] = useState(null);

  const handleOpenDetails = (activity) => {
    setDetailsActivity(activity);
  };

  const handleCloseDetails = () => {
    setDetailsActivity(null);
  };

  const handleEnrollFromDetails = (preferredGroup) => {
    if (detailsActivity) {
      const act = detailsActivity;
      setDetailsActivity(null);
      openEnrollment(act, preferredGroup?.id);
    }
  };

  const daysOptions = [
    { value: 'all', label: 'Все дни' },
    { value: '1', label: 'Пн' },
    { value: '2', label: 'Вт' },
    { value: '3', label: 'Ср' },
    { value: '4', label: 'Чт' },
    { value: '5', label: 'Пт' },
    { value: '6', label: 'Сб' },
  ];

  const ageOptions = [
    { value: 'all', label: 'Все классы' },
    { value: '1-4', label: '1–4 классы (7–10 лет)' },
    { value: '5-8', label: '5–8 классы (11–14 лет)' },
    { value: '9-11', label: '9–11 классы (15–17 лет)' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <PageHeader
        title="Каталог кружков и секций"
        subtitle="Выберите интересные направления для дополнительного развития вашего ребёнка"
      />

      {/* Filters and Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Поиск кружка, направления, темы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Фильтр по категории"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              <option value="all">Все направления</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              aria-label="Фильтр по дню недели"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              {daysOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age / Grade Filter */}
          <div>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              aria-label="Фильтр по возрасту и классу"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              {ageOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row: Available Spots Toggle & Counter */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span>Только со свободными местами</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Найдено: <strong>{filteredActivities.length}</strong>
            </span>

            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size="lg" label="Загрузка кружков в реальном времени..." />
        </div>
      )}

      {error && (
        <Card
          style={{
            backgroundColor: 'var(--danger-light)',
            borderColor: 'var(--danger)',
            marginBottom: '24px',
          }}
        >
          <p style={{ color: 'var(--danger)', margin: 0 }}>Ошибка загрузки каталога: {error}</p>
        </Card>
      )}

      {!loading && filteredActivities.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Ничего не найдено</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px' }}>
            Попробуйте изменить параметры поиска или сбросить фильтры.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Сбросить все фильтры
          </Button>
        </Card>
      )}

      {!loading && filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredActivities.map((act) => {
            const isFull = act.isFull;
            const remainingSpots = act.remainingSpots;
            const totalEnrolled = act.totalEnrolled;
            const totalCapacity = act.totalCapacity;

            return (
              <Card
                key={act.id}
                role="button"
                tabIndex={0}
                aria-label={`Подробнее о программе кружка ${act.title}`}
                onClick={() => handleOpenDetails(act)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenDetails(act);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Top badges */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="info">{act.category}</Badge>
                      <Badge variant="default">{act.ageGroup}</Badge>
                    </div>

                    {/* Capacity Badge */}
                    <Badge variant={isFull ? 'danger' : 'success'}>
                      {isFull ? 'Мест нет' : `Осталось ${remainingSpots} мест`}
                    </Badge>
                  </div>

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {act.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      minHeight: '40px',
                    }}
                  >
                    {act.description}
                  </p>

                  {/* Instructor & Location info */}
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '12px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      👨‍🏫 <strong>Преподаватель:</strong> {act.teacherName}
                    </div>
                    <div>
                      📍 <strong>Локация:</strong> {act.location}
                    </div>
                    {act.groups && act.groups.length > 0 && (
                      <div>
                        📅 <strong>Расписание:</strong>{' '}
                        {act.groups
                          .map(
                            (g) => `${formatDaysOfWeek(g.daysOfWeek)} ${g.startTime}–${g.endTime}`
                          )
                          .join(' | ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📊 Занято: <strong>{totalEnrolled}</strong> из{' '}
                      <strong>{totalCapacity}</strong> мест
                    </div>
                  </div>

                  {/* Clickable prompt for curriculum / content */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      marginBottom: '14px',
                    }}
                  >
                    <span>📖 Содержание и программа курса</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Card Footer: Price & Enroll Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Стоимость
                    </span>
                    <strong style={{ fontSize: '17px', color: 'var(--primary)' }}>
                      {act.price === 0 ? 'Бесплатно' : formatCurrency(act.price)}
                    </strong>
                  </div>

                  <Button
                    size="sm"
                    variant={isFull ? 'secondary' : 'primary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEnrollment(act);
                    }}
                  >
                    {isFull ? 'Встать в лист ожидания' : 'Записаться'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity Program & Syllabus Details Modal */}
      <ActivityDetailsModal
        isOpen={Boolean(detailsActivity)}
        onClose={handleCloseDetails}
        activity={detailsActivity}
        onEnroll={handleEnrollFromDetails}
      />

      {/* Interactive Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollmentOpen}
        onClose={closeEnrollment}
        activity={activeActivity}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        isSubmitting={isSubmitting}
        enrollmentResult={enrollmentResult}
        conflictError={conflictError}
        generalError={generalError}
        onSubmit={submitEnrollment}
        userRole={userRole}
      />
    </div>
  );
}
