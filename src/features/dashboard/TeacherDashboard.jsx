import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader } from '../../shared/ui/index.js';
import { AttendanceJournal } from '../attendance/index.js';

export function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`Кабинет преподавателя: ${user?.fullName || 'Преподаватель'}`}
        subtitle="Журнал посещаемости, отметка статусов учеников и история занятий"
      />

      <AttendanceJournal />
    </div>
  );
}
