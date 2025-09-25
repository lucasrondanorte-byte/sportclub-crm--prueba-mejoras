
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { User, Role, Branch } from './types';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import { api } from './services/api';

// Lazy load the Dashboard component
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

const FullScreenLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-bg">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  const login = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await api.login(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      // PRODUCTION NOTE: Storing user objects or tokens in localStorage is convenient
      // for demos but is vulnerable to XSS attacks. In a real-world application,
      // use secure, server-managed session tokens (e.g., in HttpOnly cookies).
      localStorage.setItem('sportclub-crm-user', JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, branch: Branch): Promise<{success: boolean, message: string}> => {
      try {
          await api.addUser({ name, email, password, branch });
          // If addUser resolves, it means success.
          return { success: true, message: "Registro exitoso. Ahora puedes iniciar sesión." };
      } catch (error: any) {
          // The error message will come from the rejected promise in the API.
          return { success: false, message: error.message || "Ocurrió un error durante el registro." };
      }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sportclub-crm-user');
  };

  // Attempt to load user from localStorage on initial load
  React.useEffect(() => {
    const storedUser = localStorage.getItem('sportclub-crm-user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.role) {
             setUser(parsedUser);
        }
      } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem('sportclub-crm-user');
      }
    }
  }, []);

  const authContextValue = useMemo(() => ({ user, login, logout, signup }), [user]);

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
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-brand-bg text-brand-text-primary">
        {user ? (
          <Suspense fallback={<FullScreenLoader />}>
            <Dashboard />
          </Suspense>
        ) : renderAuth()}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
