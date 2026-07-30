import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useToast } from '../../hooks/useToast';
import { parseBookingQR } from '../../utils/qrUtils';

const EmployeeHandover = () => {
  const { bookings, processQRHandover } = useRental();
  const { addToast } = useToast();

  const [scannedInput, setScannedInput] = useState('');
  const [lastHandoverResult, setLastHandoverResult] = useState(null);

  // Filter bookings awaiting handover
  const awaitingHandoverBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!scannedInput.trim()) {
      addToast('Please enter or scan a QR code payload.', 'warning');
      return;
    }

    const parsed = parseBookingQR(scannedInput);
    const bookingId = parsed?.booking_id || scannedInput.trim();

    const result = processQRHandover(bookingId);
    setLastHandoverResult(result);

    if (result.success) {
      addToast(result.message, 'success', 'Equipment Handover Complete');
      setScannedInput('');
    } else {
      addToast(result.message, 'error', 'Handover Failed');
    }
  };

  const handleQuickSelect = (bookingId) => {
    setScannedInput(bookingId);
  };

  return (
    <div className="flex flex-col w-full gap-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-outline-variant pb-md">
        <div className="flex items-center gap-xs text-status-warning mb-xs">
          <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          <span className="font-label-bold uppercase tracking-widest text-xs">Field Handover Station</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
          Scan QR Code — Equipment Release
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-2xl mt-xs">
          Scan customer's rental QR code to verify license details, release machinery, and set booking status to <strong className="text-status-success font-bold">Active</strong> and equipment to <strong className="text-status-warning font-bold">In Use</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Scanner Simulation Panel */}
        <div className="lg:col-span-6 bg-surface-white p-lg rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="space-y-md">
            <h2 className="font-headline-sm text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">camera_alt</span>
              Camera QR Scanner Simulation
            </h2>

            {/* Simulated Camera Viewfinder */}
            <div className="w-full h-64 bg-inverse-surface rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-white border-4 border-dashed border-primary-container/40 p-md">
              <div className="w-36 h-36 border-2 border-primary rounded-lg relative flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-5xl text-primary opacity-60">qr_code_2</span>
                <div className="absolute inset-0 bg-primary/10"></div>
              </div>
              <p className="font-label-bold text-xs uppercase tracking-widest text-primary-container mt-sm">
                Position QR Code within Frame
              </p>
            </div>

            <form onSubmit={handleSimulateScan} className="space-y-sm">
              <label className="font-label-bold text-on-surface-variant text-xs uppercase block">
                Manual / Scanned QR Input
              </label>
              <div className="flex gap-sm">
                <input
                  type="text"
                  placeholder="Paste QR JSON or Booking ID (e.g. BK-SAMPLE-01)"
                  className="flex-1 px-md py-sm bg-surface-container-low border-2 border-outline-variant focus:border-primary rounded-lg font-mono text-sm outline-none"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-xl py-sm bg-primary text-on-primary font-label-bold uppercase tracking-wider rounded-lg hover:bg-on-surface shadow-md flex items-center gap-xs"
                >
                  Verify & Release
                </button>
              </div>
            </form>
          </div>

          {/* Handover Result Alert */}
          {lastHandoverResult && (
            <div
              className={`mt-md p-md rounded-xl border-l-4 ${
                lastHandoverResult.success
                  ? 'bg-status-success/15 border-status-success text-emerald-800'
                  : 'bg-status-error/15 border-status-error text-error'
              }`}
            >
              <div className="flex items-center gap-sm font-label-bold text-sm">
                <span className="material-symbols-outlined">
                  {lastHandoverResult.success ? 'check_circle' : 'cancel'}
                </span>
                {lastHandoverResult.success ? 'HANDOVER SUCCESSFUL' : 'HANDOVER REJECTED'}
              </div>
              <p className="text-xs mt-1">{lastHandoverResult.message}</p>
            </div>
          )}
        </div>

        {/* Bookings Awaiting Handover List */}
        <div className="lg:col-span-6 bg-surface-white p-lg rounded-2xl shadow-sm border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-md">
            <div>
              <h2 className="font-headline-sm text-on-surface">Confirmed Bookings Awaiting Release</h2>
              <p className="text-xs text-secondary">Click any pending booking below to simulate quick scan</p>
            </div>
            <span className="px-sm py-1 bg-status-warning/20 text-on-surface font-bold text-xs rounded-full">
              {awaitingHandoverBookings.length} Pending
            </span>
          </div>

          <div className="space-y-sm overflow-y-auto max-h-96 pr-xs">
            {awaitingHandoverBookings.length > 0 ? (
              awaitingHandoverBookings.map((b) => (
                <div
                  key={b.booking_id || b.id}
                  onClick={() => handleQuickSelect(b.booking_id || b.id)}
                  className="p-md bg-surface-container-low hover:bg-primary-container/20 rounded-xl border border-outline-variant cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-xs">
                      <span className="font-mono font-bold text-sm text-on-surface group-hover:text-primary">
                        {b.booking_id || b.id}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-800 font-bold text-[10px] rounded uppercase">
                        Awaiting Handover
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      Customer: <strong>{b.customer_name}</strong> • Equipment: <strong>{b.equipment_id}</strong>
                    </p>
                    <p className="text-[11px] text-outline">
                      Site: {b.jobsite} • License: {b.license_number}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary">
                    qr_code_2
                  </span>
                </div>
              ))
            ) : (
              <div className="p-xl text-center text-outline italic text-xs">
                All confirmed bookings have been handed over. Fleet operations active!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHandover;
