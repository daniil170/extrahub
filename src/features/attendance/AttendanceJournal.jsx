import { useAttendance } from './useAttendance.js';
import { Card, Button, Spinner } from '../../shared/ui/index.js';
import { formatDaysOfWeek } from '../../shared/utils/index.js';

const STATUS_OPTIONS = [
  {
    value: 'present',
    label: 'Присутствовал',
    icon: '🟢',
    color: 'var(--success)',
    bg: 'var(--success-light)',
  },
  {
    value: 'absent',
    label: 'Отсутствовал',
    icon: '🔴',
    color: 'var(--danger)',
    bg: 'var(--danger-light)',
  },
  {
    value: 'late',
    label: 'Опоздал',
    icon: '🟡',
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
  },
  {
    value: 'excused',
    label: 'Уважительная',
    icon: '🔵',
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
  },
];

export function AttendanceJournal() {
  const {
    teacherGroups,
    selectedGroupId,
    setSelectedGroupId,
    selectedDate,
    setSelectedDate,
    students,
    attendanceMap,
    setStatus,
    markAll,
    saveAttendance,
    loading,
    isSaving,
    saveSuccess,
    error,
  } = useAttendance();

  const selectedGroup = teacherGroups.find((g) => g.id === selectedGroupId) || teacherGroups[0];

  // Calculate statistics
  const total = students.length;
  const presentCount = students.filter(
    (s) => (attendanceMap[s.id] || 'present') === 'present'
  ).length;
  const absentCount = students.filter((s) => attendanceMap[s.id] === 'absent').length;
  const lateCount = students.filter((s) => attendanceMap[s.id] === 'late').length;
  const excusedCount = students.filter((s) => attendanceMap[s.id] === 'excused').length;

  const handleSetToday = () => {
    const d = new Date();
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(str);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(str);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Save Success Alert */}
      {saveSuccess && (
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
          ✅ Посещаемость успешно сохранена!
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

      {/* Group & Date Selectors Card */}
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {/* Group Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Группа и кружок:
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              aria-label="Выбор группы"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {teacherGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.activityTitle} — {g.name || 'Основная группа'} (
                  {formatDaysOfWeek(g.daysOfWeek)} {g.startTime}–{g.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Дата занятия:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Дата занятия"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <Button size="sm" variant="outline" onClick={handleSetToday}>
                Сегодня
              </Button>
              <Button size="sm" variant="outline" onClick={handleSetYesterday}>
                Вчера
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Group Info Banner */}
        {selectedGroup && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              📍 <strong>Локация:</strong> {selectedGroup.location || 'Школьный корпус'}
            </div>
            <div>
              📅 <strong>Расписание:</strong> {formatDaysOfWeek(selectedGroup.daysOfWeek)}{' '}
              {selectedGroup.startTime}–{selectedGroup.endTime}
            </div>
            <div>
              👥 <strong>Учеников в группе:</strong> {students.length}
            </div>
          </div>
        )}
      </Card>

      {/* Metrics and Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Всего в группе</div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: '2px',
            }}
          >
            {total}
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--success-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--success)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
            Присутствуют
          </div>
          <div
            style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}
          >
            {presentCount}
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--danger-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
            Отсутствуют
          </div>
          <div
            style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}
          >
            {absentCount}
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--warning-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--warning)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>Опоздали</div>
          <div
            style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)', marginTop: '2px' }}
          >
            {lateCount}
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
            Уважительная
          </div>
          <div
            style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}
          >
            {excusedCount}
          </div>
        </div>
      </div>

      {/* Main Journal Card */}
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              Журнал посещаемости на {selectedDate}
            </h3>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Отметьте статус каждого ученика и нажмите кнопку сохранения
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button size="sm" variant="outline" onClick={() => markAll('present')}>
              👍 Отметить всех присутствующими
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={saveAttendance}
              disabled={isSaving || students.length === 0}
            >
              {isSaving ? 'Сохранение...' : '💾 Сохранить посещаемость'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner size="md" label="Загрузка списка учеников..." />
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
            В выбранной группе пока нет активных учеников
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {students.map((student, idx) => {
              const currentStatus = attendanceMap[student.id] || 'present';

              return (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Student Name and Class */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '20px' }}
                    >
                      {idx + 1}.
                    </span>
                    <div>
                      <div
                        style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {student.fullName}
                      </div>
                      {student.className && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Класс: {student.className}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Segmented Control / Radio Chips */}
                  <div
                    className="attendance-status-group"
                    role="radiogroup"
                    aria-label={`Статус посещаемости для ${student.fullName}`}
                  >
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = currentStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setStatus(student.id, opt.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? opt.bg : 'transparent',
                            color: isSelected ? opt.color : 'var(--text-secondary)',
                            boxShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Save bar */}
        {students.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <Button variant="primary" onClick={saveAttendance} disabled={isSaving}>
              {isSaving ? 'Сохранение журнала...' : '💾 Сохранить посещаемость'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
