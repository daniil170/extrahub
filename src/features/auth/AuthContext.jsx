import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { getDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUser } from '../../entities/user/model.js';
import { AuthContext } from './context.js';

const DEV_DEFAULT_USER = createUser({
  id: 'dev-user-1',
  fullName: 'Александр Иванов',
  role: 'student',
  email: 'student@extrahub.local',
  status: 'active',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('extrahub_dev_user');
    return saved ? JSON.parse(saved) : DEV_DEFAULT_USER;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to real Firebase auth changes, fallback gracefully to mock user in dev
    let isSubscribed = true;
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isSubscribed) return;
        if (firebaseUser) {
          try {
            const profile = await getDocument(COLLECTIONS.USERS, firebaseUser.uid);
            if (profile) {
              setUser(profile);
            }
          } catch (e) {
            console.warn('Firebase profile fetch skipped (using dev context):', e.message);
          }
        }
        setLoading(false);
      });
      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const switchDevRole = (newRole) => {
    const roleNames = {
      student: 'Александр Иванов (Ученик)',
      parent: 'Елена Иванова (Родитель)',
      teacher: 'Михаил Петров (Преподаватель)',
      coordinator: 'Анна Смирнова (Координатор)',
      admin: 'Администратор системы',
    };

    const updatedUser = createUser({
      ...user,
      role: newRole,
      fullName: roleNames[newRole] || `Пользователь (${newRole})`,
      email: `${newRole}@extrahub.local`,
    });
    setUser(updatedUser);
    localStorage.setItem('extrahub_dev_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('extrahub_dev_user');
  };

  const loginAsMock = (role = 'student') => {
    switchDevRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        switchDevRole,
        loginAsMock,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
