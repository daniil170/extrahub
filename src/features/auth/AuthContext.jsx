import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { getDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUser } from '../../entities/user/model.js';
import { AuthContext } from './context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

          const resolvedRole = claimRole || profile?.role || 'student';
          const resolvedName =
            profile?.fullName ||
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Пользователь';

          const authenticatedUser = createUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: resolvedName,
            role: resolvedRole,
            status: profile?.status || 'active',
            className: profile?.className || '',
            phone: profile?.phone || '',
          });

          if (isSubscribed) {
            setUser(authenticatedUser);
          }
        } catch (e) {
          console.error('Error resolving user auth session:', e);
          if (isSubscribed) {
            setUser(null);
          }
        }
      } else {
        if (isSubscribed) {
          setUser(null);
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
