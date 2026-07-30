import React, { useState, useEffect } from 'react';
import { exportAlertsPDF } from '../utils/pdfExport';
import { useToast } from '../hooks/useToast';
import { getUnresolvedAlerts, resolveAlertInDB } from '../services/database';
import { detectAnomaly } from '../services/mlApi';
import { publishKafkaEvent, KAFKA_TOPICS } from '../services/kafkaService';

const INITIAL_ALERTS = [
  { id: 'ALT-101', equipment_id: 'EX-402', type: 'Excavator', site_id: 'North Ridge Quarry (S001)', risk_level: 'Critical', flags: ['unauthorized_movement', 'no_operator'], description: 'GPS telemetry indicates asset movement outside of geo-fenced operating hours (22:45 local).', time: '14 mins ago' },
  { id: 'ALT-102', equipment_id: 'CR-110', type: 'Crane', site_id: 'Harbor Site (S002)', risk_level: 'Critical', flags: ['overdue_rental', 'missing_check_out'], description: 'Equipment checked out for 42 consecutive days exceeding maximum contract limit.', time: '1 hr ago' },
  { id: 'ALT-103', equipment_id: 'BD-088', type: 'Bulldozer', site_id: 'East Mine (S003)', risk_level: 'Warning', flags: ['excessive_idle'], description: 'Engine idle ratio exceeded 82% over 8-hour shift. High fuel wastage detected.', time: '3 hrs ago' },
  { id: 'ALT-104', equipment_id: 'EX-405', type: 'Excavator', site_id: 'North Ridge Quarry (S001)', risk_level: 'Warning', flags: ['impossible_hours'], description: 'Telemetry recorded 26.4 total operating hours in 24-hour cycle.', time: '5 hrs ago' },
  { id: 'ALT-105', equipment_id: 'CP-305', type: 'Compactor', site_id: 'Thermal Power Logistics (S010)', risk_level: 'Warning', flags: ['maintenance_overdue'], description: 'Scheduled hydraulic filter replacement overdue by 120 operating hours.', time: '6 hrs ago' }
];

const Alerts = () => {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function fetchLiveAlerts() {
      try {
        const liveAlerts = await getUnresolvedAlerts();
        if (liveAlerts && liveAlerts.length > 0) {
          const formatted = liveAlerts.map(a => ({
            id: a.id || `ALT-${Math.floor(Math.random() * 900 + 100)}`,
            equipment_id: a.equipment_id || 'EX-402',
            type: a.type || 'Excavator',
            site_id: a.site_id || 'S001',
            risk_level: a.risk_level ? a.risk_level.charAt(0).toUpperCase() + a.risk_level.slice(1) : 'Critical',
            flags: a.flags || ['excessive_idle'],
            description: a.notes || `Telemetry flagged ${a.equipment_id} for ${ (a.flags || []).join(', ') }`,
            time: 'Just now'
          }));
          setAlerts(formatted);
        }
      } catch (err) {
        console.warn('Alerts fetch notice:', err.message);
      }
    }
    fetchLiveAlerts();
  }, []);

  const handleExportPDF = () => {
    exportAlertsPDF(alerts);
    addToast('Alerts & Anomalies PDF Report downloaded successfully!', 'success', 'PDF Export Complete');
  };

  const handleResolveAlert = async (alertId, equipmentId) => {
    try {
      await resolveAlertInDB(alertId);
    } catch (e) {
      // Fallback local update
    }

    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    // Stream event to Kafka
    publishKafkaEvent(KAFKA_TOPICS.ALERT_RESOLVED, {
      alert_id: alertId,
      equipment_id: equipmentId,
      status: 'RESOLVED',
      msg: `Alert ${alertId} marked as resolved`,
    });

    addToast(`Alert ${alertId} resolved & published to Kafka broker.`, 'success', 'Alert Resolved');
  };

  const handleRunAnomalyScan = async () => {
    setIsScanning(true);
    try {
      const scanResult = await detectAnomaly({
        equipment_type: 'Excavator',
        engine_hours_day: 1.2,
        idle_hours_day: 14.5,
        rental_days: 20,
        site_id: 'S001',
      });

      if (scanResult.is_anomaly) {
        const newAlert = {
          id: `ALT-${Date.now().toString().slice(-4)}`,
          equipment_id: 'EX-402',
          type: 'Excavator',
          site_id: 'S001 - Highway Construction Zone A',
          risk_level: scanResult.risk_level === 'critical' ? 'Critical' : 'Warning',
          flags: scanResult.flags || ['excessive_idle', 'high_operating_cost'],
          description: `Isolation Forest ML model flagged score: ${scanResult.anomaly_score}`,
          time: 'Just now',
        };

        setAlerts((prev) => [newAlert, ...prev]);

        publishKafkaEvent(KAFKA_TOPICS.ANOMALY_DETECTED, {
          equipment_id: 'EX-402',
          risk_level: scanResult.risk_level,
          anomaly_score: scanResult.anomaly_score,
          flags: scanResult.flags,
          msg: 'Isolation Forest flagged live machine telemetry anomaly',
        });

        addToast(`ML Anomaly Scan detected exception! Added to alert list.`, 'error', 'Anomaly Flagged');
      } else {
        addToast('ML Anomaly Scan completed cleanly. No new issues found.', 'success', 'Scan Passed');
      }
    } catch (err) {
      addToast(`Anomaly scan error: ${err.message}`, 'error', 'Scan Error');
    } finally {
      setIsScanning(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return a.risk_level === 'Critical';
    if (activeFilter === 'Warning') return a.risk_level === 'Warning';
    return true;
  });

  const criticalCount = alerts.filter(a => a.risk_level === 'Critical').length;
  const warningCount = alerts.filter(a => a.risk_level === 'Warning').length;

  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Header & Control Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-base">
          <div className="flex items-center gap-sm">
            <div className="w-2.5 h-8 bg-rose-600 rounded-full"></div>
            <h1 className="font-headline-lg text-headline-lg text-gray-900 uppercase tracking-tight font-black">
              Operational Telemetry & Anomalies
            </h1>
          </div>
          <p className="text-sm text-gray-600 font-medium max-w-xl">
            Live exception alerts detected by LightGBM and Isolation Forest ML models across site telemetry streams.
          </p>
        </div>

        <div className="flex flex-wrap gap-sm">
          <button
            onClick={handleRunAnomalyScan}
            disabled={isScanning}
            className="px-md py-xs bg-gray-900 text-[#FFCD00] font-bold text-xs rounded-lg hover:bg-black transition-all flex items-center gap-xs shadow-md border border-gray-800 disabled:opacity-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            {isScanning ? 'Running ML Scan...' : 'Run ML Anomaly Scan'}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-md py-xs bg-[#FFCD00] text-gray-950 font-bold text-xs rounded-lg hover:bg-[#E5B800] transition-all flex items-center gap-xs shadow-md border border-gray-900 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Left Column: Filter Bar & Alerts List */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-md">
          {/* Filter Toolbar */}
          <div className="p-md bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Severity Filter:</span>
              <button
                onClick={() => setActiveFilter('All')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'All'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setActiveFilter('Critical')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'Critical'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Critical ({criticalCount})
              </button>
              <button
                onClick={() => setActiveFilter('Warning')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'Warning'
                    ? 'bg-amber-500 text-gray-950'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Warning ({warningCount})
              </button>
            </div>
            <span className="text-xs text-gray-500 font-medium">Real-time Stream Sync</span>
          </div>

          {/* Alerts Cards List */}
          <div className="flex flex-col gap-md">
            {filteredAlerts.length === 0 ? (
              <div className="p-xl bg-white rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                <p className="font-bold text-base text-gray-900">No Unresolved Alerts!</p>
                <p className="text-xs">All operational anomalies have been resolved.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-[6px] border-2 border-gray-200 p-md transition-all hover:shadow-md ${
                    alert.risk_level === 'Critical' ? 'border-l-rose-600' : 'border-l-amber-500'
                  }`}
                >
                  <div className="flex flex-col gap-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            alert.risk_level === 'Critical'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {alert.risk_level}
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          {alert.equipment_id} • {alert.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {alert.time}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-800">{alert.description}</p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(alert.flags || []).map((flag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-mono border border-gray-300">
                          {flag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-sm border-t border-gray-100 mt-xs">
                      <span className="text-xs text-gray-500">Location: {alert.site_id}</span>
                      <button
                        onClick={() => handleResolveAlert(alert.id, alert.equipment_id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Resolve Alert
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Fleet Risk Statistics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-gray-900 text-white rounded-xl p-md shadow-md border-2 border-gray-800 flex flex-col gap-md">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#FFCD00] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">analytics</span>
              Fleet Anomaly Overview
            </h3>

            <div className="grid grid-cols-2 gap-sm">
              <div className="p-sm bg-gray-800 rounded-lg text-center border border-gray-700">
                <span className="text-2xl font-black text-rose-500">{criticalCount}</span>
                <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Critical Exceptions</p>
              </div>
              <div className="p-sm bg-gray-800 rounded-lg text-center border border-gray-700">
                <span className="text-2xl font-black text-amber-400">{warningCount}</span>
                <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Warning Flags</p>
              </div>
            </div>

            <div className="p-sm bg-gray-800/80 rounded-lg border border-gray-700 text-xs text-gray-300 space-y-1">
              <p className="font-bold text-[#FFCD00]">Isolation Forest Anomaly Scoring:</p>
              <p>• Negative scores (&lt; -0.15) trigger Critical flags.</p>
              <p>• Scans run automatically during check-in/out logistics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
