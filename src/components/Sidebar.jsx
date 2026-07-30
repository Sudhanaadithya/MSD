import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { role } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['Admin', 'Manager', 'Operator', 'Customer'] },
    { name: 'Check-In/Out', path: '/check-in-out', icon: 'swap_horiz', roles: ['Admin', 'Manager', 'Operator'] },
    { name: 'Alerts', path: '/alerts', icon: 'warning', roles: ['Admin', 'Manager', 'Operator'] },
    { name: 'Leaderboard', path: '/leaderboard', icon: 'leaderboard', roles: ['Admin', 'Manager'] },
    { name: 'Forecasting', path: '/forecasting', icon: 'timeline', roles: ['Admin', 'Manager'] },
    { name: 'Weather', path: '/weather', icon: 'cloud', roles: ['Admin', 'Manager', 'Operator', 'Customer'] },
    { name: 'Settings', path: '/settings', icon: 'settings', roles: ['Admin', 'Manager'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role || 'Manager'));

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col border-r border-outline-variant">
      <div className="p-lg h-20 flex items-center gap-sm border-b border-outline-variant mb-md bg-surface-white">
        <img alt="Logo" className="h-8 w-auto object-contain" src="/bg_industrial.png" />
        <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">Smart Rental</span>
      </div>
      <nav className="flex-1 px-sm flex flex-col gap-base">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-sm px-md py-sm rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-on-primary font-label-bold shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-bold">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
