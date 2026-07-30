import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRental } from '../contexts/RentalContext';

const EmployeeSidebar = () => {
  const { notifications, complaints } = useRental();

  const pendingNotifsCount = notifications.filter((n) => n.status === 'pending').length;
  const openComplaintsCount = complaints.filter((c) => c.status === 'open').length;

  const navItems = [
    { name: 'Equipment Overview', path: '/employee/dashboard', icon: 'dashboard' },
    { name: 'Fleet Drivers', path: '/employee/drivers', icon: 'badge' },
    { name: 'Customer Complaints', path: '/employee/complaints', icon: 'report', badge: openComplaintsCount },
    { name: 'Check-In / Out', path: '/employee/check-in-out', icon: 'swap_horiz' },
    { name: 'Anomaly Alerts', path: '/employee/alerts', icon: 'warning' },
    { name: 'Demand Forecast', path: '/employee/forecasting', icon: 'timeline' },
    { name: 'Leaderboard', path: '/employee/leaderboard', icon: 'leaderboard' },
    { name: 'Site Weather', path: '/employee/weather', icon: 'cloud' },
    { name: 'System Settings', path: '/employee/settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col border-r border-outline-variant">
      <div className="p-lg h-20 flex items-center gap-sm border-b border-outline-variant mb-sm bg-surface-white">
        <img alt="Logo" className="h-8 w-auto object-contain" src="/bg_industrial.png" />
        <div>
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight block">Smart Rental</span>
          <span className="text-[10px] font-bold text-status-warning uppercase tracking-widest block">Employee Station</span>
        </div>
      </div>
      <nav className="flex-1 px-sm flex flex-col gap-1 overflow-y-auto pb-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-md py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-on-primary font-label-bold shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-bold text-xs">{item.name}</span>
            </div>
            {Boolean(item.badge) && item.badge > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-status-error text-white rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default EmployeeSidebar;
