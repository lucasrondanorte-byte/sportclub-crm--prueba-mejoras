
import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Lazy load the Dashboard component
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

const FullScreenLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-bg">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
  </div>
);

const App: React.FC = () => {
  const { user } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  const renderAuth = () => {
    switch (authScreen) {
        case 'signup':
            return <Signup onSwitchToLogin={() => setAuthScreen('login')} />;
        case 'login':
        default:
            return <Login onSwitchToSignup={() => setAuthScreen('signup')} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      {user ? (
        <Suspense fallback={<FullScreenLoader />}>
          <Dashboard />
        </Suspense>
      ) : renderAuth()}
    </div>
  );
};

export default App;