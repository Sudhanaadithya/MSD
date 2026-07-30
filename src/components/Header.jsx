import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useRental } from '../contexts/RentalContext';

const Header = () => {
  const { user, role, userMetadata, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Safely try to access rental context (may not be available on login/signup pages)
  let notifications = [];
  let bookings = [];
  try {
    const rental = useRental();
    notifications = rental.notifications || [];
    bookings = rental.bookings || [];
  } catch {
    // RentalContext not available (e.g. on auth pages)
  }

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const panelRef = useRef(null);

  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const totalBadge = pendingCount + confirmedBookings;

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Signed out of command station.', 'info', 'Logged Out');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = userMetadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayRole = (role || 'customer').toUpperCase();

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-surface-white/90 backdrop-blur-md z-40 px-lg flex items-center justify-between border-b border-outline-variant shadow-sm">
      <div className="flex-1 max-w-md relative">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
        <input 
          className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary px-xl py-xs rounded-lg font-body-sm text-on-surface outline-none transition-all" 
          placeholder="Search fleet, assets or operators..." 
          type="text" 
        />
      </div>
      <div className="flex items-center gap-md">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="p-xs hover:bg-surface-container rounded-full text-on-surface-variant transition-colors relative"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {totalBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-status-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {totalBadge}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-sm w-96 bg-surface-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden z-50 animate-fade-up">
              <div className="p-md bg-inverse-surface text-surface-white flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
                  <span className="font-label-bold uppercase tracking-widest text-xs">Notification Center</span>
                </div>
                <span className="px-2 py-0.5 bg-status-error text-white text-[10px] font-bold rounded-full">
                  {totalBadge} New
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30">
                {/* Delivery Request Notifications */}
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id || notif.id}
                    className={`p-md hover:bg-surface-container-low transition-colors cursor-pointer ${
                      notif.status === 'pending' ? 'bg-primary-container/5' : ''
                    }`}
                    onClick={() => {
                      setShowNotifPanel(false);
                      navigate('/employee/notifications');
                    }}
                  >
                    <div className="flex items-start gap-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.status === 'pending'
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-status-success/20 text-status-success'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-bold text-on-surface text-xs truncate">
                          Delivery Request: {notif.equipment_id}
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          {notif.customer_name} → {notif.jobsite}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          notif.status === 'pending'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-status-success/15 text-status-success'
                        }`}>
                          {notif.status === 'pending' ? 'Awaiting Driver' : 'Driver Assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Confirmed Bookings Awaiting Handover */}
                {bookings.filter((b) => b.status === 'confirmed').map((b) => (
                  <div
                    key={b.booking_id || b.id}
                    className="p-md hover:bg-surface-container-low transition-colors cursor-pointer bg-amber-50/50"
                    onClick={() => {
                      setShowNotifPanel(false);
                      navigate('/employee/handover');
                    }}
                  >
                    <div className="flex items-start gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-bold text-on-surface text-xs truncate">
                          Handover Pending: {b.equipment_id}
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          {b.customer_name} • {b.jobsite}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-primary/15 text-primary">
                          Awaiting QR Scan
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {totalBadge === 0 && (
                  <div className="p-lg text-center text-outline text-xs italic">
                    No new notifications.
                  </div>
                )}
              </div>

              <div className="p-sm bg-surface-container-low border-t border-outline-variant flex justify-between">
                <button
                  onClick={() => {
                    setShowNotifPanel(false);
                    navigate('/employee/notifications');
                  }}
                  className="text-xs font-label-bold text-primary hover:underline uppercase tracking-wider"
                >
                  View All Notifications
                </button>
                <button
                  onClick={() => {
                    setShowNotifPanel(false);
                    navigate('/employee/handover');
                  }}
                  className="text-xs font-label-bold text-on-surface-variant hover:text-primary uppercase tracking-wider"
                >
                  QR Handover →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-sm pl-md border-l border-outline-variant">
          <div className="text-right hidden sm:block">
            <p className="font-label-bold text-label-bold text-on-surface capitalize">{displayName}</p>
            <p className="text-[10px] uppercase text-primary font-bold tracking-widest">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-[24px]">person</span>
          </div>
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="p-xs hover:bg-error/10 hover:text-error rounded-lg text-on-surface-variant transition-colors flex items-center gap-xs"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
