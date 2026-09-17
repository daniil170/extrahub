import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { auth } from '../../app/config/firebase.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useTheme } from '../../shared/hooks/index.js';
import { Button, Alert, Spinner } from '../../shared/ui/index.js';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';
import { schoolConfig } from '../../app/config/schoolConfig.js';
import './auth.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, offer quick jump to dashboard
  if (user) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <img
              src={isDark ? logoDarkImg : logoImg}
              alt="ExtraHub Logo"
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            />
          </div>
          <h3 className="auth-title">Вы уже вошли в систему</h3>
          <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
            Пользователь: <strong>{user.fullName || user.email}</strong>
            <br />
            Роль в системе:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
              {user.role}
            </span>
          </p>
          <Button
            variant="primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={() => navigate('/dashboard')}
          >
            Перейти в панель управления <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </Button>
        </div>
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
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Неверный адрес электронной почты или пароль';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password'
      ) {
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
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/catalog" className="auth-logo-link">
            <img
              src={isDark ? logoDarkImg : logoImg}
              alt="ExtraHub Logo"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
            <span className="auth-logo-title">ExtraHub</span>
          </Link>
          <h1 className="auth-title">Добро пожаловать</h1>
          <p className="auth-subtitle">
            Единая цифровая платформа внеурочной деятельности и школьных кружков
          </p>
        </div>

        {/* Two-tab Switcher */}
        <div className="auth-tabs-nav" role="tablist" aria-label="Авторизация и регистрация">
          <button type="button" className="auth-tab-btn active" role="tab" aria-selected="true">
            <LogIn size={15} /> Вход
          </button>
          <Link to="/register" className="auth-tab-btn" role="tab" aria-selected="false">
            Регистрация
          </Link>
        </div>

        {error && (
          <Alert variant="danger" style={{ marginBottom: '20px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email input with left icon */}
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-field-label">
              Электронная почта
            </label>
            <div className="auth-input-wrapper">
              <Mail size={17} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder={`user@${schoolConfig.domain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
            </div>
          </div>

          {/* Password input with left lock and right eye toggle */}
          <div className="auth-field">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                htmlFor="login-password"
                className="auth-field-label"
                style={{ marginBottom: 0 }}
              >
                Пароль
              </label>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="auth-input"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="auth-input-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Spinner size="sm" /> Вход в систему...
              </span>
            ) : (
              'Войти в аккаунт'
            )}
          </Button>
        </form>

        <div className="auth-footer-help">
          <p style={{ margin: '0 0 6px 0' }}>
            Ученик школы?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Зарегистрироваться в 2 шага
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Для преподавателей и сотрудников: вход по корпоративной почте или по персональной
            ссылке-приглашению.
          </p>
        </div>
      </div>
    </div>
  );
}
