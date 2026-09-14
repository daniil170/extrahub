import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { getDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUser } from '../../entities/user/model.js';
import { AuthContext } from './context.js';

const AUTH_CACHE_KEY = 'extrahub_auth_cache';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isSubscribed) return;

      if (firebaseUser) {
        try {
          // Force refresh token to obtain latest custom claims (role)
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const claimRole = tokenResult.claims?.role;

          let profile = null;
          try {
            profile = await getDocument(COLLECTIONS.USERS, firebaseUser.uid);
          } catch (docErr) {
            console.warn('Could not read user profile from Firestore:', docErr.message);
          }

          const emailLower = (firebaseUser.email || '').toLowerCase().trim();
          let resolvedRole = claimRole || profile?.role || 'student';

          // Strictly guarantee explicit demo accounts always resolve to their designated role
          if (emailLower === 'demo.student@pifagorschool.kz') resolvedRole = 'student';
          else if (emailLower === 'demo.parent@pifagorschool.kz') resolvedRole = 'parent';
          else if (emailLower === 'demo.teacher@pifagorschool.kz') resolvedRole = 'teacher';
          else if (emailLower === 'demo.coordinator@pifagorschool.kz') resolvedRole = 'coordinator';
          else if (emailLower === 'demo.technician@pifagorschool.kz') resolvedRole = 'technician';
          else if (emailLower === 'demo.admin@pifagorschool.kz') resolvedRole = 'admin';

          const resolvedName =
            profile?.fullName ||
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Пользователь';

          const isDemoEmail = Boolean(
            emailLower.startsWith('demo.') && emailLower.endsWith('@pifagorschool.kz')
          );

          const isDemoMaster = Boolean(
            tokenResult.claims?.isDemoMaster ||
            profile?.isDemoMaster ||
            emailLower === 'daniilivakin30@gmail.com' ||
            isDemoEmail
          );
          const isSwitchedDemo = Boolean(tokenResult.claims?.isSwitchedDemo || isDemoEmail);

          const authenticatedUser = createUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: resolvedName,
            role: resolvedRole,
            status: profile?.status || 'active',
            className: profile?.className || '',
            phone: profile?.phone || '',
            isDemoMaster,
            isSwitchedDemo,
          });

          if (isSubscribed) {
            setUser(authenticatedUser);
            try {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(authenticatedUser));
            } catch (cacheErr) {
              console.warn('Failed to cache user profile in localStorage:', cacheErr);
            }
          }
        } catch (e) {
          console.error('Error resolving user auth session:', e);
          if (isSubscribed) {
            setUser(null);
            try {
              localStorage.removeItem(AUTH_CACHE_KEY);
            } catch {
              // ignore
            }
          }
        }
      } else {
        if (isSubscribed) {
          setUser(null);
          try {
            localStorage.removeItem(AUTH_CACHE_KEY);
          } catch {
            // ignore
          }
        }
      }

      if (isSubscribed) {
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    try {
      localStorage.removeItem(AUTH_CACHE_KEY);
    } catch {
      // ignore
    }
    localStorage.removeItem('extrahub_dev_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
