import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';

const EmployeeDrivers = () => {
  const { drivers, toggleDriverStatus } = useRental();
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'unassigned' | 'assigned'

  const filteredDrivers = drivers.filter((d) => {
    if (activeTab === 'All') return true;
    return d.status.toLowerCase() === activeTab.toLowerCase();
  });

  const unassignedCount = drivers.filter((d) => d.status === 'unassigned').length;
  const assignedCount = drivers.filter((d) => d.status === 'assigned').length;

  return (
    <div className="flex flex-col w-full gap-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-outline-variant pb-md flex justify-between items-end">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span className="font-label-bold uppercase tracking-widest text-xs">Fleet Personnel</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
            Driver Roster & Status
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl mt-xs">
            Manage transport drivers for site delivery fulfillment. View assigned vs unassigned drivers across active project contracts.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-primary">
          <span className="font-label-bold text-xs text-outline uppercase block">Total Roster</span>
          <span className="font-stat-number text-stat-number text-primary block mt-xs">{drivers.length}</span>
          <span className="text-xs text-secondary">Active transport drivers</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-success">
          <span className="font-label-bold text-xs text-outline uppercase block">Unassigned (Ready)</span>
          <span className="font-stat-number text-stat-number text-status-success block mt-xs">{unassignedCount}</span>
          <span className="text-xs text-secondary">Available for delivery dispatch</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-warning">
          <span className="font-label-bold text-xs text-outline uppercase block">Assigned (In Transit)</span>
          <span className="font-stat-number text-stat-number text-status-warning block mt-xs">{assignedCount}</span>
          <span className="text-xs text-secondary">Currently fulfilling deliveries</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-xs p-sm bg-surface-white rounded-xl shadow-sm border border-outline-variant">
        <span className="font-label-bold text-xs text-on-surface-variant uppercase mr-md">Status Filter:</span>
        {[
          { label: `All Drivers (${drivers.length})`, value: 'All' },
          { label: `Unassigned (${unassignedCount})`, value: 'unassigned' },
          { label: `Assigned (${assignedCount})`, value: 'assigned' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-md py-xs rounded-full font-label-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === tab.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Driver List Table */}
      <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary text-on-primary font-label-bold text-xs uppercase tracking-wider">
              <th className="px-md py-sm">Driver ID</th>
              <th className="px-md py-sm">Driver Name</th>
              <th className="px-md py-sm">Contact Phone</th>
              <th className="px-md py-sm">Status</th>
              <th className="px-md py-sm">Assigned Booking</th>
              <th className="px-md py-sm text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm">
            {filteredDrivers.map((driver) => {
              const isAssigned = driver.status === 'assigned';
              return (
                <tr key={driver.driver_id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-md font-mono font-bold text-on-surface">{driver.driver_id}</td>
                  <td className="px-md py-md font-bold text-on-surface flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                      {driver.name.charAt(0)}
                    </div>
                    {driver.name}
                  </td>
                  <td className="px-md py-md font-mono text-secondary">{driver.phone || '+91 98765 00000'}</td>
                  <td className="px-md py-md">
                    <span
                      className={`px-sm py-base rounded-full text-[11px] font-bold uppercase tracking-tighter border ${
                        isAssigned
                          ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          : 'bg-status-success/15 text-status-success border-status-success/30'
                      }`}
                    >
                      ● {isAssigned ? 'Assigned' : 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-md py-md font-mono text-xs">
                    {isAssigned ? (
                      <span className="text-primary font-bold">{driver.assigned_booking_id || 'Active Job'}</span>
                    ) : (
                      <span className="text-outline italic">—</span>
                    )}
                  </td>
                  <td className="px-md py-md text-right">
                    <button
                      onClick={() => toggleDriverStatus(driver.driver_id)}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all shadow-sm active:scale-95 ${
                        isAssigned
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-[#FFCD00] text-gray-950 hover:bg-amber-400'
                      }`}
                    >
                      {isAssigned ? 'Release' : 'Assign'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDrivers;
