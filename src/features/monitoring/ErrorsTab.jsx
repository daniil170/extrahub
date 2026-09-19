import { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Copy,
  Check,
  Terminal,
  Server,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { Spinner } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

const ITEMS_PER_PAGE = 20;

export function ErrorsTab({ errors = [], loading = false, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // all | client | function
  const [statusFilter, setStatusFilter] = useState('all'); // all | unresolved | resolved
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedError, setSelectedError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Filter and sort errors
  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      // Source filter
      if (sourceFilter !== 'all' && err.source !== sourceFilter) return false;

      // Status filter
      if (statusFilter === 'unresolved' && err.resolved) return false;
      if (statusFilter === 'resolved' && !err.resolved) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msg = (err.message || err.errorMessage || '').toLowerCase();
        const route = (err.route || err.functionName || '').toLowerCase();
        const userId = (err.userId || err.userEmail || '').toLowerCase();
        const code = (err.errorCode || '').toLowerCase();
        return msg.includes(q) || route.includes(q) || userId.includes(q) || code.includes(q);
      }

      return true;
    });
  }, [errors, sourceFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredErrors.length / ITEMS_PER_PAGE) || 1;
  const paginatedErrors = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredErrors.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredErrors, currentPage]);

  const handleToggleResolved = async (err, e) => {
    if (e) e.stopPropagation();
    if (!err?.id) return;

    try {
      setUpdatingId(err.id);
      const newStatus = !err.resolved;
      const docRef = doc(db, COLLECTIONS.SYSTEM_ERRORS, err.id);
      await updateDoc(docRef, { resolved: newStatus });
      err.resolved = newStatus;
      if (selectedError?.id === err.id) {
        setSelectedError({ ...selectedError, resolved: newStatus });
      }
    } catch (updateErr) {
      console.error('Failed to update error status:', updateErr);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyStack = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
              placeholder="Поиск по тексту ошибки, функции, пути, email..."
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
            {/* Source Select */}
            <select
              className="monitoring-filter-select"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Все источники</option>
              <option value="client">Клиент (React / JS)</option>
              <option value="function">Cloud Functions</option>
            </select>

            {/* Status Select */}
            <select
              className="monitoring-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Все статусы</option>
              <option value="unresolved">Только нерешённые</option>
              <option value="resolved">Только решённые</option>
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
                <th style={{ width: '100px' }}>Источник</th>
                <th>Сообщение об ошибке</th>
                <th>Путь / Функция</th>
                <th style={{ width: '140px' }}>Пользователь</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Статус</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Детали</th>
              </tr>
            </thead>
            <tbody>
              {loading && errors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                    <Spinner size="md" label="Загрузка журнала ошибок..." />
                  </td>
                </tr>
              ) : paginatedErrors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Ошибок по заданным критериям не обнаружено
                  </td>
                </tr>
              ) : (
                paginatedErrors.map((err) => {
                  const isClient = err.source === 'client';
                  const displayMessage = err.message || err.errorMessage || 'Неизвестная ошибка';
                  const displayTarget = err.route || err.functionName || '—';
                  const isUpdating = updatingId === err.id;

                  return (
                    <tr
                      key={err.id}
                      onClick={() => setSelectedError(err)}
                      style={{ cursor: 'pointer', opacity: err.resolved ? 0.65 : 1 }}
                    >
                      {/* Timestamp */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDate(err.timestamp, 'DD.MM.YY HH:mm:ss')}
                      </td>

                      {/* Source */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: isClient ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                            color: isClient ? '#2563eb' : '#9333ea',
                            border: `1px solid ${isClient ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                          }}
                        >
                          {isClient ? <Globe size={11} /> : <Server size={11} />}
                          {isClient ? 'Клиент' : 'Функция'}
                        </span>
                      </td>

                      {/* Message */}
                      <td style={{ maxWidth: '340px' }}>
                        <div
                          style={{
                            fontWeight: err.resolved ? 400 : 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: err.resolved ? 'var(--text-secondary)' : 'var(--text-primary)',
                          }}
                          title={displayMessage}
                        >
                          {displayMessage}
                        </div>
                        {err.errorCode && err.errorCode !== 'internal' && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Код: {err.errorCode}
                          </div>
                        )}
                      </td>

                      {/* Route / Function */}
                      <td>
                        <span className="monitoring-code-snippet" title={displayTarget}>
                          {displayTarget}
                        </span>
                      </td>

                      {/* User Context */}
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {err.userEmail || err.userId || <span style={{ color: 'var(--text-muted)' }}>Гость</span>}
                        </div>
                        {err.userRole && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {err.userRole}
                          </span>
                        )}
                      </td>

                      {/* Status & Toggle */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={(e) => handleToggleResolved(err, e)}
                          title={err.resolved ? 'Отметить как нерешённую' : 'Отметить как решённую'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backgroundColor: err.resolved
                              ? 'var(--success-light, rgba(16, 185, 129, 0.15))'
                              : 'var(--danger-light, rgba(239, 68, 68, 0.15))',
                            color: err.resolved ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isUpdating ? (
                            <RefreshCw size={11} className="spin" />
                          ) : err.resolved ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertTriangle size={12} />
                          )}
                          <span>{err.resolved ? 'Решено' : 'Активна'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedError(err)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="monitoring-pagination">
          <div>
            Показано <b>{paginatedErrors.length}</b> из <b>{filteredErrors.length}</b> записей
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

      {/* Error Detail Modal */}
      {selectedError && (
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
          onClick={() => setSelectedError(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)',
              maxWidth: '720px',
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
                <Terminal size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Информация об ошибке [{selectedError.source}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedError(null)}
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
              {/* Message Banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.1))',
                  border: '1px solid var(--danger, #ef4444)',
                  color: 'var(--danger, #ef4444)',
                  fontWeight: 600,
                  fontSize: '14px',
                  wordBreak: 'break-word',
                }}
              >
                {selectedError.message || selectedError.errorMessage || 'Неизвестная ошибка'}
              </div>

              {/* Key Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  fontSize: '12.5px',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Время регистрации:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatDate(selectedError.timestamp, 'DD.MM.YYYY HH:mm:ss')}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Локация / Роут:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {selectedError.route || selectedError.functionName || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Пользователь:</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedError.userEmail || selectedError.userId || 'Не авторизован'}
                    {selectedError.userRole && ` (${selectedError.userRole})`}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Статус решения:</div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleResolved(selectedError, e)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: selectedError.resolved
                        ? 'var(--success-light, rgba(16, 185, 129, 0.15))'
                        : 'var(--danger-light, rgba(239, 68, 68, 0.15))',
                      color: selectedError.resolved ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                    }}
                  >
                    {selectedError.resolved ? '✓ Решено' : '⚠ Активна (нажмите для решения)'}
                  </button>
                </div>
              </div>

              {/* User Agent if client */}
              {selectedError.userAgent && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>User Agent:</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-color)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedError.userAgent}
                  </div>
                </div>
              )}

              {/* Function Input Payload if function error */}
              {selectedError.input && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Входные параметры функции (санитизированные):
                  </div>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      overflowX: 'auto',
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(selectedError.input, null, 2)}
                  </pre>
                </div>
              )}

              {/* Stack Trace Box */}
              {selectedError.stack && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Стектрейс ошибки:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyStack(selectedError.stack)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <div className="monitoring-stack-box">{selectedError.stack}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
