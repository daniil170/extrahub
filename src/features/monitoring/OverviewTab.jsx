import { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  UserCheck,
  CreditCard,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatMoney } from '../../shared/utils/index.js';

export function OverviewTab({
  users = [],
  activities = [],
  groups = [],
  enrollments = [],
  waitlist = [],
  payments = [],
  errors = [],
  loading: _loading = false,
}) {
  const [referenceTimestamp] = useState(() => Date.now());

  // Metrics calculation
  const stats = useMemo(() => {
    // Users by role
    const usersByRole = {
      student: 0,
      parent: 0,
      teacher: 0,
      coordinator: 0,
      technician: 0,
      admin: 0,
    };
    users.forEach((u) => {
      const r = u.role || 'student';
      if (usersByRole[r] !== undefined) usersByRole[r]++;
      else usersByRole.student++;
    });

    // Enrollments by status
    const enrollmentsByStatus = {
      active: 0,
      pending: 0,
      cancelled: 0,
    };
    enrollments.forEach((e) => {
      if (e.status === 'active') enrollmentsByStatus.active++;
      else if (e.status === 'pending_parent_approval') enrollmentsByStatus.pending++;
      else if (e.status === 'cancelled' || e.status === 'cancelled_by_timeout') enrollmentsByStatus.cancelled++;
    });

    // Payments summary
    let totalInvoiced = 0;
    let totalPaid = 0;
    let paidCount = 0;
    payments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      totalInvoiced += amount;
      if (p.status === 'paid') {
        totalPaid += amount;
        paidCount++;
      }
    });

    // Errors in last 24h and 7d
    const oneDayAgo = referenceTimestamp - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = referenceTimestamp - 7 * 24 * 60 * 60 * 1000;

    let errors24h = 0;
    let errors7d = 0;
    let unresolvedErrors = 0;

    errors.forEach((err) => {
      const errTime = err.timestamp ? new Date(err.timestamp).getTime() : 0;
      if (errTime >= oneDayAgo) errors24h++;
      if (errTime >= sevenDaysAgo) errors7d++;
      if (!err.resolved) unresolvedErrors++;
    });

    return {
      totalUsers: users.length,
      usersByRole,
      totalActivities: activities.length,
      totalGroups: groups.length,
      totalEnrollments: enrollments.length,
      enrollmentsByStatus,
      waitlistCount: waitlist.length,
      totalInvoiced,
      totalPaid,
      invoicesCount: payments.length,
      paidCount,
      totalErrors: errors.length,
      errors24h,
      errors7d,
      unresolvedErrors,
    };
  }, [users, activities, groups, enrollments, waitlist, payments, errors, referenceTimestamp]);

  // 30-day user registrations trend
  const chartData = useMemo(() => {
    const days = 30;
    const dayMap = {};
    const baseDate = new Date(referenceTimestamp);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const label = `${d.getDate()} ${d.toLocaleString('ru-RU', { month: 'short' })}`;
      dayMap[dateKey] = { date: dateKey, label, count: 0, students: 0, parents: 0, staff: 0 };
    }

    users.forEach((u) => {
      if (!u.createdAt) return;
      const dateKey = u.createdAt.split('T')[0];
      if (dayMap[dateKey]) {
        dayMap[dateKey].count++;
        if (u.role === 'student') dayMap[dateKey].students++;
        else if (u.role === 'parent') dayMap[dateKey].parents++;
        else dayMap[dateKey].staff++;
      }
    });

    return Object.values(dayMap);
  }, [users, referenceTimestamp]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards Grid */}
      <div className="monitoring-grid-kpis">
        {/* Total Users */}
        <div className="monitoring-kpi-card">
          <div className="monitoring-kpi-label">
            <span>Пользователи</span>
            <Users size={16} color="var(--primary)" />
          </div>
          <div className="monitoring-kpi-value">{stats.totalUsers}</div>
          <div className="monitoring-kpi-sub">
            <span>Ученики: <b>{stats.usersByRole.student}</b></span>
            <span>•</span>
            <span>Родители: <b>{stats.usersByRole.parent}</b></span>
            <span>•</span>
            <span>Учителя: <b>{stats.usersByRole.teacher}</b></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Координаторы: {stats.usersByRole.coordinator} | Техники: {stats.usersByRole.technician} | Админы: {stats.usersByRole.admin}
          </div>
        </div>

        {/* Total Activities & Groups */}
        <div className="monitoring-kpi-card">
          <div className="monitoring-kpi-label">
            <span>Кружки и группы</span>
            <BookOpen size={16} color="#10b981" />
          </div>
          <div className="monitoring-kpi-value">
            {stats.totalActivities}{' '}
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)' }}>
              ({stats.totalGroups} групп)
            </span>
          </div>
          <div className="monitoring-kpi-sub">
            <span>Активных программ обучения</span>
          </div>
        </div>

        {/* Enrollments Status */}
        <div className="monitoring-kpi-card">
          <div className="monitoring-kpi-label">
            <span>Записи в секции</span>
            <UserCheck size={16} color="#8b5cf6" />
          </div>
          <div className="monitoring-kpi-value">{stats.totalEnrollments}</div>
          <div className="monitoring-kpi-sub">
            <span style={{ color: 'var(--success)' }}>Активны: <b>{stats.enrollmentsByStatus.active}</b></span>
            <span>•</span>
            <span style={{ color: 'var(--warning)' }}>Ожидают: <b>{stats.enrollmentsByStatus.pending}</b></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Лист ожидания: {stats.waitlistCount} | Отменено: {stats.enrollmentsByStatus.cancelled}
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="monitoring-kpi-card">
          <div className="monitoring-kpi-label">
            <span>Финансы и счета</span>
            <CreditCard size={16} color="#f59e0b" />
          </div>
          <div className="monitoring-kpi-value">{formatMoney(stats.totalPaid)}</div>
          <div className="monitoring-kpi-sub">
            <span>Выставлено: <b>{formatMoney(stats.totalInvoiced)}</b></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Оплачено счетов: {stats.paidCount} из {stats.invoicesCount}
          </div>
        </div>

        {/* Error KPIs */}
        <div className="monitoring-kpi-card" style={{ borderColor: stats.unresolvedErrors > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
          <div className="monitoring-kpi-label">
            <span>Телеметрия ошибок</span>
            <AlertTriangle size={16} color={stats.unresolvedErrors > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
          </div>
          <div
            className="monitoring-kpi-value"
            style={{ color: stats.unresolvedErrors > 0 ? 'var(--danger)' : 'var(--text-primary)' }}
          >
            {stats.unresolvedErrors}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
              нерешённых
            </span>
          </div>
          <div className="monitoring-kpi-sub">
            <span>За 24ч: <b>{stats.errors24h}</b></span>
            <span>•</span>
            <span>За 7 дней: <b>{stats.errors7d}</b></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Всего записей в журнале: {stats.totalErrors}
          </div>
        </div>
      </div>

      {/* Registrations Chart Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                margin: '0 0 4px 0',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <TrendingUp size={16} color="var(--primary)" />
              Динамика регистраций новых пользователей (за 30 дней)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Количество созданных учётных записей в разрезе по календарным дням
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
              <XAxis
                dataKey="label"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                formatter={(val, name) => [
                  `${val} чел.`,
                  name === 'count' ? 'Всего' : name === 'students' ? 'Ученики' : name === 'parents' ? 'Родители' : 'Сотрудники',
                ]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRegistrations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
