import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { Spinner, Card } from '../../shared/ui/index.js';

/**
 * Route guard for authenticated users and specific roles
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {string[]} [props.allowedRoles]
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="lg" label="Проверка прав доступа..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <Card style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Доступ ограничен</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Эта страница предназначена для роли: <b>{allowedRoles.join(', ')}</b>. Ваша текущая
            роль: <b>{user.role}</b>.
          </p>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Пожалуйста, выполните вход с учётной записью, обладающей необходимыми правами доступа.
          </p>
        </Card>
      </div>
    );
  }

  return children;
}
