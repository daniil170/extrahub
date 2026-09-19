import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Wrench,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '../../shared/utils/index.js';
import { Spinner } from '../../shared/ui/index.js';

const ITEMS_PER_PAGE = 20;

const ROLE_CONFIGS = {
  all: { label: 'Все роли', icon: Users },
  student: { label: 'Ученики', icon: GraduationCap, color: '#0284c7' },
  parent: { label: 'Родители', icon: Users, color: '#16a34a' },
  teacher: { label: 'Учителя', icon: BookOpen, color: '#9333ea' },
  coordinator: { label: 'Координаторы', icon: ClipboardList, color: '#ea580c' },
  technician: { label: 'Техники', icon: Wrench, color: '#0d9488' },
  admin: { label: 'Администраторы', icon: Shield, color: '#dc2626' },
};

export function AllUsersTab({ users = [], students = [], loading = false, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Map student info by ID
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [students]);

  // Counts per role
  const roleCounts = useMemo(() => {
    const counts = {
      all: users.length,
      student: 0,
      parent: 0,
      teacher: 0,
      coordinator: 0,
      technician: 0,
      admin: 0,
    };
    users.forEach((u) => {
      const r = u.role || 'student';
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (selectedRole !== 'all' && u.role !== selectedRole) return false;

      // Status filter
      if (statusFilter !== 'all' && (u.status || 'active') !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.fullName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const id = (u.id || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const className = String(u.className || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q) || phone.includes(q) || className.includes(q);
      }

      return true;
    });
  }, [users, selectedRole, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const getRoleBadge = (roleStr) => {
    const conf = ROLE_CONFIGS[roleStr] || { label: roleStr, color: '#64748b' };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: `${conf.color}15`,
          color: conf.color,
          border: `1px solid ${conf.color}30`,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        {conf.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Role Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {Object.entries(ROLE_CONFIGS).map(([key, conf]) => {
          const Icon = conf.icon;
          const isActive = selectedRole === key;
          const count = roleCounts[key] || 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSelectedRole(key);
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} />
              <span>{conf.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="monitoring-table-container">
        {/* Controls Bar */}
        <div className="monitoring-table-controls">
          <div className="monitoring-search-input">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Поиск по ФИО, email, телефону, классу..."
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
              <option value="active">Активные</option>
              <option value="inactive">Неактивные / Заблокированные</option>
            </select>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Обновить список пользователей"
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
                <th>Пользователь (ФИО / Email)</th>
                <th style={{ width: '130px' }}>Роль</th>
                <th>Сведения / Класс</th>
                <th style={{ width: '130px' }}>Дата регистрации</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Статус</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Тип</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                    <Spinner size="md" label="Загрузка списка пользователей..." />
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Пользователи по заданным критериям не найдены
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const studentInfo = studentMap[u.id];
                  const className = u.className || studentInfo?.className;
                  const shift = u.shift || studentInfo?.shift;
                  const isMaster = u.isDemoMaster || u.email === 'daniilivakin30@gmail.com';
                  const isDemo = u.isDemoAccount || (u.email && u.email.startsWith('demo.'));

                  return (
                    <tr key={u.id}>
                      {/* Name and Email */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {u.fullName || 'Без имени'}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Mail size={11} />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Phone size={10} />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td>{getRoleBadge(u.role)}</td>

                      {/* Extra Details */}
                      <td>
                        {u.role === 'student' ? (
                          <div style={{ fontSize: '12.5px' }}>
                            {className ? (
                              <span>
                                Класс: <b>{className}</b> {shift ? `(${shift} смена)` : ''}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Класс не указан</span>
                            )}
                          </div>
                        ) : u.role === 'parent' ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Родительский профиль
                          </div>
                        ) : u.role === 'teacher' ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Преподавательский состав
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{u.id.slice(0, 12)}...</span>
                          </div>
                        )}
                      </td>

                      {/* Created At */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {u.createdAt ? formatDate(u.createdAt, 'DD.MM.YYYY') : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            backgroundColor:
                              u.status === 'inactive'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color: u.status === 'inactive' ? '#dc2626' : '#059669',
                          }}
                        >
                          {u.status === 'inactive' ? 'Неактивен' : 'Активен'}
                        </span>
                      </td>

                      {/* Account Type */}
                      <td style={{ textAlign: 'center' }}>
                        {isMaster ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                              color: '#ca8a04',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                            }}
                          >
                            <Sparkles size={10} />
                            МАСТЕР
                          </span>
                        ) : isDemo ? (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            ДЕМО
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>РЕАЛЬНЫЙ</span>
                        )}
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
            Показано <b>{paginatedUsers.length}</b> из <b>{filteredUsers.length}</b> пользователей
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
    </div>
  );
}
