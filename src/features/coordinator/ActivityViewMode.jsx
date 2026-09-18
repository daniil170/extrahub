import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  User,
  MapPin,
  Award,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { Card, Badge, Button } from '../../shared/ui/index.js';
import { formatCurrency, formatDaysOfWeek } from '../../shared/utils/index.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

export function ActivityViewMode({ activities, groups, onOpenDetails }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'circle' | 'club' | 'olympic_reserve'
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
      const totalWaitlist = actGroups.reduce((sum, g) => sum + (Number(g.waitlistCount) || 0), 0);
      const percent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

      const avgAttendance = 0;
      const studentMastery = 0;

      // Enrich individual groups with rich group analytics
      const enrichedGroups = actGroups.map((grp, idx) => {
        const grpCap = Number(grp.capacity) || 0;
        const grpEnrolled = Number(grp.enrolledCount) || 0;
        const grpPercent = grpCap > 0 ? Math.round((grpEnrolled / grpCap) * 100) : 0;
        const grpAvailable = Math.max(0, grpCap - grpEnrolled);
        const grpWaitlist = Number(grp.waitlistCount) || 0;

        const grpAttendance = 0;
        const grpMastery = 0;

        let grpStatusBadge = {
          label: `Свободно: ${grpAvailable} мест`,
          color: 'var(--success)',
          bg: 'var(--success-light)',
          border: 'rgba(16, 185, 129, 0.3)',
        };

        if (grpCap > 0 && grpEnrolled >= grpCap) {
          grpStatusBadge = {
            label: grpWaitlist > 0 ? `100% заполнена (${grpWaitlist} в очереди)` : '100% заполнена',
            color: 'var(--danger)',
            bg: 'var(--danger-light)',
            border: 'rgba(239, 68, 68, 0.3)',
          };
        } else if (grpAvailable <= 2) {
          grpStatusBadge = {
            label: `Осталось ${grpAvailable} ${grpAvailable === 1 ? 'место' : 'места'}`,
            color: '#b45309',
            bg: '#fef3c7',
            border: 'rgba(245, 158, 11, 0.3)',
          };
        }

        return {
          ...grp,
          grpCap,
          grpEnrolled,
          grpPercent,
          grpAvailable,
          grpWaitlist,
          grpAttendance,
          grpMastery,
          grpStatusBadge,
        };
      });

      return {
        ...act,
        groups: enrichedGroups,
        totalCapacity,
        totalEnrolled,
        totalWaitlist,
        percent,
        avgAttendance,
        studentMastery,
      };
    });
  }, [activities, groups]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return combinedActivities.filter((act) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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
        if (selectedType === 'club' && act.type !== 'club') return false;
        if (
          selectedType === 'circle' &&
          (act.type === 'club' || act.type === 'olympic_reserve')
        ) {
          return false;
        }
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
              <option value="circle">Обычные кружки (секции)</option>
              <option value="club">Клубы</option>
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
              <option value="all">Все смены</option>
              {schoolConfig.shifts.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Quick Reset / Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>
            Показано программ: <strong>{filteredActivities.length}</strong> из <strong>{combinedActivities.length}</strong>
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
            Программы не найдены
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

      {/* Activities Grid with Rich Group Analytics */}
      {filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
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
                  borderTop: `4px solid ${
                    act.type === 'olympic_reserve'
                      ? '#f59e0b'
                      : act.type === 'club'
                      ? '#10b981'
                      : 'var(--primary)'
                  }`,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  padding: '20px',
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
                    {act.type === 'club' && (
                      <Badge
                        variant="secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          borderColor: 'rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <Users size={12} />
                        Клуб
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
                      margin: '0 0 6px',
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
                      marginBottom: '12px',
                      minHeight: '36px',
                    }}
                  >
                    {act.description || 'Описание направления уточняется.'}
                  </p>

                  {/* Meta Details: Teacher & Room */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{act.teacherName || 'Преподаватель уточняется'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{act.location || 'Школьный корпус'}</span>
                    </div>
                  </div>

                  {/* Activity-Level Metrics Summary Banner */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px',
                      backgroundColor: 'rgba(14, 124, 107, 0.04)',
                      border: '1px solid rgba(14, 124, 107, 0.15)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Заполнение
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: statusColor }}>
                        {act.totalEnrolled}/{act.totalCapacity} ({act.percent}%)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Посещаемость
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#059669' }}>
                        {act.avgAttendance}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Успеваемость
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                        {act.studentMastery}%
                      </div>
                    </div>
                  </div>

                  {/* Deep Group-By-Group Analytics Breakdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={14} color="var(--primary)" />
                        Аналитика по группам ({act.groups.length})
                      </span>
                      {act.totalWaitlist > 0 && (
                        <span style={{ fontSize: '11.5px', color: 'var(--accent-coral)', fontWeight: 600 }}>
                          В очереди: {act.totalWaitlist} чел.
                        </span>
                      )}
                    </div>

                    {act.groups.length === 0 ? (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          padding: '10px 12px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                        }}
                      >
                        Группы пока не сформированы в расписании
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {act.groups.map((grp) => {
                          const isGrpFull = grp.grpCap > 0 && grp.grpEnrolled >= grp.grpCap;
                          const grpStatusColor = isGrpFull
                            ? 'var(--danger)'
                            : grp.grpPercent >= 80
                            ? 'var(--warning)'
                            : 'var(--success)';

                          return (
                            <div
                              key={grp.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              }}
                            >
                              {/* Group Header: Name, Schedule & Status Badge */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '6px',
                                }}
                              >
                                <div>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                    {grp.name || 'Основная группа'}
                                  </strong>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '6px' }}>
                                    • {formatDaysOfWeek(grp.daysOfWeek)} {grp.startTime}–{grp.endTime}
                                  </span>
                                </div>

                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: grp.grpStatusBadge.bg,
                                    color: grp.grpStatusBadge.color,
                                    border: `1px solid ${grp.grpStatusBadge.border}`,
                                  }}
                                >
                                  {grp.grpStatusBadge.label}
                                </span>
                              </div>

                              {/* Group Capacity Progress Bar */}
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '11.5px',
                                    marginBottom: '4px',
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                >
                                  <span style={{ color: 'var(--text-secondary)' }}>Заполнение группы:</span>
                                  <span style={{ fontWeight: 700, color: grpStatusColor }}>
                                    {grp.grpEnrolled} / {grp.grpCap} уч. ({grp.grpPercent}%)
                                  </span>
                                </div>
                                <div
                                  style={{
                                    width: '100%',
                                    height: '5px',
                                    backgroundColor: 'var(--bg-subtle)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(100, grp.grpPercent)}%`,
                                      height: '100%',
                                      backgroundColor: grpStatusColor,
                                      borderRadius: '3px',
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Group Micro Analytics: 3 Stats */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '6px',
                                  paddingTop: '4px',
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  borderTop: '1px dashed var(--border-color)',
                                }}
                              >
                                <div>
                                  Посещаемость:{' '}
                                  <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                                    {grp.grpAttendance}%
                                  </strong>
                                </div>
                                <div>
                                  Успеваемость:{' '}
                                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                                    {grp.grpMastery}%
                                  </strong>
                                </div>
                                <div>
                                  Свободно:{' '}
                                  <strong style={{ color: grp.grpAvailable > 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                                    {grp.grpAvailable} мест
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price and Syllabus Button */}
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
                      Стоимость обучения
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
                      fontWeight: 600,
                    }}
                  >
                    <BookOpen size={14} />
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
