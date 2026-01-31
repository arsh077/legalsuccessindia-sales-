
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Icons } from '../constants';
import { Link, useLocation } from 'react-router-dom';

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string, active?: boolean }> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isSyncing } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const adminLinks = [
    { to: '/admin/dashboard', icon: <Icons.Dashboard />, label: 'Dashboard' },
    { to: '/admin/leads/dump', icon: <Icons.Leads />, label: 'Lead Dump' },
    { to: '/admin/employees', icon: <Icons.Users />, label: 'Employees' },
    { to: '/admin/reports', icon: <Icons.Reports />, label: 'Sales & Reports' },
    { to: '/admin/appreciation', icon: <Icons.Appreciation />, label: 'Appreciation' },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', icon: <Icons.Dashboard />, label: 'Dashboard' },
    { to: '/employee/sales', icon: <Icons.Sales />, label: 'My Sales' },
    { to: '/employee/performance', icon: <Icons.Reports />, label: 'Performance' },
  ];

  const links = user.role === UserRole.ADMIN ? adminLinks : employeeLinks;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-4 py-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
            <span className="font-bold text-lg text-gray-900 leading-tight">Legal Success<br/><span className="text-sm text-gray-500 font-medium">India Internal</span></span>
          </div>
          
          <nav className="flex-1 space-y-1 mt-4">
            {links.map(link => (
              <SidebarLink key={link.to} {...link} active={location.pathname === link.to} />
            ))}
          </nav>

          <div className="mt-auto px-4 py-4">
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
               <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 {isSyncing ? 'Cloud Syncing...' : 'Cloud Connected'}
               </span>
             </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="flex-1">
            {isSyncing && (
              <div className="ml-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Live Sync</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};
