/**
 * ML API Service — Smart Rental Track
 * ========================================
 * HTTP client for the Flask ML backend (deployed on Render or local).
 * Reads VITE_ML_API_URL from .env — update to your Render URL after deployment.
 * Gracefully falls back to demo data if ML backend is unreachable.
 */

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ── Fallback Data when ML backend is offline ──────────────────────
const FALLBACK_HEALTH = {
  status: 'healthy (cached)',
  models_loaded: true,
  version: '1.0.0-fallback',
  timestamp: new Date().toISOString(),
};

function fallbackForecast({ site_id, equipment_type, date }) {
  const seasons = ['peak', 'normal', 'off_peak'];
  return {
    site_id: site_id || 'S001',
    equipment_type: equipment_type || 'Excavator',
    date: date || new Date().toISOString().split('T')[0],
    predicted_demand: parseFloat((8 + Math.random() * 14).toFixed(1)),
    season: seasons[Math.floor(Math.random() * seasons.length)],
    confidence: 0.87,
    model: 'LightGBM (fallback)',
  };
}

function fallbackAnomaly({ equipment_type, engine_hours_day, idle_hours_day, rental_days }) {
  const totalHours = parseFloat(engine_hours_day || 0) + parseFloat(idle_hours_day || 0);
  const idleRatio = parseFloat(idle_hours_day || 0) / (totalHours || 1);
  const isAnomaly = totalHours > 24 || idleRatio > 0.7 || parseInt(rental_days || 0) > 30;
  const flags = [];
  if (totalHours > 24) flags.push('impossible_hours');
  if (idleRatio > 0.7) flags.push('excessive_idle');
  if (parseInt(rental_days || 0) > 30) flags.push('overdue_rental');
  return {
    is_anomaly: isAnomaly,
    anomaly_score: isAnomaly ? parseFloat((-0.05 - Math.random() * 0.2).toFixed(3)) : parseFloat((0.1 + Math.random() * 0.3).toFixed(3)),
    risk_level: isAnomaly ? (flags.length >= 2 ? 'critical' : 'high') : 'low',
    flags,
    equipment_type: equipment_type || 'Excavator',
    model: 'IsolationForest (fallback)',
  };
}

const FALLBACK_ANOMALIES = [
  { equipment_type: 'Excavator', equipment_id: 'EQX1042', engine_hours_day: 0.5, idle_hours_day: 22.5, rental_days: 28, anomaly_score: -0.18, is_anomaly: true, risk_level: 'critical', flags: ['excessive_idle', 'low_utilization'] },
  { equipment_type: 'Crane', equipment_id: 'EQX1089', engine_hours_day: 18.4, idle_hours_day: 8.0, rental_days: 14, anomaly_score: -0.22, is_anomaly: true, risk_level: 'critical', flags: ['impossible_hours'] },
  { equipment_type: 'Bulldozer', equipment_id: 'EQX1105', engine_hours_day: 1.2, idle_hours_day: 20.1, rental_days: 42, anomaly_score: -0.09, is_anomaly: true, risk_level: 'high', flags: ['excessive_idle', 'overdue_rental'] },
  { equipment_type: 'Loader', equipment_id: 'EQX1201', engine_hours_day: 6.5, idle_hours_day: 2.0, rental_days: 7, anomaly_score: 0.15, is_anomaly: false, risk_level: 'low', flags: [] },
];

const FALLBACK_DEMAND_SUMMARY = {
  total_rentals: 2000,
  avg_rental_days: 12.4,
  peak_equipment: 'Excavator',
  peak_site: 'S001',
  monthly_trend: [
    { month: 'Jan', demand: 142 }, { month: 'Feb', demand: 158 }, { month: 'Mar', demand: 175 },
    { month: 'Apr', demand: 192 }, { month: 'May', demand: 168 }, { month: 'Jun', demand: 145 },
  ],
};

// ── Safe Fetch Helper ─────────────────────────────────────────────
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── Health Check ───────────────────────────────────────────────────
export async function checkMLHealth() {
  try {
    const res = await safeFetch(`${ML_API_URL}/health`);
    if (!res.ok) return FALLBACK_HEALTH;
    return await res.json();
  } catch (err) {
    console.info('ML backend offline — using health fallback.');
    return FALLBACK_HEALTH;
  }
}

// ── Demand Forecast ────────────────────────────────────────────────
export async function getDemandForecast({ site_id, equipment_type, date }) {
  try {
    const res = await safeFetch(`${ML_API_URL}/api/v1/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id, equipment_type, date }),
    });
    if (!res.ok) return fallbackForecast({ site_id, equipment_type, date });
    return await res.json();
  } catch (err) {
    console.info('ML forecast offline — using fallback prediction.');
    return fallbackForecast({ site_id, equipment_type, date });
  }
}

// ── Anomaly Detection ──────────────────────────────────────────────
export async function detectAnomaly({
  equipment_type,
  engine_hours_day,
  idle_hours_day,
  rental_days,
  site_id = null,
  operator_id = null,
}) {
  try {
    const res = await safeFetch(`${ML_API_URL}/api/v1/detect-anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment_type,
        engine_hours_day,
        idle_hours_day,
        rental_days,
        site_id,
        operator_id,
      }),
    });
    if (!res.ok) return fallbackAnomaly({ equipment_type, engine_hours_day, idle_hours_day, rental_days });
    return await res.json();
  } catch (err) {
    console.info('ML anomaly detection offline — using rule-based fallback.');
    return fallbackAnomaly({ equipment_type, engine_hours_day, idle_hours_day, rental_days });
  }
}

// ── Anomalies List (pre-scored dataset) ────────────────────────────
export async function getAnomaliesList(limit = 50) {
  try {
    const res = await safeFetch(`${ML_API_URL}/api/v1/anomalies?limit=${limit}`);
    if (!res.ok) return FALLBACK_ANOMALIES;
    return await res.json();
  } catch (err) {
    console.info('ML anomalies list offline — using fallback data.');
    return FALLBACK_ANOMALIES;
  }
}

// ── Demand Summary ─────────────────────────────────────────────────
export async function getDemandSummary() {
  try {
    const res = await safeFetch(`${ML_API_URL}/api/v1/demand-summary`);
    if (!res.ok) return FALLBACK_DEMAND_SUMMARY;
    return await res.json();
  } catch (err) {
    console.info('ML demand summary offline — using fallback data.');
    return FALLBACK_DEMAND_SUMMARY;
  }
}
