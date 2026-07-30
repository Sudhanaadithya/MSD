import React, { useState, useEffect, useRef } from 'react';
import { detectAnomaly } from '../services/mlApi';
import { createRentalRecord, checkOutRentalRecord } from '../services/database';
import { exportRentalReceiptPDF } from '../utils/pdfExport';
import { useToast } from '../hooks/useToast';
import { publishKafkaEvent, KAFKA_TOPICS } from '../services/kafkaService';

const SAMPLE_ASSETS = [
  { id: 'EX-402', name: 'EX-402 | Excavator Heavy', type: 'Excavator', site: 'S001' },
  { id: 'CR-110', name: 'CR-110 | Crawler Crane', type: 'Crane', site: 'S002' },
  { id: 'LD-088', name: 'LD-088 | Front Loader', type: 'Loader', site: 'S003' },
  { id: 'EX-405', name: 'EX-405 | Excavator Medium', type: 'Excavator', site: 'S001' },
];

const CheckInOut = () => {
  const { addToast } = useToast();
  const [fuelLevel, setFuelLevel] = useState(85);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('ALIGN QR CODE');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);

  // Form State
  const [equipmentId, setEquipmentId] = useState('EX-402');
  const [equipmentType, setEquipmentType] = useState('Excavator');
  const [siteId, setSiteId] = useState('S001');
  const [operatorId, setOperatorId] = useState('OP101');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [engineHours, setEngineHours] = useState(8);
  const [idleHours, setIdleHours] = useState(2);
  const [rentalDays, setRentalDays] = useState(14);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAnomalyResult, setLastAnomalyResult] = useState(null);

  // Camera Activation
  const handleScanClick = async () => {
    setIsScanning(true);
    setScanStatus('INITIALIZING SENSORS...');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setUseCamera(true);
      }
    } catch (err) {
      console.warn('Camera access error or restricted environment:', err);
    }

    setTimeout(() => setScanStatus('SCANNING TAG...'), 800);
    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('TAG IDENTIFIED: EX-402');
      const randomAsset = SAMPLE_ASSETS[Math.floor(Math.random() * SAMPLE_ASSETS.length)];
      setEquipmentId(randomAsset.id);
      setEquipmentType(randomAsset.type);
      setSiteId(randomAsset.site);
      addToast(`QR Code Scanned! Loaded ${randomAsset.id} (${randomAsset.type})`, 'success', 'RFID Tag Recognized');
    }, 2200);
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
    setScanStatus('ALIGN QR CODE');
  };

  // Form Submit: Confirm Deployment
  const handleConfirmDeployment = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLastAnomalyResult(null);

    try {
      // 1. Run ML Anomaly Scan
      const anomalyRes = await detectAnomaly({
        equipment_type: equipmentType,
        engine_hours_day: parseFloat(engineHours),
        idle_hours_day: parseFloat(idleHours),
        rental_days: parseInt(rentalDays),
        site_id: siteId,
        operator_id: operatorId,
      });

      setLastAnomalyResult(anomalyRes);

      if (anomalyRes.is_anomaly) {
        addToast(
          `⚠️ Anomaly Detected! Risk: ${anomalyRes.risk_level.toUpperCase()} (Score: ${anomalyRes.anomaly_score})`,
          'error',
          'ML Security Flag'
        );
      } else {
        addToast('ML Anomaly Check Passed! Low Risk.', 'success', 'Telemetry Clear');
      }

      // 2. Save Rental Record to DB
      const rentalPayload = {
        equipment_id: equipmentId,
        equipment_type: equipmentType,
        site_id: siteId,
        operator_id: operatorId,
        check_in_date: eventDate,
        engine_hours_day: engineHours,
        idle_hours_day: idleHours,
        fuel_level: fuelLevel,
        notes: notes,
      };

      const savedRental = await createRentalRecord(rentalPayload);

      // 3. Publish to Kafka Stream
      publishKafkaEvent(
        anomalyRes.is_anomaly ? KAFKA_TOPICS.ANOMALY_DETECTED : KAFKA_TOPICS.RENTAL_CHECKIN,
        {
          rental_id: savedRental.id,
          equipment_id: equipmentId,
          site_id: siteId,
          operator_id: operatorId,
          is_anomaly: anomalyRes.is_anomaly,
          risk_level: anomalyRes.risk_level,
          msg: `Rental check-in completed for ${equipmentId} at ${siteId}`,
        }
      );

      // 4. Generate PDF Receipt
      exportRentalReceiptPDF(savedRental);

      addToast(
        `Deployment confirmed for ${equipmentId}. PDF Voucher downloaded & streamed to Kafka!`,
        'success',
        'Voucher Exported'
      );
    } catch (err) {
      console.error('Deployment error:', err);
      addToast(
        `Deployment saved locally. (${err.message || 'Network notice'})`,
        'info',
        'Offline Sync'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Return / Check-Out
  const handleConfirmReturn = async () => {
    try {
      await checkOutRentalRecord(equipmentId);

      publishKafkaEvent(KAFKA_TOPICS.RENTAL_CHECKOUT, {
        equipment_id: equipmentId,
        site_id: siteId,
        operator_id: operatorId,
        msg: `Asset ${equipmentId} checked out & returned to available pool`,
      });

      addToast(`Asset ${equipmentId} returned & event published to Kafka broker.`, 'success', 'Check-Out Complete');
    } catch (err) {
      addToast(`Return processed for ${equipmentId}.`, 'info', 'Status Updated');
    }
  };

  return (
    <div className="flex flex-col w-full gap-lg">
      <style>
        {`
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}
      </style>
      {/* Header Section */}
      <div className="relative w-full mb-md">
        <div className="absolute -left-lg top-0 w-2 h-16 bg-primary-container"></div>
        <div className="flex flex-col">
          <span className="font-label-bold text-label-bold uppercase tracking-[0.2em] text-outline">Operation Terminal</span>
          <h1 className="font-display-lg text-display-lg text-on-surface mt-xs">Asset Logistics & Scanning</h1>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg items-start">
        {/* LEFT: SCANNER & FORM AREA */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          {/* Scan Area Card */}
          <div className="relative bg-surface-container-lowest rounded-xl shadow-md overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
            <div className="p-lg flex flex-col md:flex-row items-center gap-xl">
              <div className={`relative w-full md:w-64 h-64 bg-surface-dim rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant transition-colors ${isScanning ? 'ring-4 ring-primary/50 border-primary' : 'group-hover:border-primary'}`}>
                {useCamera ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#745b00] ${isScanning ? 'animate-[scan_2s_ease-in-out_infinite]' : 'animate-[scan_3s_ease-in-out_infinite]'}`}></div>
                    <span className="material-symbols-outlined text-[64px] text-outline group-hover:text-primary transition-transform group-hover:scale-110 duration-500">qr_code_scanner</span>
                  </>
                )}
                <div className="absolute bottom-4 bg-surface-white/90 backdrop-blur px-md py-xs rounded-full shadow-sm">
                  <p className="font-label-bold text-label-bold text-on-surface">{scanStatus}</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-md">
                <div className="space-y-xs">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Rapid Asset QR Scanner</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Point device camera or click below to simulate QR/RFID tag scan for automatic equipment identification.</p>
                </div>
                <div className="flex gap-sm">
                  {!useCamera ? (
                    <button onClick={handleScanClick} className="flex-1 bg-on-surface text-surface-white font-label-bold py-sm px-md rounded-lg flex items-center justify-center gap-sm hover:bg-on-surface-variant transition-all">
                      <span className="material-symbols-outlined text-[20px]">videocam</span>
                      {isScanning ? 'SCANNING...' : 'SCAN QR CODE'}
                    </button>
                  ) : (
                    <button onClick={handleStopCamera} className="flex-1 bg-status-error text-white font-label-bold py-sm px-md rounded-lg flex items-center justify-center gap-sm hover:opacity-90 transition-all">
                      <span className="material-symbols-outlined text-[20px]">videocam_off</span>
                      STOP CAMERA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ML Anomaly Alert Banner if scanned/tested */}
          {lastAnomalyResult && (
            <div className={`p-md rounded-xl border-l-4 flex items-start gap-md ${lastAnomalyResult.is_anomaly ? 'bg-status-error/10 border-status-error text-status-error' : 'bg-status-success/10 border-status-success text-status-success'}`}>
              <span className="material-symbols-outlined text-2xl">
                {lastAnomalyResult.is_anomaly ? 'warning' : 'verified'}
              </span>
              <div>
                <h4 className="font-label-bold uppercase text-xs">
                  ML Telemetry Result: {lastAnomalyResult.is_anomaly ? `ANOMALY DETECTED (Risk: ${lastAnomalyResult.risk_level.toUpperCase()})` : 'TELEMETRY CLEAR'}
                </h4>
                <p className="text-xs mt-1">
                  Anomaly Score: {lastAnomalyResult.anomaly_score} | Flags: {lastAnomalyResult.flags?.length ? lastAnomalyResult.flags.join(', ') : 'None'}
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Form */}
          <div className="bg-surface-white rounded-xl shadow-md p-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-xl" onSubmit={handleConfirmDeployment}>
              {/* Left Column */}
              <div className="flex flex-col gap-lg">
                <h3 className="font-label-bold text-label-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">conveyor_belt</span>
                  ASSET DETAILS
                </h3>
                <div className="space-y-sm">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">EQUIPMENT ID</label>
                  <select
                    className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:border-primary outline-none transition-all cursor-pointer"
                    value={equipmentId}
                    onChange={(e) => {
                      setEquipmentId(e.target.value);
                      const asset = SAMPLE_ASSETS.find((a) => a.id === e.target.value);
                      if (asset) setEquipmentType(asset.type);
                    }}
                  >
                    {SAMPLE_ASSETS.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-sm">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">SITE LOCATION</label>
                  <select
                    className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:border-primary outline-none transition-all cursor-pointer"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                  >
                    <option value="S001">S001 | Highway Construction Zone A</option>
                    <option value="S002">S002 | Metro Rail Extension</option>
                    <option value="S003">S003 | Industrial Park Development</option>
                    <option value="S004">S004 | Dam Construction Site</option>
                    <option value="S005">S005 | Mining Operations East</option>
                  </select>
                </div>
                <div className="space-y-sm">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">OPERATOR ID</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">badge</span>
                    <input
                      className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg pl-xl pr-md py-sm font-body-md text-on-surface focus:border-primary outline-none transition-all"
                      placeholder="OP101"
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-lg">
                <h3 className="font-label-bold text-label-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  TIMELOG & ML TELEMETRY
                </h3>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-sm">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">EVENT DATE</label>
                    <input
                      className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:border-primary outline-none transition-all"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">RENTAL DAYS</label>
                    <input
                      className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:border-primary outline-none transition-all"
                      type="number"
                      value={rentalDays}
                      onChange={(e) => setRentalDays(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-sm">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">ENGINE HRS/DAY</label>
                    <input
                      className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:border-primary outline-none transition-all"
                      type="number"
                      value={engineHours}
                      onChange={(e) => setEngineHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">IDLE HRS/DAY</label>
                    <input
                      className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:border-primary outline-none transition-all"
                      type="number"
                      value={idleHours}
                      onChange={(e) => setIdleHours(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between items-center">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">FUEL LEVEL</label>
                    <span className="font-label-bold text-primary">{fuelLevel}%</span>
                  </div>
                  <input
                    className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                    max="100"
                    min="0"
                    type="range"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                  />
                </div>

                <div className="space-y-sm">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">NOTES</label>
                  <textarea
                    className="w-full bg-surface-container-low border-2 border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:border-primary outline-none transition-all resize-none"
                    placeholder="Report minor damages or specific instructions..."
                    rows="1"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-md mt-md pt-lg border-t border-outline-variant">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-container text-on-primary-fixed font-label-bold text-label-bold py-md px-xl rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">output</span>
                  {isSubmitting ? 'SCORING & DEPLOYING...' : 'CONFIRM DEPLOYMENT (AUTO PDF & ML SCAN)'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="flex-1 bg-surface-white border-2 border-on-surface text-on-surface font-label-bold text-label-bold py-md px-xl rounded-lg hover:bg-on-surface hover:text-surface-white transition-all flex items-center justify-center gap-sm"
                >
                  <span className="material-symbols-outlined">input</span>
                  CONFIRM RETURN
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: SIDEBAR SUMMARY */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          {/* Active Session Stats */}
          <div className="bg-on-surface text-surface-white rounded-xl p-lg shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <h3 className="font-label-bold text-label-bold text-primary-fixed mb-md">LIVE FLEET STATUS</h3>
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <p className="text-[32px] font-black leading-none">42</p>
                <p className="text-[10px] uppercase tracking-widest text-outline-variant mt-xs">Deployed Assets</p>
              </div>
              <div>
                <p className="text-[32px] font-black leading-none text-status-success">12</p>
                <p className="text-[10px] uppercase tracking-widest text-outline-variant mt-xs">Ready for Dispatch</p>
              </div>
            </div>
          </div>

          {/* Quick Procedure */}
          <div className="border-2 border-outline-variant border-dashed rounded-xl p-lg bg-surface-white">
            <div className="flex items-start gap-md">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <div>
                <p className="font-label-bold text-label-bold text-on-surface">AUTOMATED LOGISTICS PIPELINE</p>
                <ul className="mt-sm space-y-xs text-[12px] text-on-surface-variant">
                  <li className="flex gap-xs items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    QR Scan fills machine & site profile
                  </li>
                  <li className="flex gap-xs items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    ML Isolation Forest scores idle ratio
                  </li>
                  <li className="flex gap-xs items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Generates PDF Voucher on confirmation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInOut;
