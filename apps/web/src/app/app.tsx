import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { setupTalentoEffects } from '../lib/talento-effects';
import '../styles/global.css';

export const App: React.FC = () => {
  useEffect(() => {
    return setupTalentoEffects();
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;
