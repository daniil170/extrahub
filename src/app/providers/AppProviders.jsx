import { AuthProvider } from '../../features/auth/AuthContext.jsx';

/**
 * Root providers wrapper
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 */
export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
