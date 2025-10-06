import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { LogoIcon } from '../common/LogoIcon';

const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ProspectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MembersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const TasksIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
    </svg>
);

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { name: 'reports', label: 'Reportes', icon: <ReportsIcon />, roles: [Role.Admin, Role.Manager, Role.Viewer, Role.Seller] },
    { name: 'prospects', label: 'Prospectos', icon: <ProspectsIcon />, roles: [Role.Admin, Role.Manager, Role.Seller] },
    { name: 'members', label: 'Socios', icon: <MembersIcon />, roles: [Role.Admin, Role.Manager, Role.Seller] },
    { name: 'tasks', label: 'Tareas', icon: <TasksIcon />, roles: [Role.Admin, Role.Manager, Role.Seller] },
    { name: 'users', label: 'Usuarios', icon: <UsersIcon />, roles: [Role.Admin, Role.Manager] },
  ];

  return (
    <>
        <div className={`fixed inset-0 z-20 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
        <div data-tutorial="sidebar" className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-brand-sidebar text-brand-text-secondary shadow-lg border-r border-brand-border transition-transform transform lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-center h-20 border-b border-brand-border flex-shrink-0 px-4">
                <LogoIcon className="h-10 w-auto" />
                <span className="ml-3 text-2xl font-bold text-brand-text-primary">CRM</span>
            </div>
            <nav className="p-4 flex-1 overflow-y-auto">
                {navItems.map(item => {
                    const canShow = user && item.roles.includes(user.role);
                    const isActive = currentView === item.name;

                    return canShow && (
                        <div key={item.name} className="relative mt-2">
                            <a
                                href="#"
                                className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive ? 'bg-gradient-to-r from-brand-primary/20 to-brand-primary/5 text-white shadow-lg shadow-brand-primary/10' : 'hover:bg-white/10 hover:text-brand-text-primary'}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentView(item.name);
                                    setSidebarOpen(false);
                                }}
                            >
                                <span className={`absolute left-0 top-0 h-full w-1 rounded-r-full bg-brand-primary transition-transform duration-300 ease-in-out ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></span>
                                <span className="transition-transform duration-200 group-hover:scale-110">
                                    {item.icon}
                                </span>
                                <span className="mx-4 font-medium">{item.label}</span>
                            </a>
                        </div>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-brand-border flex-shrink-0">
                <div className="relative group">
                    <a
                        href="https://github.com/lucasrondanorte-byte/SportClub-CRM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-3 text-brand-text-secondary rounded-lg transition-colors duration-200 hover:bg-white/10 hover:text-brand-text-primary"
                    >
                        <GithubIcon />
                        <span className="mx-4 font-medium">Ver en GitHub</span>
                    </a>
                </div>
            </div>
        </div>
    </>
  );
};

export default Sidebar;