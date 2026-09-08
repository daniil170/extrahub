import { useContext } from 'react';
import { AuthContext } from '../../features/auth/context.js';

/**
 * Hook to access current authentication and user context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
