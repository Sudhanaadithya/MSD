import React, { useState } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const CustomerGrievance = () => {
  const { bookings, addComplaint, complaints } = useRental();
  const { user, userMetadata } = useAuth();
  const { addToast } = useToast();

  const customerEmail = user?.email || 'jane@contractor.com';
  const customerName = userMetadata?.full_name || customerEmail.split('@')[0];

  // My customer bookings
  const myBookings = bookings.filter(
    (b) => b.customer_email === customerEmail || b.customer_id === user?.id
  );

  const [selectedBookingId, setSelectedBookingId] = useState(myBookings[0]?.booking_id || '');
  const [category, setCategory] = useState('Equipment Breakdown / Malfunction');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter my submitted complaints
  const myComplaints = complaints.filter(
    (c) => c.customer_id === user?.id || c.customer_name === customerName
  );

  const categories = [
    'Equipment Breakdown / Malfunction',
    'Delivery / Pickup Delay',
    'Billing or Penalty Dispute',
    'Operator Safety Concern',
    'General Service Feedback',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      addToast('Please select a related booking.', 'warning');
      return;
    }
    if (!description.trim()) {
      addToast('Please provide a detailed description of your complaint.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const relatedBooking = bookings.find((b) => b.booking_id === selectedBookingId || b.id === selectedBookingId);

    try {
      await addComplaint({
        customer_id: user?.id || 'usr_customer',
        customer_name: customerName,
        booking_id: selectedBookingId,
        equipment_id: relatedBooking?.equipment_id || 'EX-402',
        category,
        description,
      });

      addToast('Grievance submitted successfully. Fleet team alerted.', 'success', 'Grievance Filed');
      setDescription('');
    } catch (err) {
      console.error('Complaint submit error:', err);
      addToast('Failed to file grievance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-lg max-w-4xl mx-auto">
      <div className="border-b border-outline-variant pb-md">
        <div className="flex items-center gap-xs text-primary mb-xs">
          <span className="material-symbols-outlined text-[20px]">report_problem</span>
          <span className="font-label-bold uppercase tracking-widest text-xs">Customer Resolution Center</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">File a Site Grievance</h1>
        <p className="font-body-md text-on-surface-variant mt-xs">
          Report equipment issues, billing disputes, or delivery delays directly to Caterpillar fleet managers for rapid resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-surface-white p-lg rounded-2xl shadow-sm border border-outline-variant">
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                Select Related Booking / Equipment <span className="text-error">*</span>
              </label>
              <select
                className="w-full px-md py-sm bg-surface-container-low border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                required
              >
                {myBookings.length > 0 ? (
                  myBookings.map((b) => (
                    <option key={b.booking_id || b.id} value={b.booking_id || b.id}>
                      {b.booking_id} — {b.equipment_id} ({b.jobsite})
                    </option>
                  ))
                ) : (
                  <option value="BK-SAMPLE-01">BK-SAMPLE-01 — EX-402 (North Quarry Site)</option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                Complaint Category <span className="text-error">*</span>
              </label>
              <select
                className="w-full px-md py-sm bg-surface-container-low border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                Detailed Description <span className="text-error">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe the issue, operational impact, or dispute details clearly..."
                className="w-full px-md py-sm bg-surface-container-low border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-md bg-primary text-on-primary font-headline-sm uppercase tracking-wider rounded-lg shadow-md hover:bg-on-surface transition-all flex items-center justify-center gap-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                'SUBMITTING...'
              ) : (
                <>
                  Submit Grievance to Fleet Team
                  <span className="material-symbols-outlined">send</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status / History Column */}
        <div className="lg:col-span-5 flex flex-col gap-md">
          <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant space-y-xs">
            <h3 className="font-label-bold text-on-surface uppercase text-xs">Resolution Commitment</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Caterpillar Fleet Admin reviews all submitted grievances within 2 hours. Priority 1 mechanical faults trigger emergency technician dispatch.
            </p>
          </div>

          <div className="bg-surface-white p-md rounded-2xl shadow-sm border border-outline-variant flex-1 flex flex-col">
            <h3 className="font-headline-sm text-on-surface mb-md">My Submitted Grievances</h3>
            <div className="space-y-sm overflow-y-auto max-h-80 pr-xs">
              {myComplaints.length > 0 ? (
                myComplaints.map((c) => (
                  <div key={c.complaint_id || c.id} className="p-sm bg-surface-container-low rounded-lg border-l-4 border-primary space-y-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-on-surface">{c.category}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          c.status === 'resolved'
                            ? 'bg-status-success/20 text-status-success'
                            : c.status === 'in_progress'
                            ? 'bg-status-warning/20 text-status-warning'
                            : 'bg-status-error/20 text-status-error'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2">{c.description}</p>
                    <span className="text-[10px] text-outline block">
                      Ref: {c.complaint_id} • Equipment: {c.equipment_id}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-outline italic text-center py-md">
                  No grievances filed yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerGrievance;
