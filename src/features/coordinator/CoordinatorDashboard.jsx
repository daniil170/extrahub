import { useState } from 'react';
import { BarChart3, CreditCard, UserPlus, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader } from '../../shared/ui/index.js';
import { CapacityOverview } from './CapacityOverview.jsx';
import { PaymentManagement } from './PaymentManagement.jsx';
import { StaffInvitesTab } from './StaffInvitesTab.jsx';
import { ExamApplicationsTab } from './ExamApplicationsTab.jsx';
import { AnalyticsTab } from './AnalyticsTab.jsx';
import { TeachersTab } from './TeachersTab.jsx';

import { CoordinatorTabsDropdown } from './CoordinatorTabsDropdown.jsx';

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('capacity'); // 'capacity' | 'teachers' | 'payments' | 'invites' | 'exams' | 'analytics'
  const isAdmin = user?.role === 'admin';

  const tabOptions = [
    {
      id: 'capacity',
      label: 'Мониторинг загрузки и группы',
      icon: <BarChart3 size={16} />,
    },
    ...(isAdmin
      ? [
          {
            id: 'teachers',
            label: 'Учителя',
            icon: <Users size={16} />,
          },
        ]
      : []),
    {
      id: 'payments',
      label: 'Выставление и учёт оплаты',
      icon: <CreditCard size={16} />,
    },
    ...(isAdmin
      ? [
          {
            id: 'invites',
            label: 'Приглашения сотрудников',
            icon: <UserPlus size={16} />,
          },
        ]
      : []),
    {
      id: 'exams',
      label: 'Заявки на экзамен',
      icon: <GraduationCap size={16} />,
    },
    {
      id: 'analytics',
      label: 'Аналитика и статистика',
      icon: <TrendingUp size={16} />,
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`${isAdmin ? 'Панель администратора' : 'Панель координатора'}: ${
          user?.fullName || (isAdmin ? 'Администратор школы' : 'Координатор')
        }`}
        subtitle={
          isAdmin
            ? 'Администрирование школьных программ, мониторинг заполняемости групп и управление сотрудниками'
            : 'Мониторинг загрузки кружков, управление вместимостью групп и просмотр статистики'
        }
      />

      {/* Dropdown Selector Navigation */}
      <CoordinatorTabsDropdown
        tabs={tabOptions}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Active Tab View */}
      {activeTab === 'capacity' && <CapacityOverview />}
      {isAdmin && activeTab === 'teachers' && <TeachersTab />}
      {activeTab === 'payments' && <PaymentManagement />}
      {isAdmin && activeTab === 'invites' && <StaffInvitesTab />}
      {activeTab === 'exams' && <ExamApplicationsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
