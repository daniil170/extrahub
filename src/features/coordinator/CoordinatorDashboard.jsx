import { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader } from '../../shared/ui/index.js';
import { CapacityOverview } from './CapacityOverview.jsx';
import { PaymentManagement } from './PaymentManagement.jsx';

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('capacity'); // 'capacity' | 'payments'
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      <PageHeader
        title={`${isAdmin ? '⚙️ Панель администратора' : '📋 Панель координатора'}: ${
          user?.fullName || (isAdmin ? 'Администратор школы' : 'Координатор')
        }`}
        subtitle={
          isAdmin
            ? 'Администрирование школьных программ, мониторинг заполняемости групп и финансовый аудит'
            : 'Мониторинг загрузки кружков, управление вместимостью групп и биллинг школьных оплат'
        }
      />

      {/* Main Feature Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('capacity')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '15px',
            fontWeight: activeTab === 'capacity' ? 700 : 500,
            color: activeTab === 'capacity' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `3px solid ${activeTab === 'capacity' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📊 Мониторинг загрузки и группы</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '15px',
            fontWeight: activeTab === 'payments' ? 700 : 500,
            color: activeTab === 'payments' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `3px solid ${activeTab === 'payments' ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>💳 Выставление и учёт оплаты</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'capacity' ? <CapacityOverview /> : <PaymentManagement />}
    </div>
  );
}
