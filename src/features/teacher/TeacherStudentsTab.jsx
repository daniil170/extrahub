import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  Award,
  Search,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Card, Badge, Button, Spinner } from '../../shared/ui/index.js';
import { exportToExcel, formatDaysOfWeek } from '../../shared/utils/index.js';
import { fetchTeacherGroups, fetchGroupStudents } from '../attendance/api.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

export function TeacherStudentsTab() {
  const { user } = useAuth();
  const teacherId = user?.id || 'teacher-1';

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch teacher groups
        const loadedGroups = await fetchTeacherGroups(teacherId);

        // 2. Fetch Firestore attendance and achievements
        const [attSnap, achsSnap] = await Promise.all([
          getDocs(collection(db, COLLECTIONS.ATTENDANCE)).catch(() => ({ docs: [] })),
          getDocs(collection(db, COLLECTIONS.ACHIEVEMENTS || 'achievements')).catch(() => ({ docs: [] })),
        ]);

        const liveAtt = attSnap.docs ? attSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
        const liveAchs = achsSnap.docs ? achsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];

        // 3. Fetch students for each group
        const groupStudentsPromises = loadedGroups.map(async (group) => {
          const groupStuds = await fetchGroupStudents(group.id);
          return {
            group,
            students: groupStuds,
          };
        });

        const groupResults = await Promise.all(groupStudentsPromises);

        if (!isMounted) return;

        setGroups(loadedGroups);
        setAttendanceRecords(liveAtt);
        setAchievements(liveAchs);

        // Flatten student entries with group context
        const allStudentsList = [];
        const seenStudentGroup = new Set();

        groupResults.forEach(({ group, students: studs }) => {
          studs.forEach((st) => {
            const key = `${st.id}_${group.id}`;
            if (!seenStudentGroup.has(key)) {
              seenStudentGroup.add(key);
              allStudentsList.push({
                ...st,
                groupId: group.id,
                groupName: group.name,
                activityTitle: group.activityTitle,
                location: group.location,
              });
            }
          });
        });

        setStudents(allStudentsList);
      } catch (err) {
        console.error('Failed to load teacher stats data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  // Map student attendance
  const studentAttMap = useMemo(() => {
    const map = {};

    // Live attendance
    attendanceRecords.forEach((rec) => {
      if (rec.studentId) {
        if (!map[rec.studentId]) {
          map[rec.studentId] = { total: 0, present: 0 };
        }
        map[rec.studentId].total += 1;
        if (rec.status === 'present' || rec.status === 'late') {
          map[rec.studentId].present += 1;
        }
      }
    });

    return map;
  }, [attendanceRecords]);

  // Map student achievements
  const studentAchievementsMap = useMemo(() => {
    const map = {};
    achievements.forEach((ach) => {
      if (ach.studentId) {
        if (!map[ach.studentId]) map[ach.studentId] = [];
        map[ach.studentId].push(ach);
      }
    });
    return map;
  }, [achievements]);

  // Enriched student data with computed attendance rate and achievements
  const enrichedStudents = useMemo(() => {
    return students.map((st) => {
      const att = studentAttMap[st.id];
      const attendanceRate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
      const achs = studentAchievementsMap[st.id] || [];

      return {
        ...st,
        attendanceRate,
        achievementsList: achs,
        achievementsCount: achs.length,
      };
    });
  }, [students, studentAttMap, studentAchievementsMap]);

  // Overall Teacher KPI metrics
  const kpis = useMemo(() => {
    const totalGroups = groups.length;
    const uniqueStudents = new Set(students.map((s) => s.id)).size;

    let totalCapacity = 0;
    let totalEnrolled = 0;
    groups.forEach((g) => {
      totalCapacity += g.maxCapacity || 15;
      totalEnrolled += g.enrolledCount || 0;
    });

    const averageOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    let totalAttSum = 0;
    enrichedStudents.forEach((s) => {
      totalAttSum += s.attendanceRate;
    });
    const avgAttendance = enrichedStudents.length > 0 ? Math.round(totalAttSum / enrichedStudents.length) : 0;

    return {
      totalGroups,
      uniqueStudents,
      averageOccupancy,
      avgAttendance,
    };
  }, [groups, students, enrichedStudents]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((st) => {
      const matchesGroup = selectedGroupFilter === 'all' || st.groupId === selectedGroupFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (st.fullName || '').toLowerCase().includes(q) ||
        (st.className || '').toLowerCase().includes(q) ||
        (st.activityTitle || '').toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [enrichedStudents, selectedGroupFilter, searchQuery]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const exportRows = filteredStudents.map((st, index) => ({
      '№': index + 1,
      'ФИО ученика': st.fullName || '—',
      'Класс': st.className || '—',
      'Кружок / Секция': st.activityTitle || '—',
      'Группа': st.groupName || '—',
      'Посещаемость (%)': `${st.attendanceRate}%`,
      'Количество наград': st.achievementsCount,
      'Достижения': st.achievementsList.map((a) => a.title).join('; ') || '—',
      'Локация': st.location || '—',
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel({
      filename: `extrahub-teacher-students-${dateStr}`,
      sheetName: 'Ученики и статистика',
      data: exportRows,
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка статистики преподавателя..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Мои группы</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light, rgba(37, 99, 235, 0.1))',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {kpis.totalGroups}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            активных секций под руководством
          </div>
        </Card>

        <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Всего учеников</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light, rgba(37, 99, 235, 0.1))',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {kpis.uniqueStudents}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            уникальных школьников в группах
          </div>
        </Card>

        <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Средняя заполняемость</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--success-light, rgba(16, 185, 129, 0.1))',
                color: 'var(--success, #10b981)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={18} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {kpis.averageOccupancy}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            от максимальной квоты кружков
          </div>
        </Card>

        <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Средняя посещаемость</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--warning-light, rgba(245, 158, 11, 0.1))',
                color: 'var(--warning, #f59e0b)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {kpis.avgAttendance}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            на основе электронного журнала
          </div>
        </Card>
      </div>

      {/* Groups Capacity & Schedule Overview */}
      <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
          Мои кружки и группы ({groups.length})
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {groups.map((grp) => {
            const enrolled = grp.enrolledCount || 0;
            const max = grp.maxCapacity || 15;
            const pct = Math.min(100, Math.round((enrolled / max) * 100));

            return (
              <div
                key={grp.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {grp.activityTitle || 'Кружок'}
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {grp.name || 'Основная группа'}
                    </div>
                  </div>
                  <Badge variant={pct >= 90 ? 'warning' : 'success'}>
                    {pct}% заполнено
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Учеников: <strong>{enrolled}</strong> / {max}</span>
                    <span>Свободно: {Math.max(0, max - enrolled)}</span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--border-color)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: pct >= 90 ? 'var(--warning)' : 'var(--primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  <span>{formatDaysOfWeek(grp.daysOfWeek)} {grp.startTime}–{grp.endTime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Students Table with Search & Excel Export */}
      <Card style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
              Список учеников и статистика ({filteredStudents.length})
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Данные по посещаемости и достижениям учащихся в ваших группах
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FileSpreadsheet size={16} />
            <span>Экспорт в Excel (.xlsx)</span>
          </Button>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              flex: '1 1 240px',
              maxWidth: '360px',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Поиск по ФИО, классу или кружку..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Group dropdown filter */}
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Все мои группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.activityTitle} ({g.name})
              </option>
            ))}
          </select>
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
            Ученики не найдены по заданным критериям
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>ФИО ученика</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Класс</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Кружок / Группа</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Посещаемость</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Достижения</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr
                    key={`${st.id}_${st.groupId}`}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light, rgba(37, 99, 235, 0.1))',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {(st.fullName || 'У')[0]}
                        </span>
                        <span>{st.fullName || `Ученик (${st.id})`}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {st.className || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {st.activityTitle || 'Кружок'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {st.groupName || 'Группа'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              st.attendanceRate >= 90
                                ? 'var(--success)'
                                : st.attendanceRate >= 75
                                  ? 'var(--warning)'
                                  : 'var(--danger)',
                          }}
                        >
                          {st.attendanceRate}%
                        </span>
                        <div
                          style={{
                            width: '50px',
                            height: '6px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--border-color)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${st.attendanceRate}%`,
                              height: '100%',
                              backgroundColor:
                                st.attendanceRate >= 90
                                ? 'var(--success)'
                                : st.attendanceRate >= 75
                                  ? 'var(--warning)'
                                  : 'var(--danger)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {st.achievementsCount > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <Badge variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={12} />
                            <span>{st.achievementsCount}</span>
                          </Badge>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {st.achievementsList[0]?.title}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
