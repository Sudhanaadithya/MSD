import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useAuth } from '../../hooks/useAuth';

const CustomerAlerts = () => {
  const { bookings } = useRental();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter bookings for this customer
  const customerEmail = user?.email || 'jane@contractor.com';
  const myBookings = bookings.filter(
    (b) => b.customer_email === customerEmail || b.customer_id === user?.id
  );

  // Generate explainability-style customer alerts based on active/confirmed rentals
  const customerAlerts = [
    {
      id: 'ALT-CUST-01',
      title: 'Idle Time Cost-Doubling Risk',
      severity: 'Warning',
      category: 'Idle Penalty',
      equipment_id: 'CR-110',
      timestamp: '1 hour ago',
      booking_id: 'BK-SAMPLE-02',
      diagnosis:
        'Telemetry detected 2.5 consecutive idle hours today on Crane CR-110. Exceeding 3 hours will automatically DOUBLE your daily rental rate for today per clause 4 of your signed agreement.',
      recommendation: 'Ensure operator engages machine hydraulics or shut down engine during lunch shift.',
    },
    {
      id: 'ALT-CUST-02',
      title: 'Upcoming Overdue Rental Warning',
      severity: 'Info',
      category: 'Rental Expiry',
      equipment_id: 'EX-402',
      timestamp: '3 hours ago',
      booking_id: 'BK-SAMPLE-01',
      diagnosis:
        'Rental end date is scheduled for tomorrow. If you require an extension, submit an extension request prior to 17:00 IST to prevent overdue penalties.',
      recommendation: 'Contact support or extend booking online.',
    },
  ];

  const filteredAlerts = customerAlerts.filter((alt) => {
    if (activeFilter === 'All') return true;
    return alt.severity.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="flex flex-col w-full gap-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span className="font-label-bold uppercase tracking-widest text-xs">Customer Rental Monitor</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">Active Rental Alerts & Warnings</h1>
          <p className="font-body-md text-on-surface-variant max-w-xl mt-xs">
            Real-time notifications, idle-time penalty warnings, and system alerts tied specifically to your organization's bookings.
          </p>
        </div>
      </div>

      {/* Active Rental Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-primary">
          <span className="font-label-bold text-xs text-outline uppercase block">Active Bookings</span>
          <span className="font-stat-number text-stat-number text-primary block mt-xs">{myBookings.length || 2}</span>
          <span className="text-xs text-secondary">Currently deployed machinery</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-warning">
          <span className="font-label-bold text-xs text-outline uppercase block">Idle Warnings</span>
          <span className="font-stat-number text-stat-number text-status-warning block mt-xs">1</span>
          <span className="text-xs text-secondary">At risk of cost doubling today</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-success">
          <span className="font-label-bold text-xs text-outline uppercase block">Agreement Compliance</span>
          <span className="font-stat-number text-stat-number text-status-success block mt-xs">100%</span>
          <span className="text-xs text-secondary">Terms verified & active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-xs p-sm bg-surface-white rounded-xl shadow-sm border border-outline-variant">
        <span className="font-label-bold text-xs text-on-surface-variant uppercase mr-md">Filter Severity:</span>
        {['All', 'Warning', 'Info'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-md py-xs rounded-full font-label-bold text-xs uppercase tracking-wider transition-all ${
              activeFilter === f
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Customer Alert Cards List */}
      <div className="flex flex-col gap-md">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-surface-white rounded-xl shadow-sm border-l-[6px] overflow-hidden transition-all hover:shadow-md ${
              alert.severity === 'Warning' ? 'border-status-warning' : 'border-tertiary'
            }`}
          >
            <div className="p-md flex flex-col gap-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-xs mb-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-label-bold rounded uppercase ${
                        alert.severity === 'Warning'
                          ? 'bg-status-warning/15 text-status-warning'
                          : 'bg-tertiary/15 text-tertiary'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-body-sm font-label-bold text-on-surface-variant uppercase">
                      {alert.equipment_id} • Booking {alert.booking_id}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-on-surface">{alert.title}</h3>
                  <p className="text-body-sm text-outline flex items-center gap-xs mt-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> {alert.timestamp}
                  </p>
                </div>
              </div>

              {/* Explainability Card Box */}
              <div className="bg-surface-container-low p-md rounded-lg border-l-2 border-outline-variant space-y-xs">
                <p className="text-xs font-label-bold text-on-surface-variant uppercase">System Telemetry Explanation</p>
                <p className="text-body-md text-on-surface italic">"{alert.diagnosis}"</p>
              </div>

              <div className="pt-xs flex items-center justify-between border-t border-outline-variant text-xs font-label-bold">
                <span className="text-secondary">Action: {alert.recommendation}</span>
                <span className="text-primary font-bold uppercase cursor-pointer hover:underline">View Agreement Terms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerAlerts;
