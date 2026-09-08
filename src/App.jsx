import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders.jsx';
import { router } from './app/routes/router.jsx';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
