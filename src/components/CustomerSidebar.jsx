import React from 'react';
import { NavLink } from 'react-router-dom';

const CustomerSidebar = () => {
  const navItems = [
    { name: 'Equipment Fleet', path: '/customer/equipment', icon: 'construction' },
    { name: 'My Rental Alerts', path: '/customer/alerts', icon: 'warning' },
    { name: 'File Grievance', path: '/customer/grievance', icon: 'report_problem' },
    { name: 'Site Weather', path: '/customer/weather', icon: 'cloud' },
    { name: 'Account Settings', path: '/customer/settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col border-r border-outline-variant">
      <div className="p-lg h-20 flex items-center gap-sm border-b border-outline-variant mb-md bg-surface-white">
        <img alt="Logo" className="h-8 w-auto object-contain" src="/bg_industrial.png" />
        <div>
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight block">Smart Rental</span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Customer Portal</span>
        </div>
      </div>
      <nav className="flex-1 px-sm flex flex-col gap-base">
        {navItems.map((item) => (
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
      <div className="p-md m-sm bg-surface-white rounded-lg border border-outline-variant/50 text-xs">
        <p className="font-label-bold text-on-surface uppercase">24/7 Rental Support</p>
        <p className="text-secondary mt-1">Need help with equipment or site handover?</p>
        <p className="text-primary font-bold mt-2">📞 1-800-CAT-RENT</p>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
