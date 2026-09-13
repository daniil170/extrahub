import { useState } from 'react';
import { BarChart3, CreditCard, UserPlus, GraduationCap } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader } from '../../shared/ui/index.js';
import { CapacityOverview } from './CapacityOverview.jsx';
import { PaymentManagement } from './PaymentManagement.jsx';
import { StaffInvitesTab } from './StaffInvitesTab.jsx';
import { ExamApplicationsTab } from './ExamApplicationsTab.jsx';

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('capacity'); // 'capacity' | 'payments' | 'invites' | 'exams'
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`${isAdmin ? 'Панель администратора' : 'Панель координатора'}: ${
          user?.fullName || (isAdmin ? 'Администратор школы' : 'Координатор')
        }`}
        subtitle={
          isAdmin
            ? 'Администрирование школьных программ, мониторинг заполняемости групп и управление сотрудниками'
            : 'Мониторинг загрузки кружков, управление вместимостью групп и приглашение преподавателей'
        }
      />

      {/* Main Feature Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('capacity')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'capacity' ? 600 : 500,
            color: activeTab === 'capacity' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${activeTab === 'capacity' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <BarChart3 size={16} />
          <span>Мониторинг загрузки и группы</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'payments' ? 600 : 500,
            color: activeTab === 'payments' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${activeTab === 'payments' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <CreditCard size={16} />
          <span>Выставление и учёт оплаты</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invites')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'invites' ? 600 : 500,
            color: activeTab === 'invites' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${activeTab === 'invites' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <UserPlus size={16} />
          <span>Приглашения сотрудников</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'exams' ? 600 : 500,
            color: activeTab === 'exams' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${activeTab === 'exams' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <GraduationCap size={16} />
          <span>Заявки на экзамен</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'capacity' && <CapacityOverview />}
      {activeTab === 'payments' && <PaymentManagement />}
      {activeTab === 'invites' && <StaffInvitesTab />}
      {activeTab === 'exams' && <ExamApplicationsTab />}
    </div>
  );
}
