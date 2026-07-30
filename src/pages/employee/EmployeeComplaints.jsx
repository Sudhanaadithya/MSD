import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useToast } from '../../hooks/useToast';

const EmployeeComplaints = () => {
  const { complaints, updateComplaintStatus } = useRental();
  const { addToast } = useToast();

  const [activeFilter, setActiveFilter] = useState('All');

  const filteredComplaints = complaints.filter((c) => {
    if (activeFilter === 'All') return true;
    return c.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const handleStatusChange = (complaintId, newStatus) => {
    updateComplaintStatus(complaintId, newStatus);
    addToast(`Complaint ${complaintId} updated to ${newStatus.toUpperCase()}`, 'info', 'Status Updated');
  };

  const openCount = complaints.filter((c) => c.status === 'open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="flex flex-col w-full gap-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-outline-variant pb-md flex justify-between items-end">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined text-[20px]">report</span>
            <span className="font-label-bold uppercase tracking-widest text-xs">Customer Resolution Dashboard</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
            Site Complaints & Grievances
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl mt-xs">
            Grievances filed by customers regarding equipment breakdowns, delays, or billing disputes. Update resolution status in real-time.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-error">
          <span className="font-label-bold text-xs text-outline uppercase block">Open Complaints</span>
          <span className="font-stat-number text-stat-number text-status-error block mt-xs">{openCount}</span>
          <span className="text-xs text-secondary">Awaiting initial review</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-warning">
          <span className="font-label-bold text-xs text-outline uppercase block">In Progress</span>
          <span className="font-stat-number text-stat-number text-status-warning block mt-xs">{inProgressCount}</span>
          <span className="text-xs text-secondary">Under technician investigation</span>
        </div>
        <div className="bg-surface-white p-md rounded-xl shadow-sm border-l-4 border-status-success">
          <span className="font-label-bold text-xs text-outline uppercase block">Resolved</span>
          <span className="font-stat-number text-stat-number text-status-success block mt-xs">{resolvedCount}</span>
          <span className="text-xs text-secondary">Successfully closed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-xs p-sm bg-surface-white rounded-xl shadow-sm border border-outline-variant">
        <span className="font-label-bold text-xs text-on-surface-variant uppercase mr-md">Filter Status:</span>
        {[
          { label: `All (${complaints.length})`, value: 'All' },
          { label: `Open (${openCount})`, value: 'open' },
          { label: `In Progress (${inProgressCount})`, value: 'in_progress' },
          { label: `Resolved (${resolvedCount})`, value: 'resolved' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-md py-xs rounded-full font-label-bold text-xs uppercase tracking-wider transition-all ${
              activeFilter === tab.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="flex flex-col gap-md">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((c) => {
            const cid = c.complaint_id || c.id;
            return (
              <div
                key={cid}
                className={`bg-surface-white rounded-xl shadow-sm border overflow-hidden p-md flex flex-col gap-md transition-all ${
                  c.status === 'open'
                    ? 'border-l-4 border-l-status-error border-outline-variant'
                    : c.status === 'in_progress'
                    ? 'border-l-4 border-l-status-warning border-outline-variant'
                    : 'border-l-4 border-l-status-success border-outline-variant opacity-85'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-xs mb-xs">
                      <span className="font-mono text-xs font-bold text-outline">{cid}</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded uppercase">
                        {c.category}
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-on-surface">
                      Customer: <strong className="text-primary">{c.customer_name}</strong>
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Booking Ref: <strong>{c.booking_id}</strong> • Equipment: <strong>{c.equipment_id}</strong>
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-xs">
                    <span className="font-label-bold text-xs uppercase text-outline">Status:</span>
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(cid, e.target.value)}
                      className={`px-md py-xs rounded-lg font-label-bold text-xs uppercase outline-none cursor-pointer border-2 ${
                        c.status === 'open'
                          ? 'bg-status-error/10 text-status-error border-status-error/30'
                          : c.status === 'in_progress'
                          ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                          : 'bg-status-success/10 text-status-success border-status-success/30'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Complaint Text Box */}
                <div className="p-md bg-surface-container-low rounded-lg border-l-2 border-outline-variant">
                  <p className="text-body-md text-on-surface font-medium">"{c.description}"</p>
                </div>

                <div className="flex items-center justify-between text-xs text-outline pt-xs border-t border-outline-variant">
                  <span>Filed at: {new Date(c.created_at || Date.now()).toLocaleString()}</span>
                  <span className="font-bold text-primary cursor-pointer hover:underline">View Equipment Telemetry History →</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-xl bg-surface-white rounded-xl border border-outline-variant text-center text-outline italic text-xs">
            No complaints found for selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeComplaints;
