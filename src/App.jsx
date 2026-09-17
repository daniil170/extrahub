import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders.jsx';
import { router } from './app/routes/router.jsx';
import { schoolConfig } from './app/config/schoolConfig.js';

export default function App() {
  useEffect(() => {
    schoolConfig.applyBrandTheme();
    if (typeof document !== 'undefined') {
      document.title = schoolConfig.getPageTitle();
    }
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
