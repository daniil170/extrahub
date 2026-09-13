import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  User,
  MapPin,
  Award,
  Layers,
} from 'lucide-react';
import { Card, Badge, Button } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';

export function ActivityViewMode({ activities, groups, onOpenDetails }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'club' | 'olympic_reserve'
  const [selectedShift, setSelectedShift] = useState('all'); // 'all' | '1' | '2'

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    activities.forEach((act) => {
      if (act.category) set.add(act.category);
    });
    return Array.from(set);
  }, [activities]);

  // Combine activities with their respective groups and calculate metrics
  const combinedActivities = useMemo(() => {
    const groupsByAct = {};
    groups.forEach((g) => {
      if (!groupsByAct[g.activityId]) {
        groupsByAct[g.activityId] = [];
      }
      groupsByAct[g.activityId].push(g);
    });

    return activities.map((act) => {
      const actGroups = groupsByAct[act.id] || [];
      const totalCapacity = actGroups.reduce((sum, g) => sum + (Number(g.capacity) || 0), 0);
      const totalEnrolled = actGroups.reduce((sum, g) => sum + (Number(g.enrolledCount) || 0), 0);
      const percent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

      return {
        ...act,
        groups: actGroups,
        totalCapacity,
        totalEnrolled,
        percent,
      };
    });
  }, [activities, groups]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return combinedActivities.filter((act) => {
      // 1. Search Query
      if (q) {
        const titleMatch = (act.title || '').toLowerCase().includes(q);
        const descMatch = (act.description || '').toLowerCase().includes(q);
        const teacherMatch = (act.teacherName || '').toLowerCase().includes(q);
        const subjectMatch = (act.subject || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !teacherMatch && !subjectMatch) return false;
      }

      // 2. Category
      if (selectedCategory !== 'all' && act.category !== selectedCategory) {
        return false;
      }

      // 3. Type
      if (selectedType !== 'all') {
        if (selectedType === 'olympic_reserve' && act.type !== 'olympic_reserve') return false;
        if (selectedType === 'club' && act.type === 'olympic_reserve') return false;
      }

      // 4. Shift
      if (selectedShift !== 'all') {
        const shiftNum = Number(selectedShift);
        if (Array.isArray(act.allowedShifts) && act.allowedShifts.length > 0) {
          if (!act.allowedShifts.map(Number).includes(shiftNum)) return false;
        }
      }

      return true;
    });
  }, [combinedActivities, searchQuery, selectedCategory, selectedType, selectedShift]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Filter Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
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
              placeholder="Поиск кружка, предмета, преподавателя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Все категории ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Все типы программ</option>
              <option value="club">Обычные кружки</option>
              <option value="olympic_reserve">Олимпийский резерв</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Все смены (1 и 2)</option>
              <option value="1">1 смена</option>
              <option value="2">2 смена</option>
            </select>
          </div>
        </div>

        {/* Filter Quick Reset / Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>
            Показано кружков: <strong>{filteredActivities.length}</strong> из <strong>{combinedActivities.length}</strong>
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || selectedShift !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedShift('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '12.5px',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Search size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Кружки не найдены
          </h4>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Попробуйте изменить параметры поиска или фильтры смен и категорий.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedType('all');
              setSelectedShift('all');
            }}
          >
            Сбросить поиск
          </Button>
        </Card>
      )}

      {/* Activities Grid */}
      {filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredActivities.map((act) => {
            const isFull = act.totalCapacity > 0 && act.totalEnrolled >= act.totalCapacity;
            const statusColor = isFull
              ? 'var(--danger)'
              : act.percent >= 80
                ? 'var(--warning)'
                : 'var(--success)';

            return (
              <Card
                key={act.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  borderTop: `4px solid ${act.type === 'olympic_reserve' ? '#f59e0b' : 'var(--primary)'}`,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Badge variant="info">{act.category}</Badge>
                    {act.type === 'olympic_reserve' && (
                      <Badge
                        variant="warning"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Award size={12} />
                        Олимп. резерв{act.subject ? `: ${act.subject}` : ''}
                      </Badge>
                    )}
                    {act.requiresExam && (
                      <Badge variant="secondary">Вступительный экзамен</Badge>
                    )}
                    {Array.isArray(act.allowedClasses) && act.allowedClasses.length > 0 && (
                      <Badge variant="default">
                        {act.allowedClasses.join(', ')} классы
                      </Badge>
                    )}
                    {Array.isArray(act.allowedShifts) && act.allowedShifts.length > 0 && (
                      <Badge variant="default">
                        {act.allowedShifts.map((s) => `${s} см.`).join(', ')}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
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
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      minHeight: '38px',
                    }}
                  >
                    {act.description || 'Описание направления уточняется.'}
                  </p>

                  {/* Meta Details: Teacher & Room */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        <strong>Преподаватель:</strong> {act.teacherName || 'Не назначен'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        <strong>Кабинет / локация:</strong> {act.location || 'Школьный корпус'}
                      </span>
                    </div>
                  </div>

                  {/* Groups Breakdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Layers size={13} />
                        Сформированные группы ({act.groups.length})
                      </span>
                      <span style={{ color: statusColor, fontFamily: 'var(--font-mono)' }}>
                        {act.totalEnrolled} / {act.totalCapacity} мест ({act.percent}%)
                      </span>
                    </div>

                    {/* Progress Bar for Total Activity */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, act.percent)}%`,
                          height: '100%',
                          backgroundColor: statusColor,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Groups List */}
                    {act.groups.length === 0 ? (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          padding: '8px 10px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontStyle: 'italic',
                        }}
                      >
                        Группы пока не открыты
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {act.groups.map((grp) => {
                          const grpEnrolled = Number(grp.enrolledCount) || 0;
                          const grpCap = Number(grp.capacity) || 0;
                          const grpPercent = grpCap > 0 ? Math.round((grpEnrolled / grpCap) * 100) : 0;

                          return (
                            <div
                              key={grp.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-color)',
                                fontSize: '12px',
                              }}
                            >
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{grp.name}</strong>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                  ({formatDaysOfWeek(grp.daysOfWeek)} {grp.startTime}–{grp.endTime})
                                </span>
                              </div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {grpEnrolled}/{grpCap} ({grpPercent}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                      Стоимость
                    </span>
                    <strong style={{ fontSize: '16px', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                      {act.price === 0 ? 'Бесплатно' : `${formatCurrency(act.price)}`}
                    </strong>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenDetails(act)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Программа курса</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
