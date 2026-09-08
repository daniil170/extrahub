import { useState } from 'react';
import { useCoordinatorPayments } from './useCoordinatorPayments.js';
import { Card, Badge, Button, Spinner, Modal } from '../../shared/ui/index.js';
import { formatCurrency, formatDate } from '../../shared/utils/index.js';
import { CreatePaymentModal } from './CreatePaymentModal.jsx';

export function PaymentManagement() {
  const {
    filteredPayments,
    students,
    activities,
    stats,
    loading,
    error,
    isProcessing,
    actionSuccess,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    createSingleInvoice,
    markAsPaid,
    cancelInvoice,
  } = useCoordinatorPayments();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedPaymentForCancel, setSelectedPaymentForCancel] = useState(null);

  const handleOpenCancel = (payment) => {
    setSelectedPaymentForCancel(payment);
    setCancelModalOpen(true);
  };

  const handleCloseCancel = () => {
    setCancelModalOpen(false);
    setSelectedPaymentForCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPaymentForCancel) return;
    await cancelInvoice(selectedPaymentForCancel.id);
    handleCloseCancel();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Загрузка реестра счетов и оплат..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Success Toast */}
      {actionSuccess && (
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
          ✅ {actionSuccess}
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

      {/* Financial Overview KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <Card>
          <div style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: 600 }}>
            Ожидает оплаты
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--warning)',
              margin: '6px 0 4px',
            }}
          >
            {formatCurrency(stats.pendingAmount)}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Счетов: <strong>{stats.pendingCount}</strong>
          </div>
        </Card>

        <Card
          style={{ borderColor: stats.overdueCount > 0 ? 'var(--danger)' : 'var(--border-color)' }}
        >
          <div style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>
            Просроченная задолженность
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--danger)',
              margin: '6px 0 4px',
            }}
          >
            {formatCurrency(stats.overdueAmount)}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Счетов: <strong>{stats.overdueCount}</strong>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
            Собрано (Оплачено)
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--success)',
              margin: '6px 0 4px',
            }}
          >
            {formatCurrency(stats.paidAmount)}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Всего учтённых платежей
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          {/* Status Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'all', label: 'Все счета' },
              { id: 'pending', label: 'Ожидают оплаты' },
              { id: 'overdue', label: 'Просрочено' },
              { id: 'paid', label: 'Оплачено' },
            ].map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Invoicing action */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'flex-end',
              minWidth: '300px',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Поиск по ФИО или кружку..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                minWidth: '220px',
                flex: 1,
              }}
            />

            <Button variant="primary" size="sm" onClick={openCreateModal}>
              + Выставить счёт
            </Button>
          </div>
        </div>
      </Card>

      {/* Payments Table / List */}
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Реестр платежей ({filteredPayments.length})
          </h3>
        </div>

        {filteredPayments.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Счета не найдены</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Попробуйте изменить параметры поиска или сбросить фильтры
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13.5px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '12.5px',
                  }}
                >
                  <th style={{ padding: '10px 12px' }}>Ученик</th>
                  <th style={{ padding: '10px 12px' }}>Кружок</th>
                  <th style={{ padding: '10px 12px' }}>Сумма</th>
                  <th style={{ padding: '10px 12px' }}>Срок оплаты</th>
                  <th style={{ padding: '10px 12px' }}>Статус</th>
                  <th style={{ padding: '10px 12px' }}>Дата оплаты</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isUnpaid = p.status === 'pending' || p.status === 'overdue';

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor:
                          p.status === 'overdue' ? 'var(--danger-light)' : 'transparent',
                      }}
                    >
                      {/* Student */}
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        <div>{p.studentName}</div>
                        {p.className && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--text-muted)',
                              fontWeight: 400,
                            }}
                          >
                            {p.className}
                          </div>
                        )}
                      </td>

                      {/* Activity */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 500 }}>{p.activityTitle}</div>
                      </td>

                      {/* Amount */}
                      <td
                        style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}
                      >
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '12px' }}>{formatDate(p.dueDate)}</td>

                      {/* Status */}
                      <td style={{ padding: '12px' }}>
                        {p.status === 'paid' && <Badge variant="success">Оплачено</Badge>}
                        {p.status === 'pending' && <Badge variant="warning">Ожидает оплаты</Badge>}
                        {p.status === 'overdue' && <Badge variant="danger">Просрочено</Badge>}
                      </td>

                      {/* Paid Date */}
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {isUnpaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(p.id)}
                              disabled={isProcessing}
                              style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
                            >
                              ✓ Оплачено офлайн
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCancel(p)}
                            disabled={isProcessing}
                            style={{ color: 'var(--text-muted)' }}
                            title="Аннулировать счёт"
                          >
                            &times;
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={createModalOpen}
        onClose={closeCreateModal}
        activities={activities}
        students={students}
        onSubmitSingle={createSingleInvoice}
        isProcessing={isProcessing}
      />

      {/* Cancel Payment Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={handleCloseCancel}
        title="Аннулирование счёта"
        maxWidth="440px"
      >
        <div>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}
          >
            Вы уверены, что хотите аннулировать счёт на сумму{' '}
            <strong>{formatCurrency(selectedPaymentForCancel?.amount)}</strong> для ученика{' '}
            <strong>{selectedPaymentForCancel?.studentName}</strong>?
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleCloseCancel} disabled={isProcessing}>
              Назад
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmCancel}
              disabled={isProcessing}
              style={{
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                borderColor: 'var(--danger)',
              }}
            >
              {isProcessing ? 'Аннулирование...' : 'Аннулировать счёт'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
