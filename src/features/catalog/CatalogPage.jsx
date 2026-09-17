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
} from 'lucide-react';
import { useCatalog } from './useCatalog.js';
import { useEnrollment } from '../enrollment/useEnrollment.js';
import { EnrollmentModal } from '../enrollment/EnrollmentModal.jsx';
import { ActivityDetailsModal } from './ActivityDetailsModal.jsx';
import { Card, Badge, Button, Spinner, PageHeader, CapacityBadge, Modal } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

// Visual card cover mappings by category or activity keywords
const ACTIVITY_IMAGES = {
  robotics: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
  chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
  art: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  theater: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  languages: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
};

function getCardImage(act) {
  if (act.imageUrl) return act.imageUrl;
  const title = (act.title || '').toLowerCase();
  const cat = (act.category || '').toLowerCase();

  if (title.includes('робот') || title.includes('3d') || cat.includes('робот') || cat.includes('техн')) return ACTIVITY_IMAGES.robotics;
  if (title.includes('шахмат') || cat.includes('шахмат')) return ACTIVITY_IMAGES.chess;
  if (title.includes('театр') || title.includes('актер') || cat.includes('театр')) return ACTIVITY_IMAGES.theater;
  if (title.includes('волей') || title.includes('баскет') || cat.includes('спорт')) return ACTIVITY_IMAGES.volleyball;
  if (title.includes('мат') || title.includes('олимп') || cat.includes('точн')) return ACTIVITY_IMAGES.math;
  if (title.includes('англ') || title.includes('дебат') || cat.includes('язык') || cat.includes('гуманит')) return ACTIVITY_IMAGES.languages;
  if (title.includes('изо') || title.includes('живопис') || cat.includes('творч') || cat.includes('искус')) return ACTIVITY_IMAGES.art;
  if (title.includes('музык') || title.includes('гитар') || title.includes('вок')) return ACTIVITY_IMAGES.music;

  return ACTIVITY_IMAGES.default;
}

// Friendly avatars for educators
const TEACHER_AVATARS = [
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
];

function getTeacherAvatar(teacherName) {
  if (!teacherName) return TEACHER_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < teacherName.length; i++) {
    hash = (hash << 5) - hash + teacherName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TEACHER_AVATARS.length;
  return TEACHER_AVATARS[index];
}

// Russian typographical quotes « »
function formatGuillemets(title) {
  if (!title) return '';
  return title.replace(/"([^"]+)"/g, '«$1»');
}

// Clean label for age/grade display
function cleanAgeGroup(ageGroup) {
  if (!ageGroup) return 'Все классы';
  if (ageGroup.includes('класс') || ageGroup.includes('лет')) return ageGroup;
  return `${ageGroup} классы`;
}

// Spot counter pluralization
function formatSpotsPlural(count) {
  if (count === 1) return 'Осталось 1 место';
  if (count >= 2 && count <= 4) return `Осталось ${count} места`;
  return `Осталось ${count} мест`;
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
            const previewImage = getCardImage(act);
            const teacherAvatar = getTeacherAvatar(act.teacherName);
            const titleWithGuillemets = formatGuillemets(act.title);

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
                  boxShadow: '0 6px 24px -4px rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 24px -4px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Visual Card Header with Photo Cover */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '180px',
                    overflow: 'hidden',
                    backgroundColor: '#161a38',
                  }}
                >
                  <img
                    src={previewImage}
                    alt={act.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.35s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                  {/* Subtle gradient vignette */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.65) 100%)',
                    }}
                  />

                  {/* Top floating pill: Category • Age Group */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(22, 26, 56, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                    }}
                  >
                    <span>{act.category || 'Кружок'}</span>
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span>{cleanAgeGroup(act.ageGroup)}</span>
                  </div>

                  {/* Top Right: Single Clear Spots Badge (using Pifagor accent) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                    }}
                  >
                    {isFull ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(220, 38, 38, 0.9)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                        Мест нет
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(0, 150, 57, 0.9)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                        {formatSpotsPlural(remainingSpots)}
                      </span>
                    )}
                  </div>

                  {/* Badges on bottom of image for special statuses */}
                  {(act.type === 'olympic_reserve' || act.requiresExam) && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '12px',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      {act.type === 'olympic_reserve' && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f59e0b',
                            color: '#1a1e26',
                          }}
                        >
                          Олимпиадный резерв{act.subject ? `: ${act.subject}` : ''}
                        </span>
                      )}
                      {act.requiresExam && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                          }}
                        >
                          Вступительный экзамен
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Body Content */}
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Title with elegant Russian quotes */}
                  <h3
                    style={{
                      fontSize: '17.5px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {titleWithGuillemets}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '18px',
                      minHeight: '38px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {act.description}
                  </p>

                  {/* Instructor with Friendly Photo Avatar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={teacherAvatar}
                      alt={act.teacherName}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid var(--border-color, #e5e5e3)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>Преподаватель</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {act.teacherName}
                      </div>
                    </div>
                  </div>

                  {/* Grouped Location & Schedule metadata */}
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '18px',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.location}
                      </span>
                    </div>

                    {act.groups && act.groups.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {act.groups
                            .map((g) => `${formatDaysOfWeek(g.daysOfWeek)} ${g.startTime}–${g.endTime}`)
                            .join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Program Curriculum Trigger Button */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      marginBottom: '20px',
                      transition: 'gap 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.gap = '8px')}
                    onMouseLeave={(e) => (e.currentTarget.style.gap = '6px')}
                  >
                    <BookOpen size={15} />
                    <span>Программа курса</span>
                    <ArrowRight size={14} />
                  </div>

                  {/* Card Footer: Price & Enroll Button (Aligned on common baseline with margin-top: auto) */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 500,
                        }}
                      >
                        Стоимость
                      </span>
                      <strong
                        style={{
                          fontSize: '19px',
                          fontFamily: 'var(--font-heading)',
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {act.price === 0 ? 'Бесплатно' : formatCurrency(act.price)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEnrollment(act);
                      }}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: 'none',
                        backgroundColor: isFull ? 'var(--bg-subtle)' : 'var(--primary)',
                        color: isFull ? 'var(--text-primary)' : '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isFull ? 'none' : '0 2px 10px rgba(0, 150, 57, 0.25)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!isFull) {
                          e.currentTarget.style.filter = 'brightness(1.08)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isFull) {
                          e.currentTarget.style.filter = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {act.requiresExam
                        ? 'Подать заявку'
                        : isFull
                          ? 'Лист ожидания'
                          : 'Записаться'}
                    </button>
                  </div>
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
