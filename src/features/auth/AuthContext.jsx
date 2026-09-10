import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import { getDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUser } from '../../entities/user/model.js';
import { AuthContext } from './context.js';

const DEV_DEFAULT_USER = createUser({
  id: 'student-1',
  fullName: 'Алихан Сейткали',
  role: 'student',
  email: 'a.seytkali@extrahub.school',
  status: 'active',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('extrahub_dev_user');
    return saved ? JSON.parse(saved) : DEV_DEFAULT_USER;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In demo / prototype mode, fallback gracefully to mock user without spawning Identity Toolkit iframe
    const useLiveAuth = import.meta.env.VITE_ENABLE_FIREBASE_AUTH === 'true';
    if (!useLiveAuth) {
      setLoading(false);
      return;
    }

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
    const roleProfiles = {
      student: {
        id: 'student-1',
        fullName: 'Алихан Сейткали',
        email: 'a.seytkali@extrahub.school',
      },
      parent: {
        id: 'parent-1',
        fullName: 'Айдар Сейткалиев',
        email: 'a.seytkaliev@extrahub.school',
      },
      teacher: {
        id: 'teacher-1',
        fullName: 'Аскаров Данияр Серикович',
        email: 'd.askarov@extrahub.school',
      },
      coordinator: {
        id: 'coordinator-1',
        fullName: 'Гульнара Бауыржановна',
        email: 'g.bauyrzhanovna@extrahub.school',
      },
      admin: {
        id: 'admin-1',
        fullName: 'Администратор школы',
        email: 'admin@extrahub.school',
      },
      technician: {
        id: 'technician-1',
        fullName: 'Серикбаев Болат Маратович (Техник)',
        email: 'b.serikbaev@extrahub.school',
      },
    };

    const targetProfile = roleProfiles[newRole] || {
      id: `dev-${newRole}-1`,
      fullName: `Пользователь (${newRole})`,
      email: `${newRole}@extrahub.school`,
    };

    const updatedUser = createUser({
      ...user,
      id: targetProfile.id,
      role: newRole,
      fullName: targetProfile.fullName,
      email: targetProfile.email,
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
