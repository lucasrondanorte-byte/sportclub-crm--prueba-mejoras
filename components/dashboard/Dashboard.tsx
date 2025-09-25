import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import Card from '../common/Card';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Role, User } from '../../types';
import Notification from '../common/Notification';

// Lazy load view components
const ReportsView = lazy(() => import('../views/ReportsView'));
const ProspectsView = lazy(() => import('../views/ProspectsView'));
const MembersView = lazy(() => import('../views/MembersView'));
const TasksView = lazy(() => import('../views/TasksView'));
const UsersView = lazy(() => import('../views/UsersView'));

type View = 'reports' | 'prospects' | 'members' | 'tasks' | 'users';

const ViewLoader: React.FC = () => (
    <Card>
        <div className="flex justify-center items-center h-64">
             <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
        </div>
    </Card>
);

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('reports');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const [sellers, setSellers] = useState<User[]>([]);

  // We need the list of sellers for the import function
  useEffect(() => {
    if (user && (user.role === Role.Admin || user.role === Role.Manager)) {
      api.getUsers().then(allUsers => {
        setSellers(allUsers.filter(u => u.role === Role.Seller || u.role === Role.Manager || u.role === Role.Admin));
      });
    }
  }, [user]);

  // Auto-import logic
  useEffect(() => {
    if (!user || (user.role !== Role.Admin && user.role !== Role.Manager) || sellers.length === 0) {
      return; // Only run for admins/managers and when sellers are loaded
    }

    const AUTO_IMPORT_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
    const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
    const STORAGE_KEY = 'lastAutoImportTimestamp';

    const triggerAutoImport = async () => {
      const lastImportTime = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      const now = Date.now();
      
      if (now - lastImportTime < AUTO_IMPORT_INTERVAL_MS) {
        return; // Not time yet
      }

      localStorage.setItem(STORAGE_KEY, now.toString()); // Lock immediately

      const result = await api.runGoogleSheetImport(user, sellers);

      if (result.success && result.importedCount > 0) {
        setNotification({
          message: `${result.importedCount} nuevo(s) prospecto(s) importado(s).`,
          type: 'success',
        });
        // In a real app with global state, we'd dispatch an action to refresh data.
        // For this demo, the notification is the primary feedback.
      } else if (!result.success) {
        setNotification({ message: `Fallo en la sincronización automática: ${result.message}`, type: 'error' });
      }
    };

    // Run once on load, in case a lot of time has passed since last open
    triggerAutoImport();

    // Set up the interval for periodic checks
    const intervalId = setInterval(triggerAutoImport, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);

  }, [user, sellers]);

  const renderView = () => {
    switch (currentView) {
      case 'reports':
        return <ReportsView setCurrentView={setCurrentView} />;
      case 'prospects':
        return <ProspectsView />;
      case 'members':
        return <MembersView />;
      case 'tasks':
        return <TasksView />;
      case 'users':
        return <UsersView />;
      default:
        return <ReportsView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg">
          <div className="container px-6 py-8 mx-auto">
            <Suspense fallback={<ViewLoader />}>
              {renderView()}
            </Suspense>
          </div>
        </main>
      </div>
       {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;