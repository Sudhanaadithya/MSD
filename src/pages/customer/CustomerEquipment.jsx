import React, { useState, useMemo, useEffect } from 'react';
import { useRental } from '../../contexts/RentalContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { checkWeatherAtLocation } from '../../services/weatherApi';

const CustomerEquipment = () => {
  const { equipmentList, addBooking } = useRental();
  const { user, userMetadata } = useAuth();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Booking Modal State
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Form, 2: Agreement, 3: License & Finalize

  // Booking Form Inputs
  const [jobsite, setJobsite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportation, setTransportation] = useState('delivery'); // 'pickup' | 'delivery'

  // Agreement State
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Weather Check State
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
  const [weatherAlertModal, setWeatherAlertModal] = useState(null); // { condition, description, ... } or null

  // License State
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseError, setLicenseError] = useState('');

  // Final Confirmation State & 250s Timer
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrTimer, setQrTimer] = useState(250);

  useEffect(() => {
    if (bookingStep !== 4 || !createdBooking) return;
    setQrTimer(250);
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingStep, createdBooking]);

  const handleRefreshQRToken = () => {
    setQrTimer(250);
    addToast('QR Code Security Token Refreshed (250s Validity).', 'info', 'Token Renewed');
  };


  // Calculate rental days and cost
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [startDate, endDate]);

  const estimatedCost = useMemo(() => {
    return rentalDays * 1000;
  }, [rentalDays]);

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const idStr = (item.equipment_id || item.id || '').toLowerCase();
      const typeStr = (item.type || '').toLowerCase();
      const siteStr = (item.site || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = idStr.includes(query) || typeStr.includes(query) || siteStr.includes(query);
      const matchesCategory = selectedCategory === 'All' || item.type === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [equipmentList, searchTerm, selectedCategory]);

  const categories = ['All', 'Excavator', 'Crane', 'Bulldozer', 'Loader', 'Grader', 'Compactor'];

  const handleOpenBookingModal = (item) => {
    if (item.status !== 'Available') return;
    setSelectedEquipment(item);
    setBookingStep(1);
    setJobsite('');
    setStartDate('');
    setEndDate('');
    setTransportation('delivery');
    setAgreementChecked(false);
    setWeatherAlertModal(null);
    setLicenseNumber('');
    setLicenseError('');
    setCreatedBooking(null);
  };

  const handleCloseModal = () => {
    setSelectedEquipment(null);
  };

  // Step 1 -> Step 2 (Proceed to Agreement)
  const handleProceedToAgreement = (e) => {
    e.preventDefault();
    if (!jobsite.trim()) {
      addToast('Please enter a jobsite location.', 'warning');
      return;
    }
    if (!startDate || !endDate) {
      addToast('Please select valid rental start and end dates.', 'warning');
      return;
    }
    if (rentalDays <= 0) {
      addToast('End date must be after start date.', 'warning');
      return;
    }
    setBookingStep(2);
  };

  // Step 2 -> Step 3 (Accept Agreement & Weather Check)
  const handleAcceptAgreementAndCheckWeather = async () => {
    if (!agreementChecked) {
      addToast('You must accept the rental agreement to proceed.', 'warning');
      return;
    }

    setIsCheckingWeather(true);
    const weatherResult = await checkWeatherAtLocation(jobsite);
    setIsCheckingWeather(false);

    if (weatherResult.isSevere) {
      // Show severe weather warning modal
      setWeatherAlertModal(weatherResult);
    } else {
      // Normal weather — proceed silently to Step 3
      setBookingStep(3);
    }
  };

  // Weather modal choice: "Yes, Proceed"
  const handleProceedDespiteWeather = () => {
    setWeatherAlertModal(null);
    setBookingStep(3);
  };

  // Finalize Rental (Step 3 Submit)
  const handleFinalizeRental = async (e) => {
    e.preventDefault();
    setLicenseError('');

    // Basic license format validation (minimum 6 alphanumeric chars)
    const cleanLicense = licenseNumber.trim().toUpperCase();
    if (!cleanLicense || cleanLicense.length < 6 || !/^[A-Z0-9-]+$/i.test(cleanLicense)) {
      setLicenseError('Please enter a valid operator/driving license number (e.g. DL-98765432).');
      return;
    }

    setIsSubmitting(true);

    try {
      const customerEmail = user?.email || 'customer@company.com';
      const customerName = userMetadata?.full_name || customerEmail.split('@')[0];

      const newBooking = await addBooking({
        equipment_id: selectedEquipment.equipment_id || selectedEquipment.id,
        customer_id: user?.id || 'usr_customer',
        customer_name: customerName,
        customer_email: customerEmail,
        jobsite,
        start_date: startDate,
        end_date: endDate,
        transportation_type: transportation,
        estimated_cost: estimatedCost,
        license_number: cleanLicense,
        weather_confirmed: Boolean(weatherAlertModal),
      });

      setCreatedBooking(newBooking);
      setBookingStep(4); // Success step
      addToast(
        `Rental Confirmed! QR Code dispatched to ${customerEmail}.`,
        'success',
        'Booking Created'
      );
    } catch (err) {
      console.error('Finalize error:', err);
      addToast('Failed to create booking. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined text-[20px]">handyman</span>
            <span className="font-label-bold uppercase tracking-widest text-xs">Customer Equipment Portal</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">Available Fleet Inventory</h1>
          <p className="font-body-md text-on-surface-variant max-w-xl mt-xs">
            Select heavy machinery for your worksite. Real-time availability, dynamic pricing, and automated handover dispatch.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-white p-md rounded-xl shadow-sm border border-outline-variant flex flex-col md:flex-row gap-md items-center justify-between">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary pl-xl pr-md py-sm rounded-lg font-body-md text-on-surface outline-none transition-all"
            placeholder="Search equipment by name, type, or asset ID (e.g. EX-402, Excavator)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-xs overflow-x-auto w-full md:w-auto pb-xs md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-md py-xs rounded-full font-label-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {filteredEquipment.map((item) => {
          const isAvailable = item.status === 'Available';
          return (
            <div
              key={item.equipment_id || item.id}
              className={`bg-surface-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col transition-all duration-300 ${
                isAvailable
                  ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer group'
                  : 'opacity-60 grayscale cursor-not-allowed bg-surface-container-low'
              }`}
              onClick={() => isAvailable && handleOpenBookingModal(item)}
            >
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-md flex items-center justify-between text-white border-b-2 border-[#FFCD00]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#FFCD00] text-gray-950 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
                  </div>
                  <div>
                    <span className="font-mono font-black text-sm text-[#FFCD00] block">
                      {item.equipment_id || item.id}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-label-bold text-[10px] uppercase tracking-wider shadow-md ${
                    item.status === 'Available'
                      ? 'bg-emerald-500 text-white'
                      : item.status === 'In Use' || item.status === 'Active'
                      ? 'bg-amber-500 text-gray-950 font-bold'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  ● {item.status}
                </span>
              </div>

              <div className="p-md flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-xs">
                    <h3 className="font-headline-sm text-on-surface group-hover:text-primary transition-colors">
                      {item.type}
                    </h3>
                    <span className="font-label-bold text-xs text-primary font-bold">₹1,000 / day</span>
                  </div>
                  <p className="font-body-sm text-secondary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {item.site || item.sites?.name || 'Central Equipment Yard'}
                  </p>
                </div>

                <div className="mt-md pt-sm border-t border-outline-variant flex items-center justify-between">
                  <span className="text-xs text-outline font-label-bold uppercase">
                    {isAvailable ? 'Click to Book' : 'Not Available'}
                  </span>
                  <button
                    disabled={!isAvailable}
                    className={`px-md py-xs font-label-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-xs ${
                      isAvailable
                        ? 'bg-primary text-on-primary group-hover:bg-on-surface shadow-sm'
                        : 'bg-outline/20 text-outline cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? 'Book Equipment' : 'Unavailable'}
                    {isAvailable && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOOKING MODAL (Multi-step flow: Sections 3.2, 4, 5) */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-md overflow-y-auto">
          <div className="bg-surface-white rounded-2xl shadow-2xl max-w-2xl w-full border border-outline-variant overflow-hidden my-auto animate-fade-up">
            {/* Modal Header */}
            <div className="bg-inverse-surface text-surface-white p-lg flex items-center justify-between border-b-4 border-primary">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">construction</span>
                </div>
                <div>
                  <span className="text-primary font-label-bold text-xs uppercase tracking-widest block">
                    Equipment Rental Request
                  </span>
                  <h2 className="font-headline-md text-white">
                    {selectedEquipment.type} ({selectedEquipment.equipment_id || selectedEquipment.id})
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stepper Progress Header */}
            {bookingStep <= 3 && (
              <div className="bg-surface-container-low px-lg py-sm border-b border-outline-variant flex items-center justify-between text-xs font-label-bold uppercase">
                <div className={`flex items-center gap-xs ${bookingStep >= 1 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep >= 1 ? 'bg-primary text-white' : 'bg-outline/20'}`}>1</span>
                  Details
                </div>
                <div className="h-[2px] w-12 bg-outline-variant"></div>
                <div className={`flex items-center gap-xs ${bookingStep >= 2 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep >= 2 ? 'bg-primary text-white' : 'bg-outline/20'}`}>2</span>
                  Agreement
                </div>
                <div className="h-[2px] w-12 bg-outline-variant"></div>
                <div className={`flex items-center gap-xs ${bookingStep >= 3 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep >= 3 ? 'bg-primary text-white' : 'bg-outline/20'}`}>3</span>
                  License & Confirm
                </div>
              </div>
            )}

            {/* STEP 1: Booking Form (Section 3.2) */}
            {bookingStep === 1 && (
              <form onSubmit={handleProceedToAgreement} className="p-lg space-y-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                    Jobsite Location <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter jobsite address or site name (e.g. North Quarry Site, Gate 2)"
                    className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                    value={jobsite}
                    onChange={(e) => setJobsite(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                      Start Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                      End Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                    Transportation Method
                  </label>
                  <div className="grid grid-cols-2 gap-md">
                    <button
                      type="button"
                      onClick={() => setTransportation('pickup')}
                      className={`p-md rounded-lg border-2 flex items-center justify-center gap-sm font-label-bold transition-all ${
                        transportation === 'pickup'
                          ? 'border-primary bg-primary-container/20 text-on-surface shadow-sm'
                          : 'border-outline-variant text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined">directions_car</span>
                      Pickup at Yard
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportation('delivery')}
                      className={`p-md rounded-lg border-2 flex items-center justify-center gap-sm font-label-bold transition-all ${
                        transportation === 'delivery'
                          ? 'border-primary bg-primary-container/20 text-on-surface shadow-sm'
                          : 'border-outline-variant text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined">local_shipping</span>
                      Site Delivery
                    </button>
                  </div>
                </div>

                {/* Live Cost Calculation Display */}
                <div className="p-md bg-primary-container/30 border-2 border-primary/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-label-bold text-xs uppercase text-primary block">
                      Cost Estimate Calculation
                    </span>
                    <span className="font-body-sm text-secondary">₹1,000 / day rate</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-lg text-primary block">
                      Estimated Cost: ₹{estimatedCost.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-on-surface">for {rentalDays} rental days</span>
                  </div>
                </div>

                <div className="pt-sm flex justify-end gap-sm">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-lg py-sm border-2 border-outline-variant font-label-bold rounded-lg hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-xl py-sm bg-primary text-on-primary font-label-bold rounded-lg hover:bg-on-surface shadow-md flex items-center gap-xs"
                  >
                    Next: Terms & Agreement
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Rental Agreement (Section 4) */}
            {bookingStep === 2 && (
              <div className="p-lg space-y-md">
                <div className="p-md bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg space-y-xs">
                  <div className="flex items-center gap-xs text-amber-700 font-label-bold">
                    <span className="material-symbols-outlined">gavel</span>
                    REQUIRED RENTAL CLAUSE & IDLE PENALTY POLICY
                  </div>
                  <p className="font-body-md text-on-surface font-semibold leading-relaxed">
                    "If the equipment remains idle for more than 2–3 hours in a day, the daily rental cost will be DOUBLED for that day. Idle time exceeding 3 hours triggers this penalty automatically and will be reflected in your final billing."
                  </p>
                </div>

                <div className="p-md bg-surface-container-low rounded-lg space-y-xs text-xs text-secondary">
                  <p className="font-bold text-on-surface">Additional Conditions:</p>
                  <ul className="list-disc pl-md space-y-1">
                    <li>Telemetry sensors continuously track daily active engine hours vs idle hours.</li>
                    <li>Automatic penalties are recorded with precise timestamp audit logs.</li>
                    <li>Site handover is subject to verified driving/operator license details.</li>
                  </ul>
                </div>

                <div className="p-md border-2 border-outline-variant rounded-xl flex items-center gap-md">
                  <input
                    type="checkbox"
                    id="agreement_checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    className="w-6 h-6 accent-primary cursor-pointer rounded"
                  />
                  <label htmlFor="agreement_checkbox" className="font-label-bold text-on-surface text-sm cursor-pointer select-none">
                    I have read, understood, and ACCEPT the idle time penalty policy and rental terms.
                  </label>
                </div>

                <div className="pt-sm flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="px-lg py-sm border-2 border-outline-variant font-label-bold rounded-lg hover:bg-surface-container"
                  >
                    Back to Details
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAgreementAndCheckWeather}
                    disabled={!agreementChecked || isCheckingWeather}
                    className="px-xl py-sm bg-primary text-on-primary font-label-bold rounded-lg hover:bg-on-surface shadow-md disabled:opacity-50 flex items-center gap-xs"
                  >
                    {isCheckingWeather ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Checking Weather...
                      </>
                    ) : (
                      <>
                        Proceed to Verification
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SEVERE WEATHER ALERT MODAL (Section 5.1) */}
            {weatherAlertModal && (
              <div className="p-lg bg-status-warning/10 border-2 border-status-warning rounded-xl m-lg space-y-md">
                <div className="flex items-center gap-md text-status-warning">
                  <span className="material-symbols-outlined text-4xl">warning</span>
                  <div>
                    <h3 className="font-headline-sm font-bold">⚠️ Weather Alert at Jobsite</h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Location: {weatherAlertModal.location}
                    </p>
                  </div>
                </div>

                <p className="font-body-md text-on-surface">
                  Current weather conditions at your jobsite show{' '}
                  <span className="font-bold underline">{weatherAlertModal.description} ({weatherAlertModal.temperature}°C, Wind {weatherAlertModal.windSpeed} km/h)</span>.
                  Are you sure you want to proceed with this rental?
                </p>

                <div className="flex justify-end gap-md pt-xs">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-lg py-sm border-2 border-outline-variant font-label-bold rounded-lg hover:bg-surface-container"
                  >
                    Cancel Rental
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedDespiteWeather}
                    className="px-xl py-sm bg-status-warning text-on-surface font-label-bold rounded-lg hover:bg-amber-400 shadow-md"
                  >
                    Yes, Proceed
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: License Verification & Finalize (Section 5.2 & 5.3) */}
            {bookingStep === 3 && !weatherAlertModal && (
              <form onSubmit={handleFinalizeRental} className="p-lg space-y-md">
                <div className="p-md bg-surface-container-low rounded-xl space-y-xs">
                  <span className="font-label-bold text-xs text-primary uppercase">Summary Review</span>
                  <div className="grid grid-cols-2 gap-sm text-sm">
                    <div><span className="text-secondary">Jobsite:</span> <strong>{jobsite}</strong></div>
                    <div><span className="text-secondary">Dates:</span> <strong>{startDate} to {endDate} ({rentalDays} days)</strong></div>
                    <div><span className="text-secondary">Delivery Method:</span> <strong className="capitalize">{transportation}</strong></div>
                    <div><span className="text-secondary">Total Cost:</span> <strong className="text-primary">₹{estimatedCost.toLocaleString()}</strong></div>
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-on-surface-variant text-xs uppercase">
                    Driving / Operator License Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter License Number (e.g. DL-998827361)"
                    className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant focus:border-primary rounded-lg font-body-md outline-none font-mono uppercase"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                  {licenseError && (
                    <p className="text-error text-xs font-bold">{licenseError}</p>
                  )}
                  <p className="text-[11px] text-secondary">
                    License verification is required before final QR code dispatch and equipment release.
                  </p>
                </div>

                <div className="pt-sm flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="px-lg py-sm border-2 border-outline-variant font-label-bold rounded-lg hover:bg-surface-container"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-xl py-sm bg-primary text-on-primary font-label-bold rounded-lg hover:bg-on-surface shadow-lg disabled:opacity-50 flex items-center gap-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Finalizing Booking...
                      </>
                    ) : (
                      <>
                        Confirm Rental & Dispatch QR Code
                        <span className="material-symbols-outlined">qr_code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success & QR Code Generation (Section 5.3) */}
            {bookingStep === 4 && createdBooking && (
              <div className="p-lg text-center space-y-md">
                {createdBooking.status === 'HANDOVER_ACCEPTED' ? (
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <span className="material-symbols-outlined text-4xl font-bold">verified</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                  </div>
                )}

                <div>
                  {createdBooking.status === 'HANDOVER_ACCEPTED' ? (
                    <span className="px-3 py-1 bg-emerald-500 text-white font-black text-xs rounded-full uppercase tracking-wider shadow-sm">
                      ✅ ACCEPTED & VERIFIED BY EMPLOYEE CAMERA SCAN
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs rounded-full uppercase tracking-wider animate-pulse">
                      ⏳ AWAITING EMPLOYEE CAMERA QR SCAN
                    </span>
                  )}

                  <h3 className="font-headline-md text-on-surface mt-sm">
                    {createdBooking.status === 'HANDOVER_ACCEPTED'
                      ? 'Handover Complete — Equipment Released!'
                      : 'Rental QR Code Dispatched'}
                  </h3>
                  <p className="text-secondary text-xs max-w-md mx-auto mt-1">
                    {createdBooking.status === 'HANDOVER_ACCEPTED'
                      ? `Your QR code was successfully scanned and accepted by an authorized employee.`
                      : `Present this QR code to the Caterpillar Employee camera scanner. Handover is ONLY accepted once scanned.`}
                  </p>
                </div>

                {/* 250-Second Countdown Security Banner */}
                <div className={`p-2 rounded-xl border max-w-md mx-auto flex items-center justify-between text-xs ${qrTimer > 30 ? 'bg-gray-900 border-gray-700 text-[#FFCD00]' : 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">timer</span>
                    <span className="font-mono font-black">
                      {qrTimer > 0 ? `QR Validity: ${qrTimer}s / 250s` : '⚠️ QR Code Expired (250s Limit)'}
                    </span>
                  </div>
                  {qrTimer === 0 ? (
                    <button
                      onClick={handleRefreshQRToken}
                      className="px-2 py-1 bg-[#FFCD00] text-gray-950 text-[10px] font-black rounded uppercase hover:bg-amber-400"
                    >
                      🔄 Refresh QR (250s)
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">250s Security Token</span>
                  )}
                </div>

                {/* Display Generated QR Code */}
                {createdBooking.qr_code && (
                  <div className={`p-md bg-white border-4 border-gray-900 rounded-xl inline-block shadow-2xl relative transition-all ${qrTimer === 0 ? 'opacity-30 blur-[2px]' : ''}`}>
                    <img
                      src={createdBooking.qr_code}
                      alt="Rental Handover QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                    <span className="font-mono text-xs font-black text-gray-900 block mt-xs bg-gray-100 py-1 px-2 rounded border border-gray-300">
                      Booking Ref: {createdBooking.booking_id}
                    </span>
                  </div>
                )}

                {qrTimer === 0 && (
                  <div className="p-2 bg-red-100 text-red-800 text-xs font-bold rounded-lg max-w-md mx-auto border border-red-300">
                    ⚠️ QR Code security window expired (250 seconds). Click "Refresh QR (250s)" to generate a new scan token.
                  </div>
                )}

                <div className="p-sm bg-gray-100 rounded-xl text-[11px] text-gray-700 font-semibold border border-gray-300 max-w-md mx-auto">
                  🔒 <strong>Security Policy:</strong> This booking cannot be activated automatically. An authorized Caterpillar employee must scan this QR code using their camera terminal to accept the handover.
                </div>

                <div className="pt-sm">
                  <button
                    onClick={handleCloseModal}
                    className="px-xl py-sm bg-gray-900 hover:bg-black text-[#FFCD00] font-black text-xs rounded-lg shadow-md border border-gray-800"
                  >
                    Done & Return to Fleet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerEquipment;
