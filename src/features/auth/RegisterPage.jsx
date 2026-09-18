import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import {
  User,
  GraduationCap,
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { auth, db } from '../../app/config/firebase.js';
import { registerStudentCall } from '../invite/api.js';
import { useTheme } from '../../shared/hooks/index.js';
import { Button, Alert, Spinner } from '../../shared/ui/index.js';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.svg';
import pifagorLogo from '../../assets/pifagor-logo.png';
import { schoolConfig } from '../../app/config/schoolConfig.js';
import './auth.css';

const ALLOWED_EMAIL_DOMAIN = schoolConfig.allowedEmailDomain;
const DEMO_MASTER_EMAIL = (import.meta.env.VITE_DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com')
  .trim()
  .toLowerCase();

export function RegisterPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Multi-step form state: 1 (Personal Info) or 2 (Account & Password)
  const [step, setStep] = useState(1);
  const [transitionDirection, setTransitionDirection] = useState('forward');

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('7');
  const [shift, setShift] = useState(schoolConfig.shifts[0]?.id || 1);

  // Step 2: Account & Security
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedEmail = email.trim().toLowerCase();
  const isMasterEmail = trimmedEmail === DEMO_MASTER_EMAIL;
  const isInvalidDomain =
    trimmedEmail.includes('@') &&
    !isMasterEmail &&
    !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);

  // Validate step 1 before proceeding to step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Пожалуйста, укажите ваши фамилию и имя');
      return;
    }

    if (fullName.trim().split(/\s+/).length < 2) {
      setError('Пожалуйста, введите полное имя и фамилию (например, Алихан Сейткали)');
      return;
    }

    setTransitionDirection('forward');
    setStep(2);
  };

  const handlePrevStep = () => {
    setError(null);
    setTransitionDirection('backward');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError(
        'Для завершения регистрации необходимо принять Условия использования и Политику конфиденциальности'
      );
      return;
    }

    if (!trimmedEmail) {
      setError('Введите адрес школьной электронной почты');
      return;
    }

    if (!isMasterEmail && !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
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

      const parsedClass = Number(className) || 7;
      const parsedShift = Number(shift) === 2 ? 2 : 1;

      // 1. Call Cloud Function for student registration with server-side validation
      await registerStudentCall({
        fullName: fullName.trim(),
        email: trimmedEmail,
        className: parsedClass,
        shift: parsedShift,
        password,
      });

      // 2. Sign in via Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // Force refresh token so newly assigned 'student' custom claims are immediately loaded
      try {
        await userCred.user.getIdToken(true);
      } catch (tokenErr) {
        console.warn('Token refresh error:', tokenErr);
      }

      // 3. Ensure profile has className and shift in users and students
      try {
        await updateDoc(doc(db, 'users', userCred.user.uid), {
          className: parsedClass,
          shift: parsedShift,
        });
        await setDoc(
          doc(db, 'students', userCred.user.uid),
          {
            id: userCred.user.uid,
            fullName: fullName.trim(),
            email: trimmedEmail,
            className: parsedClass,
            shift: parsedShift,
          },
          { merge: true }
        );
      } catch (syncErr) {
        console.warn('Profile sync fallback:', syncErr);
      }

      // 4. Redirect to student cabinet
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
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/catalog" className="auth-logo-link">
            <div className="auth-brand-pair">
              <div className="auth-brand-item">
                <img
                  src={isDark ? logoDarkImg : logoImg}
                  alt="ExtraHub Logo"
                  className="auth-brand-logo"
                />
                <span className="auth-logo-title">ExtraHub</span>
              </div>
              <span className="auth-brand-separator">×</span>
              <div className="auth-brand-item">
                <img
                  src={pifagorLogo}
                  alt={schoolConfig.name}
                  className="auth-brand-logo school-logo"
                />
                <span className="auth-school-title">{schoolConfig.name}</span>
              </div>
            </div>
          </Link>
          <h1 className="auth-title">Регистрация ученика</h1>
          <p className="auth-subtitle">
            Создайте профиль учащегося с корпоративной почтой школы
          </p>
        </div>

        {/* Two-tab Switcher (Вход / Регистрация) */}
        <div className="auth-tabs-nav" role="tablist" aria-label="Авторизация и регистрация">
          <Link to="/login" className="auth-tab-btn" role="tab" aria-selected="false">
            Вход
          </Link>
          <button type="button" className="auth-tab-btn active" role="tab" aria-selected="true">
            <UserPlus size={15} /> Регистрация
          </button>
        </div>

        {/* Multi-Step Progress Stepper */}
        <div className="auth-stepper">
          <div className="auth-stepper-header">
            <span className="auth-stepper-label">
              <span className="auth-stepper-step-num">0{step}</span>
              {step === 1 ? 'Данные учащегося' : 'Учетная запись и доступ'}
            </span>
            <span className="auth-stepper-count">Шаг {step} из 2</span>
          </div>
          <div className="auth-progress-track">
            <div className="auth-progress-bar" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </div>

        {error && (
          <Alert variant="danger" style={{ marginBottom: '20px' }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <form
            onSubmit={handleNextStep}
            className={`auth-step-pane ${transitionDirection === 'backward' ? 'auth-step-pane-back' : ''}`}
            noValidate
          >
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="reg-fullname" className="auth-field-label">
                Фамилия и Имя учащегося <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div className="auth-input-wrapper">
                <User size={17} className="auth-input-icon" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Алихан Сейткали"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input"
                  autoFocus
                />
              </div>
            </div>

            {/* Class & Shift in 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="auth-field">
                <label htmlFor="reg-class" className="auth-field-label">
                  Класс (5–11) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <GraduationCap size={17} className="auth-input-icon" />
                  <select
                    id="reg-class"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="auth-select"
                  >
                    {[5, 6, 7, 8, 9, 10, 11].map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} класс
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-shift" className="auth-field-label">
                  Смена <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <Clock size={17} className="auth-input-icon" />
                  <select
                    id="reg-shift"
                    required
                    value={shift}
                    onChange={(e) => setShift(Number(e.target.value))}
                    className="auth-select"
                  >
                    {schoolConfig.shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <Button
                type="submit"
                variant="primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                Далее к учетной записи <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Account, Passwords & Legal Consent */}
        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            className={`auth-step-pane ${transitionDirection === 'backward' ? 'auth-step-pane-back' : ''}`}
            noValidate
          >
            {/* School Email */}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-field-label">
                Школьная почта (@{ALLOWED_EMAIL_DOMAIN}){' '}
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder={`student@${ALLOWED_EMAIL_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`auth-input ${isInvalidDomain ? 'has-error' : ''}`}
                  autoFocus
                />
              </div>
              {isInvalidDomain && (
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={14} /> Допустима только школьная почта @{ALLOWED_EMAIL_DOMAIN}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-field-label">
                Пароль (от 6 символов) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="reg-confirm-password" className="auth-field-label">
                Подтверждение пароля <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="auth-input-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Mandatory Terms & Privacy Policy Agreement Checkbox */}
            <div className="auth-agreement-box">
              <label className="auth-agreement-label">
                <input
                  type="checkbox"
                  id="reg-terms-checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="auth-agreement-checkbox"
                />
                <span>
                  Я принимаю{' '}
                  <Link
                    to="/terms-of-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth-legal-link"
                  >
                    Условия использования
                  </Link>{' '}
                  и{' '}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth-legal-link"
                  >
                    Политику конфиденциальности
                  </Link>
                </span>
              </label>
            </div>

            {/* Buttons Row: Back & Submit */}
            <div className="auth-actions-row">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={loading}
                style={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={16} /> Назад
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || isInvalidDomain || !termsAccepted}
                style={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
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
                    <Spinner size="sm" /> Регистрация...
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={16} /> Зарегистрироваться
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="auth-footer-help">
          <p style={{ margin: 0 }}>
            Уже зарегистрированы?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Войти в систему
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
