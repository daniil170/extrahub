import { PageHeader } from '../../shared/ui/index.js';
import { TeacherEquipmentSection } from './TeacherEquipmentSection.jsx';

/**
 * Dedicated page for teachers at /teacher/equipment
 */
export function TeacherEquipmentPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title="Заявки о поломке школьного оборудования"
        subtitle="Регистрация неисправностей, отслеживание статуса ремонта и связь с технической службой"
      />
      <TeacherEquipmentSection />
    </div>
  );
}
