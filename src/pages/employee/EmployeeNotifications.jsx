import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useToast } from '../../hooks/useToast';

const EmployeeNotifications = () => {
  const { notifications, drivers, assignDriverToDelivery, bookings } = useRental();
  const { addToast } = useToast();

  const [expandedNotifId, setExpandedNotifId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [activeAssignNotif, setActiveAssignNotif] = useState(null);

  // Unassigned drivers
  const unassignedDrivers = drivers.filter((d) => d.status === 'unassigned');

  const toggleExpand = (id) => {
    setExpandedNotifId(expandedNotifId === id ? null : id);
  };

  const handleOpenAssignModal = (notif) => {
    setActiveAssignNotif(notif);
    setSelectedDriverId(unassignedDrivers[0]?.driver_id || '');
  };

  const handleConfirmAssignment = () => {
    if (!selectedDriverId) {
      addToast('Please select an unassigned driver.', 'warning');
      return;
    }

    const success = assignDriverToDelivery(
      activeAssignNotif.notification_id || activeAssignNotif.id,
      selectedDriverId
    );

    if (success) {
      addToast('Driver successfully assigned to delivery task!', 'success', 'Driver Assigned');
      setActiveAssignNotif(null);
    } else {
      addToast('Failed to assign driver.', 'error');
    }
  };

  return (
    <div className="flex flex-col w-full gap-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-outline-variant pb-md flex justify-between items-end">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            <span className="font-label-bold uppercase tracking-widest text-xs">Dispatch Operations</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
            Incoming Delivery Requests
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl mt-xs">
            Alerts for rentals requesting site delivery. Expand details to assign drivers from your available fleet roster.
          </p>
        </div>
        <div className="px-md py-xs bg-primary-container text-on-primary-container font-label-bold text-xs rounded-full uppercase">
          {notifications.filter((n) => n.status === 'pending').length} Pending Deliveries
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-md">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const notifId = notif.notification_id || notif.id;
            const isExpanded = expandedNotifId === notifId;
            const isPending = notif.status === 'pending';
            const relatedBooking = bookings.find((b) => b.booking_id === notif.booking_id);

            return (
              <div
                key={notifId}
                className={`bg-surface-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  isPending ? 'border-l-4 border-l-status-warning border-outline-variant' : 'border-outline-variant opacity-85'
                }`}
              >
                {/* Main Card Row */}
                <div
                  onClick={() => toggleExpand(notifId)}
                  className="p-md flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-md">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPending ? 'bg-status-warning/20 text-status-warning' : 'bg-status-success/20 text-status-success'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-xs">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            isPending ? 'bg-status-warning/20 text-status-warning' : 'bg-status-success/20 text-status-success'
                          }`}
                        >
                          {isPending ? 'Pending Driver Assignment' : 'Driver Assigned'}
                        </span>
                        <span className="text-xs font-mono text-outline">{notif.booking_id}</span>
                      </div>
                      <h3 className="font-headline-sm text-on-surface mt-xs">
                        Delivery Request: {notif.equipment_id} → {notif.customer_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-md">
                    {isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(notif);
                        }}
                        className="px-md py-xs bg-primary text-on-primary font-label-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-on-surface transition-all flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        Assign Driver
                      </button>
                    )}
                    <span className="material-symbols-outlined text-outline">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Expandable Details Panel */}
                {isExpanded && (
                  <div className="p-md bg-surface-container-low border-t border-outline-variant space-y-md animate-fade-up">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md text-xs">
                      <div>
                        <span className="text-secondary block font-label-bold uppercase">Customer Name</span>
                        <strong className="text-on-surface font-headline-sm text-sm">{notif.customer_name}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block font-label-bold uppercase">Equipment ID</span>
                        <strong className="text-on-surface font-headline-sm text-sm">{notif.equipment_id}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block font-label-bold uppercase">Jobsite Address</span>
                        <strong className="text-on-surface text-sm">{notif.jobsite}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block font-label-bold uppercase">Requested Schedule</span>
                        <strong className="text-on-surface text-sm">{notif.start_date} to {notif.end_date}</strong>
                      </div>
                    </div>

                    {relatedBooking && (
                      <div className="p-xs bg-white rounded-lg border border-outline-variant/60 text-xs text-secondary">
                        <span className="font-bold text-on-surface">Verified License:</span> {relatedBooking.license_number || 'N/A'} • <span className="font-bold text-on-surface">Cost:</span> ₹{relatedBooking.estimated_cost?.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-xl bg-surface-white rounded-xl border border-outline-variant text-center text-outline italic text-xs">
            No incoming delivery requests.
          </div>
        )}
      </div>

      {/* Driver Assignment Modal */}
      {activeAssignNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-white rounded-2xl shadow-2xl max-w-md w-full border border-outline-variant overflow-hidden p-lg space-y-md animate-fade-up">
            <div className="flex justify-between items-center border-b border-outline-variant pb-sm">
              <h3 className="font-headline-sm text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">badge</span>
                Select Fleet Driver
              </h3>
              <button onClick={() => setActiveAssignNotif(null)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary">
              Assign an unassigned driver to transport <strong>{activeAssignNotif.equipment_id}</strong> to <strong>{activeAssignNotif.customer_name}</strong> at {activeAssignNotif.jobsite}.
            </p>

            {unassignedDrivers.length > 0 ? (
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-xs uppercase text-on-surface-variant">
                  Available Drivers
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-md py-sm bg-surface-container-low border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                >
                  {unassignedDrivers.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.name} ({d.driver_id}) — {d.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-md bg-status-error/10 text-error rounded-lg text-xs font-bold">
                ⚠️ All drivers are currently assigned. Add or unassign a driver in the Drivers section first.
              </div>
            )}

            <div className="pt-sm flex justify-end gap-sm">
              <button
                onClick={() => setActiveAssignNotif(null)}
                className="px-lg py-sm border-2 border-outline-variant font-label-bold text-xs rounded-lg hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={unassignedDrivers.length === 0}
                className="px-xl py-sm bg-primary text-on-primary font-label-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:bg-on-surface disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeNotifications;
