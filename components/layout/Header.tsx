import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.166.42-2.223 1.155-3.001L8.228 9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);


interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    onStartTutorial: () => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, onStartTutorial }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 h-20 bg-brand-sidebar/50 backdrop-blur-lg border-b border-brand-border shadow-sm sticky top-0 z-10" data-tutorial="header-bar">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-brand-text-muted lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md">
          <MenuIcon />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
            onClick={onStartTutorial} 
            className="p-2 text-brand-text-muted transition-colors duration-200 rounded-full hover:bg-white/10 hover:text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-sidebar focus:ring-brand-primary"
            aria-label="Iniciar tutorial"
            title="Iniciar tutorial"
            data-tutorial="help-button"
        >
          <HelpIcon />
        </button>

        <div className="flex items-center p-2 rounded-lg hover:bg-white/5 transition-colors" data-tutorial="user-profile">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-primary text-white font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 text-sm text-left">
                <p className="font-semibold text-brand-text-primary">{user?.name}</p>
                <p className="text-xs text-brand-text-muted capitalize">{user?.role} @ {user?.branch}</p>
            </div>
        </div>
        
        <button onClick={logout} className="flex items-center px-4 py-2 text-sm font-medium text-brand-text-primary transition-colors duration-200 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-sidebar focus:ring-brand-primary" data-tutorial="logout-button">
          <LogoutIcon />
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;