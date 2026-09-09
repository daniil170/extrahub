import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../../shared/ui/Layout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';

import { CatalogPage } from '../../features/catalog/CatalogPage.jsx';
import { LoginPage } from '../../features/auth/LoginPage.jsx';
import { ParentInvitePage } from '../../features/invite/ParentInvitePage.jsx';
import { AboutPage } from '../../features/about/AboutPage.jsx';
import {
  StudentDashboard,
  ParentDashboard,
  TeacherDashboard,
  CoordinatorDashboard,
} from '../../features/dashboard/index.js';
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
        path: 'invite/:token',
        element: <ParentInvitePage />,
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
        path: 'coordinator',
        element: (
          <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
            <CoordinatorDashboard />
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
