import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';

/**
 * Route component that redirects to the role-specific dashboard
 */
export function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'parent':
      return <Navigate to="/parent" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'coordinator':
      return <Navigate to="/coordinator" replace />;
    case 'student':
    default:
      return <Navigate to="/student" replace />;
  }
}
