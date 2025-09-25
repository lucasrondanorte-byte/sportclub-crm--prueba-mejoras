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
)

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-brand-surface border-b border-brand-border shadow-sm">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-brand-text-muted lg:hidden focus:outline-none">
          <MenuIcon />
        </button>
        <div className="relative mx-4 lg:mx-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
             {/* Search Icon can go here */}
          </span>
          {/* A search input can be placed here if needed */}
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="flex items-center mr-4 text-brand-text-secondary">
            <UserIcon/>
            <div className="ml-2 text-sm text-left">
                <p className="font-semibold text-brand-text-primary">{user?.name}</p>
                <p className="text-xs text-brand-text-muted capitalize">{user?.role}</p>
            </div>
        </div>
        
        <button onClick={logout} className="flex items-center px-3 py-2 text-sm font-medium text-red-300 transition-colors duration-200 bg-brand-primary/20 rounded-md hover:bg-brand-primary/40 focus:outline-none">
          <LogoutIcon />
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;