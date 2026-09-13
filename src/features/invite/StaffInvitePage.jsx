import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { fetchInviteDetails, registerViaInviteCall } from './api.js';
import {
  Card,
  Button,
  PageHeader,
  Alert,
  Spinner,
} from '../../shared/ui/index.js';
import { ShieldCheck, BookOpen, AlertCircle, Wrench } from 'lucide-react';

const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';
const DEMO_MASTER_EMAIL = (import.meta.env.VITE_DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com').trim().toLowerCase();

export function StaffInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchInviteDetails(token);
        if (active) {
          setInviteData(data);
          if (data.invite?.email) {
            setEmail(data.invite.email);
          }
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load staff invite:', err);
          let msg = err.message || 'Не удалось загрузить приглашение';
          if (msg.includes('not-found')) {
            msg = 'Приглашение не найдено или ссылка недействительна.';
          } else if (msg.includes('failed-precondition')) {
            msg = 'Срок действия приглашения истёк или оно уже было использовано.';
          }
          setFetchError(msg);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) {
      load();
    }
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const targetEmail = (inviteData?.invite?.email || email).trim().toLowerCase();

    if (!targetEmail) {
      setSubmitError('Укажите адрес электронной почты');
      return;
    }

    const isMasterEmail = targetEmail === DEMO_MASTER_EMAIL;
    if (!isMasterEmail && !targetEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      setSubmitError(`Требуется корпоративная школьная почта @${ALLOWED_EMAIL_DOMAIN}`);
      return;
    }

    if (!fullName.trim()) {
      setSubmitError('Укажите ваше имя и фамилию (ФИО)');
      return;
    }

    if (password.length < 6) {
      setSubmitError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Пароли не совпадают');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Call Cloud Function to register via invite
      await registerViaInviteCall({
        inviteToken: token,
        email: targetEmail,
        password,
        fullName: fullName.trim(),
      });

      // 2. Automatically sign in
      await signInWithEmailAndPassword(auth, targetEmail, password);

      // 3. Redirect to role dashboard
      if (inviteData?.targetRole === 'coordinator') {
        navigate('/coordinator');
      } else if (inviteData?.targetRole === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration via invite failed:', err);
      let msg = err.message || 'Ошибка регистрации по приглашению.';
      if (msg.includes('already-exists')) {
        msg = 'Пользователь с таким email уже зарегистрирован в системе.';
      } else if (msg.includes('invalid-argument')) {
        msg = msg.replace(/^.*?invalid-argument:?\s*/i, '');
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spinner size="lg" label="Загрузка данных приглашения..." />
      </div>
    );
  }

  if (fetchError || !inviteData) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px' }}>
        <Card style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Недействительное приглашение
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {fetchError || 'Приглашение не найдено'}
          </p>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Перейти к авторизации
          </Button>
        </Card>
      </div>
    );
  }

  const role = inviteData.targetRole || inviteData.invite?.targetRole;
  const isCoordinator = role === 'coordinator';
  const isTechnician = role === 'technician';
  const hasFixedEmail = Boolean(inviteData.invite?.email);

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      <PageHeader
        title="Приглашение в команду ExtraHub"
        subtitle="Завершите регистрацию для доступа к платформе школы"
      />

      <Card style={{ padding: '28px 24px', marginTop: '16px' }}>
        {/* Role badge card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            marginBottom: '20px',
            border: '1px solid rgba(14, 124, 107, 0.2)',
          }}
        >
          {isCoordinator ? (
            <ShieldCheck size={24} />
          ) : isTechnician ? (
            <Wrench size={24} />
          ) : (
            <BookOpen size={24} />
          )}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Назначенная роль
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {isCoordinator
                ? 'Координатор школьных программ'
                : isTechnician
                  ? 'Техник по ремонту оборудования'
                  : 'Преподаватель кружка'}
            </div>
            {inviteData.activity && (
              <div style={{ fontSize: '13px', marginTop: '2px', opacity: 0.9 }}>
                Кружок: <b>{inviteData.activity.title}</b>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <Alert variant="danger" style={{ marginBottom: '20px' }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div>
            <label
              htmlFor="invite-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Корпоративная почта (@{ALLOWED_EMAIL_DOMAIN})
            </label>
            <input
              id="invite-email"
              type="email"
              required
              disabled={hasFixedEmail || submitting}
              value={hasFixedEmail ? inviteData.invite.email : email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`user@${ALLOWED_EMAIL_DOMAIN}`}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: hasFixedEmail ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {hasFixedEmail && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Почта привязана к приглашению и не может быть изменена.
              </span>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="invite-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Ваше ФИО <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="invite-name"
              type="text"
              required
              placeholder="Иванов Иван Иванович"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
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

          {/* Password */}
          <div>
            <label
              htmlFor="invite-password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Задайте пароль (от 6 символов) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="invite-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
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

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="invite-confirm-password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Повторите пароль <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="invite-confirm-password"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
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

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={submitting}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Spinner size="sm" /> Создание аккаунта...
              </span>
            ) : (
              'Создать аккаунт и принять приглашение'
            )}
          </Button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Войти
          </Link>
        </div>
      </Card>
    </div>
  );
}
