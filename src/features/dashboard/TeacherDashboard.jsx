import { useState, useEffect } from 'react';
import { GraduationCap, Users, Calendar, Sword } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader, IconBookOpen, IconWrench } from '../../shared/ui/index.js';
import { AttendanceJournal } from '../attendance/index.js';
import { TeacherEquipmentSection, EquipmentMaintenancePausedPage } from '../equipment/index.js';
import { TeacherExamApplicationsSection } from '../teacher/TeacherExamApplicationsSection.jsx';
import { TeacherStudentsTab } from '../teacher/TeacherStudentsTab.jsx';
import {
  TeacherCalendarManager,
  subscribeClubEvents,
  subscribeAllEventResponses,
} from '../calendar/index.js';
import { fetchTeacherGroups } from '../attendance/api.js';
import { schoolConfig } from '../../app/config/schoolConfig.js';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'students' | 'calendar' | 'exams' | 'equipment'
  const [teacherGroups, setTeacherGroups] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [eventResponses, setEventResponses] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    fetchTeacherGroups(user.id).then((grps) => setTeacherGroups(grps || []));

    const unsubEvents = subscribeClubEvents((evs) => {
      setClubEvents(evs || []);
    });

    const unsubResponses = subscribeAllEventResponses((resps) => {
      setEventResponses(resps || []);
    });

    return () => {
      unsubEvents();
      unsubResponses();
    };
  }, [user?.id]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`Кабинет преподавателя: ${user?.fullName || 'Преподаватель'}`}
        subtitle="Журнал посещаемости, статистика кружков, проверка вступительных экзаменов и заявки на ремонт"
      />

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'attendance' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'attendance' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'attendance' ? '#ffffff' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconBookOpen size={16} />
          <span>Журнал посещаемости</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'students' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'students' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'students' ? '#ffffff' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} />
          <span>Статистика и ученики</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'calendar' ? '2px solid #db2777' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'calendar' ? '#db2777' : 'transparent',
            color: activeTab === 'calendar' ? '#ffffff' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sword size={16} />
          <span>Босс-События и Календарь</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'exams' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'exams' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'exams' ? '#ffffff' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <GraduationCap size={16} />
          <span>Вступительные экзамены</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('equipment')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'equipment' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'equipment' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'equipment' ? '#ffffff' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconWrench size={16} />
          <span>Заявки на ремонт</span>
          {!schoolConfig.equipmentModuleEnabled && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'equipment' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                color: activeTab === 'equipment' ? '#ffffff' : 'var(--text-muted)',
                border: activeTab === 'equipment' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              Пауза
            </span>
          )}
        </button>
      </div>

      {activeTab === 'attendance' && <AttendanceJournal />}
      {activeTab === 'students' && <TeacherStudentsTab />}
      {activeTab === 'calendar' && (
        <TeacherCalendarManager
          teacherId={user?.id}
          teacherName={user?.fullName || 'Преподаватель'}
          teacherGroups={teacherGroups}
          events={clubEvents}
          eventResponses={eventResponses}
          onRefresh={() => {
            if (user?.id) {
              fetchTeacherGroups(user.id).then((grps) => setTeacherGroups(grps || []));
            }
          }}
        />
      )}
      {activeTab === 'exams' && <TeacherExamApplicationsSection />}
      {activeTab === 'equipment' && (
        schoolConfig.equipmentModuleEnabled ? (
          <TeacherEquipmentSection />
        ) : (
          <EquipmentMaintenancePausedPage />
        )
      )}
    </div>
  );
}
