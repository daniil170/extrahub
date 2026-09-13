import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { createStaffInviteCall } from '../invite/api.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
} from '../../shared/ui/index.js';
import {
  Copy,
  Check,
  UserPlus,
  Shield,
  BookOpen,
} from 'lucide-react';

const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';

export function StaffInvitesTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Forms state
  const [inviteRole, setInviteRole] = useState(isAdmin ? 'coordinator' : 'teacher');
  const [email, setEmail] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [activities, setActivities] = useState([]);

  // Async state
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [lastCreatedUrl, setLastCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  // Invites list
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load activities for teacher invitation dropdown
  useEffect(() => {
    async function loadActivities() {
      try {
        setLoadingActivities(true);
        const snap = await getDocs(collection(db, 'activities'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setActivities(list);
        if (list.length > 0) {
          setSelectedActivityId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load activities for invite:', err);
      } finally {
        setLoadingActivities(false);
      }
    }
    loadActivities();
  }, []);

  // Load staff invites
  const loadInvites = useCallback(async () => {
    try {
      setLoadingInvites(true);
      const q = query(collection(db, 'invites'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      if (err.code !== 'permission-denied') {
        console.error('Failed to load staff invites:', err);
      }
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLastCreatedUrl(null);
    setCopied(false);

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail && !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      setFormError(`Почта сотрудника должна принадлежать домену @${ALLOWED_EMAIL_DOMAIN}`);
      return;
    }

    if (inviteRole === 'teacher' && !selectedActivityId) {
      setFormError('Выберите кружок для привязки преподавателя');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createStaffInviteCall({
        targetRole: inviteRole,
        email: trimmedEmail || null,
        activityId: inviteRole === 'teacher' ? selectedActivityId : null,
      });

      const fullUrl = `${window.location.origin}/staff-invite/${res.token}`;
      setLastCreatedUrl(fullUrl);
      setEmail('');
      loadInvites();
    } catch (err) {
      console.error('Create staff invite error:', err);
      setFormError(err.message || 'Не удалось создать приглашение');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!lastCreatedUrl) return;
    navigator.clipboard.writeText(lastCreatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Creation card */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UserPlus size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>
            Создать приглашение для сотрудника
          </h3>
        </div>

        {formError && (
          <Alert variant="danger" style={{ marginBottom: '16px' }}>
            {formError}
          </Alert>
        )}

        <form onSubmit={handleCreateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Role selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Роль сотрудника <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {isAdmin && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${inviteRole === 'coordinator' ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: inviteRole === 'coordinator' ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: inviteRole === 'coordinator' ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="coordinator"
                    checked={inviteRole === 'coordinator'}
                    onChange={() => setInviteRole('coordinator')}
                  />
                  <Shield size={16} /> Координатор школы
                </label>
              )}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${inviteRole === 'teacher' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: inviteRole === 'teacher' ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: inviteRole === 'teacher' ? 600 : 400,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={inviteRole === 'teacher'}
                  onChange={() => setInviteRole('teacher')}
                />
                <BookOpen size={16} /> Преподаватель кружка
              </label>
            </div>
          </div>

          {/* Email input (optional or required domain) */}
          <div>
            <label
              htmlFor="invite-target-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Email сотрудника (опционально, @{ALLOWED_EMAIL_DOMAIN})
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="invite-target-email"
                type="email"
                placeholder={`prepod@${ALLOWED_EMAIL_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Если email не указан, сотрудник введёт свой рабочий email при активации инвайта.
            </p>
          </div>

          {/* Activity dropdown (if teacher) */}
          {inviteRole === 'teacher' && (
            <div>
              <label
                htmlFor="invite-activity"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Назначаемый кружок <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              {loadingActivities ? (
                <Spinner size="sm" label="Загрузка списка кружков..." />
              ) : (
                <select
                  id="invite-activity"
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.title} ({act.category || 'Внеурочная деятельность'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ minWidth: '220px' }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Spinner size="sm" /> Генерация ссылки...
                </span>
              ) : (
                'Сгенерировать приглашение'
              )}
            </Button>
          </div>
        </form>

        {/* Successfully generated link banner */}
        {lastCreatedUrl && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Check size={18} color="var(--primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                Ссылка-приглашение готова к отправке:
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                backgroundColor: 'var(--bg-surface)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <input
                type="text"
                readOnly
                value={lastCreatedUrl}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <Button size="sm" variant={copied ? 'primary' : 'outline'} onClick={handleCopyLink}>
                {copied ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Скопировано!
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Copy size={14} /> Скопировать
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invites list */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px' }}>
          История созданных приглашений ({invites.length})
        </h3>

        {loadingInvites ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Spinner size="md" label="Загрузка списка приглашений..." />
          </div>
        ) : invites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
            Пока не создано ни одного приглашения сотрудников.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Роль</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Статус</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Создан</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => {
                  const isAccepted = inv.status === 'accepted';
                  const inviteUrl = `${window.location.origin}/staff-invite/${inv.token}`;
                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <Badge variant={inv.targetRole === 'coordinator' ? 'primary' : 'warning'}>
                          {inv.targetRole === 'coordinator' ? 'Координатор' : 'Преподаватель'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {inv.email || <span style={{ color: 'var(--text-muted)' }}>Любой адрес школы</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Badge variant={isAccepted ? 'success' : 'outline'}>
                          {isAccepted ? 'Принят' : 'Ожидает'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {!isAccepted && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(inviteUrl);
                              alert('Ссылка на инвайт скопирована в буфер обмена!');
                            }}
                            title="Скопировать ссылку"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12.5px',
                              fontWeight: 500,
                            }}
                          >
                            <Copy size={13} /> Скопировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
