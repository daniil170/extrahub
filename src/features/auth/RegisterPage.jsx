import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { registerStudentCall } from '../invite/api.js';
import {
  Card,
  Button,
  PageHeader,
  Alert,
  Spinner,
} from '../../shared/ui/index.js';

const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';

export function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedEmail = email.trim().toLowerCase();
  const isInvalidDomain =
    trimmedEmail.includes('@') && !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Укажите ваше имя и фамилию');
      return;
    }

    if (!trimmedEmail) {
      setError('Введите адрес школьной электронной почты');
      return;
    }

    if (!trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      setError(`Регистрация разрешена только со школьной почтой @${ALLOWED_EMAIL_DOMAIN}`);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);

      // 1. Call Cloud Function for student registration with server-side validation
      await registerStudentCall({
        fullName: fullName.trim(),
        email: trimmedEmail,
        className: className.trim(),
        password,
      });

      // 2. Sign in via Firebase Auth
      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // 3. Redirect to student cabinet
      navigate('/student');
    } catch (err) {
      console.error('Registration failed:', err);
      let msg = err.message || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.';
      if (msg.includes('already-exists') || msg.includes('auth/email-already-in-use')) {
        msg = 'Пользователь с таким email уже зарегистрирован. Попробуйте войти.';
      } else if (msg.includes('invalid-argument')) {
        msg = msg.replace(/^.*?invalid-argument:?\s*/i, '');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      <PageHeader
        title="Регистрация ученика"
        subtitle={`Создайте личный аккаунт с корпоративной почтой @${ALLOWED_EMAIL_DOMAIN}`}
      />

      <Card style={{ padding: '28px 24px', marginTop: '16px' }}>
        {error && (
          <Alert variant="danger" style={{ marginBottom: '20px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="reg-fullname"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Фамилия и Имя <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="reg-fullname"
              type="text"
              required
              placeholder="Алихан Сейткали"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
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

          {/* School Email */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="reg-email"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Школьная почта (@{ALLOWED_EMAIL_DOMAIN}) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
            </div>
            <input
              id="reg-email"
              type="email"
              required
              placeholder={`student@${ALLOWED_EMAIL_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isInvalidDomain ? 'var(--danger)' : 'var(--border-color)'}`,
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {isInvalidDomain && (
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--danger)' }}>
                ⚠️ Допустима только корпоративная школьная почта @{ALLOWED_EMAIL_DOMAIN}
              </p>
            )}
          </div>

          {/* Class / Grade */}
          <div>
            <label
              htmlFor="reg-class"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Класс
            </label>
            <input
              id="reg-class"
              type="text"
              placeholder="Например: 8А или 10Б"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={loading}
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
              htmlFor="reg-password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Пароль (не менее 6 символов) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
              htmlFor="reg-confirm-password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Подтверждение пароля <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
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
            disabled={loading || isInvalidDomain}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Spinner size="sm" /> Регистрация...
              </span>
            ) : (
              'Зарегистрироваться'
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
          Уже зарегистрированы?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Войти в систему
          </Link>
        </div>
      </Card>
    </div>
  );
}
