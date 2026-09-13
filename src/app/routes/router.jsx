import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../../shared/ui/Layout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';

import { CatalogPage } from '../../features/catalog/CatalogPage.jsx';
import { LoginPage } from '../../features/auth/LoginPage.jsx';
import { RegisterPage } from '../../features/auth/RegisterPage.jsx';
import { ParentInvitePage } from '../../features/invite/ParentInvitePage.jsx';
import { StaffInvitePage } from '../../features/invite/StaffInvitePage.jsx';
import { AboutPage } from '../../features/about/AboutPage.jsx';
import {
  StudentDashboard,
  ParentDashboard,
  TeacherDashboard,
  CoordinatorDashboard,
} from '../../features/dashboard/index.js';
import { TeacherEquipmentPage, TechnicianDashboard } from '../../features/equipment/index.js';
import { DashboardRedirect } from './DashboardRedirect.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/catalog" replace />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardRedirect />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'invite/:token',
        element: <ParentInvitePage />,
      },
      {
        path: 'staff-invite/:token',
        element: <StaffInvitePage />,
      },
      {
        path: 'student',
        element: (
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'parent',
        element: (
          <ProtectedRoute allowedRoles={['parent', 'admin']}>
            <ParentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/equipment',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherEquipmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'coordinator',
        element: (
          <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
            <CoordinatorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'technician',
        element: (
          <ProtectedRoute allowedRoles={['technician', 'admin']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
