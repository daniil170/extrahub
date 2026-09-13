import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  Card,
  Button,
  PageHeader,
  Alert,
  Spinner,
} from '../../shared/ui/index.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, offer quick jump to dashboard
  if (user) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: '32px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Вы уже вошли как {user.fullName}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Роль в системе: <b>{user.role}</b> ({user.email})
          </p>
          <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>
            Перейти в панель управления
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Введите email и пароль');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // Wait momentarily for onAuthStateChanged to sync, then navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Неверный адрес электронной почты или пароль';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Неверный email или пароль. Пожалуйста, проверьте введённые данные.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Слишком много неудачных попыток. Пожалуйста, попробуйте позже.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '40px auto', padding: '0 16px' }}>
      <PageHeader
        title="Вход в ExtraHub"
        subtitle="Единая платформа внеурочной деятельности и кружков"
      />

      <Card style={{ padding: '28px 24px', marginTop: '16px' }}>
        {error && (
          <Alert variant="danger" style={{ marginBottom: '20px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Электронная почта
            </label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="user@pifagorschool.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Пароль
              </label>
            </div>
            <input
              id="login-password"
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

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginTop: '4px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Spinner size="sm" /> Вход в систему...
              </span>
            ) : (
              'Войти'
            )}
          </Button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          <div>
            Ученик школы?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Зарегистрироваться
            </Link>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Для сотрудников и преподавателей: вход по корпоративной почте или по персональной ссылке-приглашению.
          </p>
        </div>
      </Card>
    </div>
  );
}
