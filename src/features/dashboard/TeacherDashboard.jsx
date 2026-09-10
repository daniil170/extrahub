import { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader } from '../../shared/ui/index.js';
import { AttendanceJournal } from '../attendance/index.js';
import { TeacherEquipmentSection } from '../equipment/index.js';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`Кабинет преподавателя: ${user?.fullName || 'Преподаватель'}`}
        subtitle="Журнал посещаемости, учет учеников и заявки на ремонт оборудования"
      />

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
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
          }}
        >
          📖 Журнал посещаемости
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
          }}
        >
          🛠️ Заявки на ремонт оборудования
        </button>
      </div>

      {activeTab === 'attendance' ? <AttendanceJournal /> : <TeacherEquipmentSection />}
    </div>
  );
}
