import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  MapPin,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  Lock,
  Clock,
  X,
  Palette,
  Sparkles,
  Trophy,
  Cpu,
  Compass,
  Globe,
  Bookmark,
} from 'lucide-react';
import { useCatalog } from './useCatalog.js';
import { useEnrollment } from '../enrollment/useEnrollment.js';
import { EnrollmentModal } from '../enrollment/EnrollmentModal.jsx';
import { ActivityDetailsModal } from './ActivityDetailsModal.jsx';
import { Card, Badge, Button, Spinner, PageHeader, CapacityBadge, Modal } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

// Category visual palette (pastel backgrounds + high-contrast text) and vector icons
const CATEGORY_STYLES = {
  art: {
    bg: '#fdf2f8',
    color: '#9d174d',
    border: '#fbcfe8',
    icon: Palette,
  },
  theater: {
    bg: '#f5f3ff',
    color: '#6d28d9',
    border: '#ddd6fe',
    icon: Sparkles,
  },
  sports: {
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
    icon: Trophy,
  },
  science: {
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    icon: Cpu,
  },
  math: {
    bg: '#eef2ff',
    color: '#4338ca',
    border: '#c7d2fe',
    icon: Compass,
  },
  languages: {
    bg: '#fefce8',
    color: '#a16207',
    border: '#fef08a',
    icon: Globe,
  },
  music: {
    bg: '#faf5ff',
    color: '#7e22ce',
    border: '#e9d5ff',
    icon: Sparkles,
  },
  default: {
    bg: '#f1f5f9',
    color: '#334155',
    border: '#e2e8f0',
    icon: Bookmark,
  },
};

function getCategoryStyle(categoryName = '', title = '') {
  const cat = (categoryName || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (cat.includes('искус') || cat.includes('творч') || cat.includes('изо') || t.includes('живопис')) {
    return CATEGORY_STYLES.art;
  }
  if (cat.includes('театр') || t.includes('актер') || t.includes('сцен')) {
    return CATEGORY_STYLES.theater;
  }
  if (cat.includes('спорт') || t.includes('волей') || t.includes('баскет') || t.includes('футб')) {
    return CATEGORY_STYLES.sports;
  }
  if (cat.includes('техн') || cat.includes('робот') || t.includes('робот') || t.includes('3d') || cat.includes('наук')) {
    return CATEGORY_STYLES.science;
  }
  if (cat.includes('точн') || cat.includes('мат') || t.includes('мат') || t.includes('олимп')) {
    return CATEGORY_STYLES.math;
  }
  if (cat.includes('язык') || cat.includes('гуманит') || t.includes('англ') || t.includes('дебат')) {
    return CATEGORY_STYLES.languages;
  }
  if (cat.includes('музык') || t.includes('гитар') || t.includes('вок')) {
    return CATEGORY_STYLES.music;
  }
  return CATEGORY_STYLES.default;
}

// Russian typographical quotes « »
function formatGuillemets(title) {
  if (!title) return '';
  return title.replace(/"([^"]+)"/g, '«$1»');
}

// Clean label for age/grade display (e.g. "7–16 лет • 1–10 класс")
function cleanAgeGroup(ageGroup) {
  if (!ageGroup) return '1–11 классы';
  if (ageGroup.includes('класс') || ageGroup.includes('лет')) return ageGroup;
  return `${ageGroup} классы`;
}

export function CatalogPage() {
  const navigate = useNavigate();
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
    authRequiredModalOpen,
    authRequiredActivity,
    closeAuthRequiredModal,
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
    { value: '1-4', label: '1–4 классы' },
    { value: '5-8', label: '5–8 классы' },
    { value: '9-11', label: '9–11 классы' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <PageHeader
        title="Каталог кружков и секций"
        subtitle={`Официальные программы дополнительного образования и внеучебные секции ${schoolConfig.name}`}
      />

      {/* Filters and Search Bar: Modern soft pill/slab style (no harsh borders) */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          {/* Accent Broad Search Input */}
          <div style={{ position: 'relative', gridColumn: 'span 1' }}>
            <input
              type="text"
              placeholder="Поиск кружка, направления, преподавателя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                fontSize: '14px',
                backgroundColor: 'var(--bg-subtle, #f4f4f2)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #f4f4f2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--primary)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Category Filter - borderless soft background */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Фильтр по направлению"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'var(--bg-subtle, #f4f4f2)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                cursor: 'pointer',
                outline: 'none',
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

          {/* Day of Week Filter - borderless soft background */}
          <div>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              aria-label="Фильтр по дню недели"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'var(--bg-subtle, #f4f4f2)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {daysOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age / Grade Filter - borderless soft background */}
          <div>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              aria-label="Фильтр по классам"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'var(--bg-subtle, #f4f4f2)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                cursor: 'pointer',
                outline: 'none',
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

        {/* Second row: Available Spots Toggle, Count & Dynamic Reset Button */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              fontSize: '13.5px',
              fontWeight: 500,
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
                width: '17px',
                height: '17px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span>Только со свободными местами</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Найдено программ: <strong style={{ color: 'var(--text-primary)' }}>{filteredActivities.length}</strong>
            </span>

            {/* Clear filters button (appears dynamically when filters are active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  color: 'var(--danger, #dc2626)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                }}
              >
                <X size={14} />
                <span>Очистить фильтры</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size="lg" label="Загрузка каталога программ..." />
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: 'var(--danger-light)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px 20px',
            marginBottom: '24px',
            color: 'var(--danger)',
            fontSize: '14px',
          }}
        >
          Ошибка загрузки каталога: {error}
        </div>
      )}

      {!loading && !error && filteredActivities.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Search size={26} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: '18px' }}>
            Ничего не найдено
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
            Попробуйте скорректировать параметры поиска или сбросить активные фильтры.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Очистить все фильтры
          </Button>
        </div>
      )}

      {!loading && filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))',
            gap: '28px',
          }}
        >
          {filteredActivities.map((act) => {
            const isFull = act.isFull;
            const remainingSpots = act.remainingSpots;
            const totalCapacity = act.totalCapacity || (act.groups || []).reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
            const totalEnrolled = act.totalEnrolled || (act.groups || []).reduce((acc, g) => acc + (Number(g.enrolledCount) || 0), 0);
            const titleWithGuillemets = formatGuillemets(act.title);
            const categoryStyle = getCategoryStyle(act.category, act.title);
            const CategoryIcon = categoryStyle.icon;

            // Capacity percentage & progress bar styling
            const capacityRatio = totalCapacity > 0 ? (totalCapacity - remainingSpots) / totalCapacity : 0;
            const percentageUsed = Math.min(100, Math.max(0, Math.round(capacityRatio * 100)));

            let progressColor = 'var(--primary)';
            let capacityTextColor = 'var(--text-secondary)';
            let capacityStatusText = `Свободно ${remainingSpots} из ${totalCapacity} мест`;

            if (isFull || remainingSpots <= 0) {
              progressColor = '#94a3b8'; // neutral muted slate for full group
              capacityTextColor = 'var(--text-muted)';
              capacityStatusText = `Мест нет (${totalCapacity} из ${totalCapacity} занято)`;
            } else if (remainingSpots <= 3) {
              progressColor = '#f59e0b'; // amber warning for scarce spots
              capacityTextColor = '#b45309';
              capacityStatusText = `Осталось всего ${remainingSpots} ${remainingSpots === 1 ? 'место' : 'места'} из ${totalCapacity}`;
            }

            return (
              <div
                key={act.id}
                role="button"
                tabIndex={0}
                aria-label={`Подробнее о программе ${act.title}`}
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
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg, 14px)',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: '24px',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(0, 0, 0, 0.09)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                {/* 1. Header: Category badge & Age/Grade tag */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  {/* Category Pill with Soft Pastel Background and Vector Icon */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: categoryStyle.bg,
                      color: categoryStyle.color,
                      border: `1px solid ${categoryStyle.border}`,
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                    }}
                  >
                    <CategoryIcon size={13} style={{ flexShrink: 0 }} />
                    <span>{act.category || 'Кружок'}</span>
                  </span>

                  {/* Age / Grade Label */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cleanAgeGroup(act.ageGroup)}
                  </span>
                </div>

                {/* Special Tags: Olympic reserve or Exam required */}
                {(act.type === 'olympic_reserve' || act.requiresExam) && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {act.type === 'olympic_reserve' && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                        }}
                      >
                        Олимпиадный резерв{act.subject ? `: ${act.subject}` : ''}
                      </span>
                    )}
                    {act.requiresExam && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          border: '1px solid #dbeafe',
                        }}
                      >
                        Вступительный экзамен
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Title in Russian Guillemets */}
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)',
                    margin: '0 0 10px',
                    lineHeight: 1.35,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {titleWithGuillemets}
                </h3>

                {/* 3. Short Description with 2-line clamp */}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '18px',
                    minHeight: '40px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {act.description}
                </p>

                {/* 4. Metadata Block (Airy, clean, zero avatar photo maintenance) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px',
                    lineHeight: 1.4,
                  }}
                >
                  {/* Instructor (clean profile icon + label) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Преподаватель:</span>
                    <strong
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {act.teacherName}
                    </strong>
                  </div>

                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Локация:</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.location}
                    </span>
                  </div>

                  {/* Schedule */}
                  {act.groups && act.groups.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>Расписание:</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.groups
                          .map((g) => `${formatDaysOfWeek(g.daysOfWeek)} ${g.startTime}–${g.endTime}`)
                          .join(' • ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Capacity Block (X of Y spots + Progress Bar) */}
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    borderRadius: 'var(--radius-md, 8px)',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: capacityTextColor }}>
                      {capacityStatusText}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {totalCapacity > 0 ? `${percentageUsed}% заполнено` : ''}
                    </span>
                  </div>

                  {/* 4-5px Rounded Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '5px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percentageUsed}%`,
                        height: '100%',
                        borderRadius: '999px',
                        backgroundColor: progressColor,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* 6. Footer (Fixed to bottom with margin-top: auto) */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  {/* Left: Program link + Price */}
                  <div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(act);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          handleOpenDetails(act);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: '4px',
                        transition: 'gap 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.gap = '6px')}
                      onMouseLeave={(e) => (e.currentTarget.style.gap = '4px')}
                    >
                      <BookOpen size={13} />
                      <span>Программа</span>
                      <ArrowRight size={12} />
                    </div>

                    <strong
                      style={{
                        fontSize: '19px',
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        display: 'block',
                      }}
                    >
                      {act.price === 0 ? 'Бесплатно' : formatCurrency(act.price)}
                    </strong>
                  </div>

                  {/* Right: Main Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEnrollment(act);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: isFull ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                      backgroundColor: isFull ? 'var(--bg-subtle, #f1f5f9)' : 'var(--primary)',
                      color: isFull ? 'var(--text-secondary, #475569)' : '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isFull ? 'none' : '0 2px 10px rgba(0, 150, 57, 0.22)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!isFull) {
                        e.currentTarget.style.filter = 'brightness(1.08)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      } else {
                        e.currentTarget.style.backgroundColor = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isFull) {
                        e.currentTarget.style.filter = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #f1f5f9)';
                      }
                    }}
                  >
                    {act.requiresExam
                      ? 'Подать заявку'
                      : isFull
                        ? 'В лист ожидания'
                        : 'Записаться'}
                  </button>
                </div>
              </div>
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

      {/* Auth Required Modal for Guests */}
      <Modal
        isOpen={authRequiredModalOpen}
        onClose={closeAuthRequiredModal}
        title="Требуется авторизация"
      >
        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Lock size={30} />
          </div>

          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}
          >
            Войдите в систему для записи
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 24px',
            }}
          >
            Запись на направление{' '}
            <strong>«{authRequiredActivity?.title || 'Кружок'}»</strong> доступна только
            авторизованным ученикам и родителям школы.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                closeAuthRequiredModal();
                navigate('/register');
              }}
              style={{ flex: 1, minWidth: '130px', justifyContent: 'center' }}
            >
              Регистрация
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                closeAuthRequiredModal();
                navigate('/login', {
                  state: { from: '/catalog', activityId: authRequiredActivity?.id },
                });
              }}
              style={{ flex: 1, minWidth: '130px', justifyContent: 'center' }}
            >
              Войти в аккаунт
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
