import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  ExternalLink,
  Users,
  Sparkles,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { OverviewTab } from './OverviewTab.jsx';
import { ErrorsTab } from './ErrorsTab.jsx';
import { AuditLogTab } from './AuditLogTab.jsx';
import { QuickLinksTab } from './QuickLinksTab.jsx';
import { AllUsersTab } from './AllUsersTab.jsx';
import './SystemMonitoringPage.css';

export function SystemMonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | errors | audit | links | users

  // Raw dataset state
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [payments, setPayments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  // Load baseline collection data
  const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        usersSnap,
        studentsSnap,
        actsSnap,
        grpsSnap,
        enrsSnap,
        waitlistSnap,
        paymentsSnap,
      ] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.USERS)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.STUDENTS)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.ACTIVITIES)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.ENROLLMENTS)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.WAITLIST)).catch(() => ({ docs: [] })),
        getDocs(collection(db, COLLECTIONS.PAYMENTS)).catch(() => ({ docs: [] })),
      ]);

      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStudents(studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setActivities(actsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setGroups(grpsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEnrollments(enrsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setWaitlist(waitlistSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load monitoring base data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  // Real-time listener for systemErrors (latest 100 entries)
  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.SYSTEM_ERRORS),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setErrors(loaded);
      },
      (_err) => {
        // Fallback to simple getDocs if index or ordering issues occur
        getDocs(collection(db, COLLECTIONS.SYSTEM_ERRORS))
          .then((snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            setErrors(list);
          })
          .catch((e) => console.warn('Could not load systemErrors:', e.message));
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener for auditLog (latest 150 entries)
  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOG),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAuditLogs(loaded);
      },
      (_err) => {
        getDocs(collection(db, COLLECTIONS.AUDIT_LOG))
          .then((snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            setAuditLogs(list);
          })
          .catch((e) => console.warn('Could not load auditLog:', e.message));
      }
    );

    return () => unsubscribe();
  }, []);

  const unresolvedErrorCount = errors.filter((e) => !e.resolved).length;

  return (
    <div className="monitoring-container">
      {/* Page Header */}
      <div className="monitoring-header">
        <div>
          <div className="monitoring-title-row">
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Server size={24} color="var(--primary)" />
              Системный мониторинг & Оперпанель
            </h1>
            <div className="monitoring-master-badge">
              <Sparkles size={12} color="#eab308" />
              <span>Master Only</span>
            </div>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '6px 0 0 0',
            }}
          >
            Закрытый центр управления для владельца платформы ExtraHub (
            <code>isDemoMaster: true</code>). Полный аудит, телеметрия ошибок и прямой контроль данных.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={loadBaseData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Синхронизировать</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="monitoring-tabs-bar">
        <button
          type="button"
          className={`monitoring-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={15} />
          <span>Обзор</span>
        </button>

        <button
          type="button"
          className={`monitoring-tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <AlertTriangle size={15} />
          <span>Ошибки</span>
          {unresolvedErrorCount > 0 && (
            <span
              className="monitoring-tab-badge"
              style={{
                backgroundColor: activeTab === 'errors' ? '#ffffff' : 'var(--danger)',
                color: activeTab === 'errors' ? 'var(--danger)' : '#ffffff',
                fontWeight: 700,
              }}
            >
              {unresolvedErrorCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`monitoring-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <FileText size={15} />
          <span>Журнал действий</span>
          {auditLogs.length > 0 && (
            <span className="monitoring-tab-badge">{auditLogs.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`monitoring-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} />
          <span>Все пользователи</span>
          {users.length > 0 && <span className="monitoring-tab-badge">{users.length}</span>}
        </button>

        <button
          type="button"
          className={`monitoring-tab-btn ${activeTab === 'links' ? 'active' : ''}`}
          onClick={() => setActiveTab('links')}
        >
          <ExternalLink size={15} />
          <span>Firebase Console</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <OverviewTab
          users={users}
          activities={activities}
          groups={groups}
          enrollments={enrollments}
          waitlist={waitlist}
          payments={payments}
          errors={errors}
          loading={loading}
        />
      )}

      {activeTab === 'errors' && (
        <ErrorsTab errors={errors} loading={loading} onRefresh={loadBaseData} />
      )}

      {activeTab === 'audit' && (
        <AuditLogTab auditLogs={auditLogs} loading={loading} onRefresh={loadBaseData} />
      )}

      {activeTab === 'users' && (
        <AllUsersTab
          users={users}
          students={students}
          loading={loading}
          onRefresh={loadBaseData}
        />
      )}

      {activeTab === 'links' && <QuickLinksTab />}
    </div>
  );
}
