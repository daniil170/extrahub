import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader, IconBookOpen, IconWrench } from '../../shared/ui/index.js';
import { AttendanceJournal } from '../attendance/index.js';
import { TeacherEquipmentSection } from '../equipment/index.js';
import { TeacherExamApplicationsSection } from '../teacher/TeacherExamApplicationsSection.jsx';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'equipment' | 'exams'

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`Кабинет преподавателя: ${user?.fullName || 'Преподаватель'}`}
        subtitle="Журнал посещаемости, проверка вступительных экзаменов и заявки на ремонт"
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
        </button>
      </div>

      {activeTab === 'attendance' && <AttendanceJournal />}
      {activeTab === 'exams' && <TeacherExamApplicationsSection />}
      {activeTab === 'equipment' && <TeacherEquipmentSection />}
    </div>
  );
}
