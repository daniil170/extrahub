import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders.jsx';
import { router } from './app/routes/router.jsx';
import { schoolConfig } from './app/config/schoolConfig.js';
import { ErrorBoundary } from './shared/ui/ErrorBoundary.jsx';
import { setupGlobalErrorLogging } from './shared/services/errorLogging.js';

export default function App() {
  useEffect(() => {
    setupGlobalErrorLogging();
    schoolConfig.applyBrandTheme();
    if (typeof document !== 'undefined') {
      document.title = schoolConfig.getPageTitle();
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}

