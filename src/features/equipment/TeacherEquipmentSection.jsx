import { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useEquipmentIssues } from './useEquipmentIssues.js';
import { EquipmentIssueCard } from './EquipmentIssueCard.jsx';
import { CreateIssueModal } from './CreateIssueModal.jsx';
import { IssueDetailsModal } from './IssueDetailsModal.jsx';
import { Button, Spinner, Card } from '../../shared/ui/index.js';

/**
 * Teacher equipment section component with list of teacher's issues and creation form
 */
export function TeacherEquipmentSection() {
  const { user } = useAuth();
  const {
    issues,
    allIssues,
    loading,
    error,
    filters,
    setStatusFilter,
    createIssue,
    takeIntoWork,
    resolveIssue,
    cancelIssue,
    addComment,
    getComments,
  } = useEquipmentIssues();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const statusCounts = {
    all: allIssues.length,
    new: allIssues.filter((i) => i.status === 'new').length,
    in_progress: allIssues.filter((i) => i.status === 'in_progress').length,
    resolved: allIssues.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div>
      {/* Top Header & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
            🛠️ Заявки на ремонт оборудования
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Сообщайте о неисправностях мебели, компьютеров, освещения и сантехники в кабинетах
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>➕</span>
          <span>Подать заявку</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'all', label: 'Все мои заявки', count: statusCounts.all },
          { id: 'new', label: 'Новые', count: statusCounts.new },
          { id: 'in_progress', label: 'В работе', count: statusCounts.in_progress },
          { id: 'resolved', label: 'Закрытые', count: statusCounts.resolved },
        ].map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner size="md" label="Загрузка заявок..." />
        </div>
      ) : error ? (
        <Card style={{ borderColor: 'var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
          {error}
        </Card>
      ) : issues.length === 0 ? (
        /* Empty state */
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            {filters.status === 'all'
              ? 'У вас пока нет активных заявок на ремонт'
              : 'В выбранном статусе заявок не найдено'}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
            Если в вашем кабинете возникла проблема с проектором, партой, розеткой или сантехникой — создайте заявку, и дежурный завхоз приступит к ремонту.
          </p>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            Подать первую заявку
          </Button>
        </div>
      ) : (
        /* Issues Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {issues.map((issue) => (
            <EquipmentIssueCard
              key={issue.id}
              issue={issue}
              currentUserRole={user?.role || 'teacher'}
              currentUserId={user?.id}
              onOpenDetails={(iss) => setSelectedIssue(iss)}
              onCancelIssue={(id) => cancelIssue(id, 'Отменено преподавателем')}
            />
          ))}
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createIssue}
      />

      {/* Issue Details & Chat Modal */}
      <IssueDetailsModal
        isOpen={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        currentUser={user}
        onTakeIntoWork={takeIntoWork}
        onResolve={resolveIssue}
        onCancel={cancelIssue}
        onAddComment={addComment}
        onGetComments={getComments}
      />
    </div>
  );
}
