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
import { PrivacyPolicyPage } from '../../features/legal/PrivacyPolicyPage.jsx';
import { TermsOfUsePage } from '../../features/legal/TermsOfUsePage.jsx';
import {
  StudentDashboard,
  ParentDashboard,
  TeacherDashboard,
  CoordinatorDashboard,
} from '../../features/dashboard/index.js';
import { ShopPage, StudentProfilePage } from '../../features/shop/index.js';
import {
  TeacherEquipmentPage,
  TechnicianDashboard,
  EquipmentMaintenancePausedPage,
} from '../../features/equipment/index.js';
import { SystemMonitoringPage } from '../../features/monitoring/index.js';
import { schoolConfig } from '../config/schoolConfig.js';
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
        path: 'privacy-policy',
        element: <PrivacyPolicyPage />,
      },
      {
        path: 'terms-of-use',
        element: <TermsOfUsePage />,
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
        path: 'student/shop',
        element: (
          <ProtectedRoute allowedRoles={['student', 'admin', 'parent', 'teacher', 'coordinator']}>
            <ShopPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/profile',
        element: (
          <ProtectedRoute allowedRoles={['student', 'admin', 'parent', 'teacher', 'coordinator']}>
            <StudentProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/:studentId',
        element: (
          <ProtectedRoute allowedRoles={['student', 'admin', 'parent', 'teacher', 'coordinator']}>
            <StudentProfilePage />
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
            {schoolConfig.equipmentModuleEnabled ? (
              <TeacherEquipmentPage />
            ) : (
              <EquipmentMaintenancePausedPage />
            )}
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
            {schoolConfig.equipmentModuleEnabled ? (
              <TechnicianDashboard />
            ) : (
              <EquipmentMaintenancePausedPage />
            )}
          </ProtectedRoute>
        ),
      },
      {
        path: 'system-monitor',
        element: (
          <ProtectedRoute requireDemoMaster>
            <SystemMonitoringPage />
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
