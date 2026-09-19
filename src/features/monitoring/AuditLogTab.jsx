import { useState, useMemo } from 'react';
import {
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { Spinner } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

const ITEMS_PER_PAGE = 20;

const ACTION_LABELS = {
  'user.registered': { label: 'Регистрация пользователя', color: 'success' },
  'enrollment.created': { label: 'Создание записи (Hold)', color: 'info' },
  'enrollment.approved': { label: 'Подтверждение записи', color: 'success' },
  'enrollment.rejected': { label: 'Отклонение записи', color: 'danger' },
  'enrollment.cancelled': { label: 'Отмена записи', color: 'danger' },
  'enrollment.waitlisted': { label: 'Добавление в лист ожидания', color: 'warning' },
  'activity.created': { label: 'Создание кружка', color: 'primary' },
  'staff_invite.created': { label: 'Приглашение сотрудника', color: 'primary' },
  'exam.graded': { label: 'Оценка вступительного экзамена', color: 'warning' },
  'payment.marked_as_paid': { label: 'Отметка об оплате', color: 'success' },
  'payment.invoice_created': { label: 'Создание счёта', color: 'info' },
  'payment.group_invoices_created': { label: 'Массовое выставление счетов', color: 'info' },
  'demo.role_switched': { label: 'Смена демо-роли', color: 'warning' },
  'equipment_issue.created': { label: 'Создание заявки на ремонт', color: 'warning' },
  'equipment_issue.status_changed': { label: 'Изменение статуса заявки', color: 'info' },
  'equipment_issue.comment_added': { label: 'Комментарий к заявке', color: 'default' },
};

export function AuditLogTab({ auditLogs = [], loading = false, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Category filter
      if (categoryFilter !== 'all') {
        if (!log.action?.startsWith(categoryFilter)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const action = (log.action || '').toLowerCase();
        const actor = (log.actorName || log.actorId || '').toLowerCase();
        const target = (log.targetId || '').toLowerCase();
        const type = (log.targetType || '').toLowerCase();
        return action.includes(q) || actor.includes(q) || target.includes(q) || type.includes(q);
      }

      return true;
    });
  }, [auditLogs, categoryFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const getActionBadge = (actionStr) => {
    const info = ACTION_LABELS[actionStr];
    if (info) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 600,
            backgroundColor:
              info.color === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : info.color === 'danger'
                ? 'rgba(239, 68, 68, 0.12)'
                : info.color === 'warning'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(59, 130, 246, 0.12)',
            color:
              info.color === 'success'
                ? '#059669'
                : info.color === 'danger'
                ? '#dc2626'
                : info.color === 'warning'
                ? '#d97706'
                : '#2563eb',
            border: `1px solid ${
              info.color === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : info.color === 'danger'
                ? 'rgba(239, 68, 68, 0.3)'
                : info.color === 'warning'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(59, 130, 246, 0.3)'
            }`,
          }}
        >
          {info.label}
        </span>
      );
    }

    return (
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {actionStr}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Table Container */}
      <div className="monitoring-table-container">
        {/* Controls Bar */}
        <div className="monitoring-table-controls">
          <div className="monitoring-search-input">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Поиск по действию, пользователю, ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} color="var(--text-muted)" />
              </button>
            )}
          </div>

          <div className="monitoring-filters-row">
            {/* Category Filter */}
            <select
              className="monitoring-filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Все категории действий</option>
              <option value="user.">Пользователи (user.*)</option>
              <option value="enrollment.">Записи в секции (enrollment.*)</option>
              <option value="activity.">Кружки (activity.*)</option>
              <option value="staff_invite.">Приглашения (staff_invite.*)</option>
              <option value="exam.">Экзамены (exam.*)</option>
              <option value="payment.">Платежи и счета (payment.*)</option>
              <option value="equipment_issue.">Оборудование (equipment_issue.*)</option>
              <option value="demo.">Демо-роли (demo.*)</option>
            </select>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Обновить данные"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
                <span>Обновить</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="monitoring-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Время</th>
                <th>Тип действия</th>
                <th style={{ width: '180px' }}>Инициатор (Actor)</th>
                <th style={{ width: '100px' }}>Роль</th>
                <th>Целевой объект</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Детали</th>
              </tr>
            </thead>
            <tbody>
              {loading && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                    <Spinner size="md" label="Загрузка журнала действий..." />
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Activity size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Событий аудита по заданным критериям не найдено
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Timestamp */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(log.timestamp, 'DD.MM.YY HH:mm:ss')}
                    </td>

                    {/* Action */}
                    <td>{getActionBadge(log.action)}</td>

                    {/* Actor */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {log.actorName || log.actorId}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {log.actorId}
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.actorRole || 'user'}
                      </span>
                    </td>

                    {/* Target */}
                    <td>
                      <div style={{ fontSize: '12.5px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{log.targetType}:</span>{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {log.targetId || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Action button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} />
                        <span>Детали</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="monitoring-pagination">
          <div>
            Показано <b>{paginatedLogs.length}</b> из <b>{filteredLogs.length}</b> событий
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <span>
              Стр. <b>{currentPage}</b> из <b>{totalPages}</b>
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Событие аудита: {selectedLog.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '2px' }}>
                    Время события:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatDate(selectedLog.timestamp, 'DD.MM.YYYY HH:mm:ss')}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '2px' }}>
                    Инициатор:
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedLog.actorName || selectedLog.actorId}{' '}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ({selectedLog.actorRole})
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '2px' }}>
                    Целевая сущность:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {selectedLog.targetType}: {selectedLog.targetId || '—'}
                  </div>
                </div>
              </div>

              {/* Formatted Metadata Inspector */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Детали и метаданные (Metadata JSON):
                </div>
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    overflowX: 'auto',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
