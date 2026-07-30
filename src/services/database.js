/**
 * Database Service — Smart Rental Track
 * ==========================================
 * Supabase query functions that the AI Agent and Frontend components invoke.
 * Gracefully handles missing tables (PGRST205 / 404) with structured fallback data.
 */

import { supabase } from '../utils/supabase';

// ── Sample Mock Data for Fallback ──────────────────────────────────
const MOCK_EQUIPMENT = [
  { equipment_id: 'EX-402', id: 'EX-402', type: 'Excavator', status: 'Active', site: 'North Ridge Quarry', sites: { name: 'North Ridge Quarry' }, rentalDays: '14 Days', operator: 'John D.' },
  { equipment_id: 'CR-110', id: 'CR-110', type: 'Crane', status: 'Overdue', site: 'Harbor Site', sites: { name: 'Harbor Site' }, rentalDays: '42 Days', operator: 'Marcus K.' },
  { equipment_id: 'BD-088', id: 'BD-088', type: 'Bulldozer', status: 'Idle', site: 'East Mine', sites: { name: 'East Mine' }, rentalDays: '--', operator: 'Unassigned' },
  { equipment_id: 'EX-405', id: 'EX-405', type: 'Excavator', status: 'Active', site: 'North Ridge Quarry', sites: { name: 'North Ridge Quarry' }, rentalDays: '5 Days', operator: 'Sarah L.' },
  { equipment_id: 'LD-099', id: 'LD-099', type: 'Loader', status: 'Available', site: 'Sector 7 Expansion', sites: { name: 'Sector 7 Expansion' }, rentalDays: '--', operator: 'Unassigned' },
];

const MOCK_RENTALS = [
  { id: 'R-1001', equipment_id: 'EX-402', site_id: 'S001', operator_id: 'OP101', check_in_date: '2025-03-01', engine_hours_day: 8.5, idle_hours_day: 1.2, equipment: { type: 'Excavator', status: 'Active' }, sites: { name: 'Highway Zone A' }, operators: { name: 'John D.' } },
  { id: 'R-1002', equipment_id: 'CR-110', site_id: 'S002', operator_id: 'OP102', check_in_date: '2025-02-15', engine_hours_day: 6.0, idle_hours_day: 4.5, equipment: { type: 'Crane', status: 'Overdue' }, sites: { name: 'Metro Extension' }, operators: { name: 'Marcus K.' } },
  { id: 'R-1003', equipment_id: 'EX-405', site_id: 'S001', operator_id: 'OP103', check_in_date: '2025-03-05', engine_hours_day: 7.2, idle_hours_day: 0.8, equipment: { type: 'Excavator', status: 'Active' }, sites: { name: 'Highway Zone A' }, operators: { name: 'Sarah L.' } },
];

const MOCK_ALERTS = [
  { id: 'ALT-101', equipment_id: 'EX-402', site_id: 'S001', risk_level: 'critical', anomaly_score: -0.18, flags: ['unauthorized_movement', 'no_operator'], is_resolved: false, created_at: new Date().toISOString() },
  { id: 'ALT-102', equipment_id: 'CR-110', site_id: 'S002', risk_level: 'critical', anomaly_score: -0.22, flags: ['overdue_rental', 'missing_check_out'], is_resolved: false, created_at: new Date().toISOString() },
  { id: 'ALT-103', equipment_id: 'BD-088', site_id: 'S003', risk_level: 'medium', anomaly_score: -0.04, flags: ['excessive_idle'], is_resolved: false, created_at: new Date().toISOString() },
];

const MOCK_SITES = [
  { site_id: 'S001', name: 'Highway Construction Zone A', location: 'Chennai, TN', is_active: true },
  { site_id: 'S002', name: 'Metro Rail Extension', location: 'Bangalore, KA', is_active: true },
  { site_id: 'S003', name: 'Industrial Park Development', location: 'Hyderabad, TS', is_active: true },
  { site_id: 'S004', name: 'Dam Construction Site', location: 'Pune, MH', is_active: true },
  { site_id: 'S005', name: 'Mining Operations East', location: 'Ranchi, JH', is_active: true },
];

const MOCK_DRIVERS = [
  { driver_id: 'DRV-101', name: 'Rajesh Kumar', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43210' },
  { driver_id: 'DRV-102', name: 'Suresh Verma', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43211' },
  { driver_id: 'DRV-103', name: 'Vikram Singh', status: 'assigned', assigned_booking_id: 'BK-SAMPLE-01', phone: '+91 98765 43212' },
  { driver_id: 'DRV-104', name: 'Amit Patel', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43213' },
  { driver_id: 'DRV-105', name: 'Dinesh Sharma', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43214' },
];

const MOCK_BOOKINGS = [
  {
    booking_id: 'BK-SAMPLE-01',
    id: 'BK-SAMPLE-01',
    equipment_id: 'EX-402',
    customer_id: 'usr_customer1',
    customer_name: 'Jane Doe',
    customer_email: 'jane@contractor.com',
    jobsite: 'North Quarry Site, Gate 2',
    start_date: '2025-04-01',
    end_date: '2025-04-05',
    transportation_type: 'delivery',
    estimated_cost: 4000,
    agreement_accepted: true,
    agreement_timestamp: '2025-03-28T10:30:00Z',
    license_number: 'DL-998827361',
    weather_confirmed: true,
    status: 'confirmed', // pending | confirmed | active | completed | overdue
    qr_code: 'data:image/png;base64,sample',
    driver_id: 'DRV-103',
    created_at: '2025-03-28T10:30:00Z',
  },
  {
    booking_id: 'BK-SAMPLE-02',
    id: 'BK-SAMPLE-02',
    equipment_id: 'CR-110',
    customer_id: 'usr_customer1',
    customer_name: 'Jane Doe',
    customer_email: 'jane@contractor.com',
    jobsite: 'Harbor Expansion, Dock 4',
    start_date: '2025-03-10',
    end_date: '2025-03-20',
    transportation_type: 'pickup',
    estimated_cost: 10000,
    agreement_accepted: true,
    agreement_timestamp: '2025-03-08T14:15:00Z',
    license_number: 'DL-998827361',
    weather_confirmed: true,
    status: 'active',
    qr_code: 'data:image/png;base64,sample',
    driver_id: null,
    created_at: '2025-03-08T14:15:00Z',
  }
];

const MOCK_NOTIFICATIONS = [
  {
    notification_id: 'NOTIF-01',
    id: 'NOTIF-01',
    type: 'delivery_request',
    booking_id: 'BK-SAMPLE-01',
    customer_name: 'Jane Doe',
    equipment_id: 'EX-402',
    jobsite: 'North Quarry Site, Gate 2',
    start_date: '2025-04-01',
    end_date: '2025-04-05',
    status: 'pending', // pending | driver_assigned
    created_at: '2025-03-28T10:30:00Z',
  }
];

const MOCK_COMPLAINTS = [
  {
    complaint_id: 'CMP-101',
    id: 'CMP-101',
    customer_id: 'usr_customer1',
    customer_name: 'Jane Doe',
    booking_id: 'BK-SAMPLE-02',
    equipment_id: 'CR-110',
    category: 'Equipment Breakdown / Malfunction',
    description: 'Crane hydraulic pressure is fluctuating dangerously during heavy lifting operations.',
    status: 'open', // open | in_progress | resolved
    created_at: '2025-03-15T09:20:00Z',
  }
];

// Helper to check if error is table missing (PGRST205 / 404)
function isMissingTableError(error) {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.status === 404 ||
    error.message?.includes('schema cache') ||
    error.message?.includes('does not exist')
  );
}

// ── Equipment ──────────────────────────────────────────────────────
export async function getEquipmentList(filters = {}) {
  try {
    let query = supabase
      .from('equipment')
      .select('*, sites(name)')
      .order('equipment_id');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.site_id) query = query.eq('current_site_id', filters.site_id);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) {
        console.info('Supabase table missing (equipment) — using structured fleet fallback data.');
        return MOCK_EQUIPMENT;
      }
      throw error;
    }
    return data && data.length > 0 ? data : MOCK_EQUIPMENT;
  } catch (err) {
    console.warn('getEquipmentList fallback active:', err.message);
    return MOCK_EQUIPMENT;
  }
}

export async function getEquipmentById(equipmentId) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name, location)')
      .eq('equipment_id', equipmentId)
      .single();

    if (error) {
      const match = MOCK_EQUIPMENT.find((e) => e.equipment_id === equipmentId || e.id === equipmentId);
      return match || MOCK_EQUIPMENT[0];
    }
    return data;
  } catch (err) {
    const match = MOCK_EQUIPMENT.find((e) => e.equipment_id === equipmentId || e.id === equipmentId);
    return match || MOCK_EQUIPMENT[0];
  }
}

// ── Rentals ────────────────────────────────────────────────────────
export async function getActiveRentals(filters = {}) {
  try {
    let query = supabase
      .from('rentals')
      .select('*, equipment(type, status), sites(name), operators(name)')
      .is('check_out_date', null)
      .order('check_in_date', { ascending: false });

    if (filters.site_id) query = query.eq('site_id', filters.site_id);
    if (filters.equipment_id) query = query.eq('equipment_id', filters.equipment_id);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) {
        console.info('Supabase table missing (rentals) — using active rentals fallback data.');
        return MOCK_RENTALS;
      }
      throw error;
    }
    return data && data.length > 0 ? data : MOCK_RENTALS;
  } catch (err) {
    console.warn('getActiveRentals fallback active:', err.message);
    return MOCK_RENTALS;
  }
}

export async function createRentalRecord(rental) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .insert([
        {
          equipment_id: rental.equipment_id,
          site_id: rental.site_id || 'S001',
          operator_id: rental.operator_id || 'OP101',
          check_in_date: rental.check_in_date || new Date().toISOString().split('T')[0],
          engine_hours_day: parseFloat(rental.engine_hours_day || 8),
          idle_hours_day: parseFloat(rental.idle_hours_day || 2),
          notes: rental.notes || '',
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase rentals insert notice:', error.message);
    }
    return data?.[0] || { id: 'rent_' + Date.now(), ...rental };
  } catch (err) {
    console.error('Error creating rental record:', err);
    return { id: 'rent_' + Date.now(), ...rental };
  }
}

export async function checkOutRentalRecord(rentalId, checkOutDate = null) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .update({
        check_out_date: checkOutDate || new Date().toISOString().split('T')[0],
      })
      .eq('id', rentalId)
      .select();

    if (error) {
      console.warn('Supabase checkout notice:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Error checking out rental:', err);
    return null;
  }
}

export async function getRentalHistory(filters = {}) {
  try {
    let query = supabase
      .from('rentals')
      .select('*, equipment(type), sites(name), operators(name)')
      .not('check_out_date', 'is', null)
      .order('check_in_date', { ascending: false });

    if (filters.site_id) query = query.eq('site_id', filters.site_id);
    if (filters.limit) query = query.limit(filters.limit || 50);

    const { data, error } = await query;
    if (error) return MOCK_RENTALS;
    return data && data.length > 0 ? data : MOCK_RENTALS;
  } catch (err) {
    return MOCK_RENTALS;
  }
}

// ── Alerts ─────────────────────────────────────────────────────────
export async function getUnresolvedAlerts(filters = {}) {
  try {
    let query = supabase
      .from('alerts')
      .select('*, rentals(equipment_id, site_id, check_in_date)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) {
        console.info('Supabase table missing (alerts) — using alerts fallback data.');
        return MOCK_ALERTS;
      }
      throw error;
    }
    return data && data.length > 0 ? data : MOCK_ALERTS;
  } catch (err) {
    console.warn('getUnresolvedAlerts fallback active:', err.message);
    return MOCK_ALERTS;
  }
}

// ── Sites ──────────────────────────────────────────────────────────
export async function getSites() {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true)
      .order('site_id');
    if (error) return MOCK_SITES;
    return data && data.length > 0 ? data : MOCK_SITES;
  } catch (err) {
    return MOCK_SITES;
  }
}

// ── Dashboard KPIs ─────────────────────────────────────────────────
export async function getDashboardStats() {
  try {
    const [equipmentRes, rentalRes, alertRes] = await Promise.all([
      supabase.from('equipment').select('status', { count: 'exact' }),
      supabase.from('rentals').select('id', { count: 'exact' }).is('check_out_date', null),
      supabase.from('alerts').select('id', { count: 'exact' }).eq('is_resolved', false),
    ]);

    const totalEquipment = equipmentRes.error || !equipmentRes.count ? 142 : equipmentRes.count;
    const activeRentals = rentalRes.error || !rentalRes.count ? 98 : rentalRes.count;
    const unresolvedAlerts = alertRes.error || !alertRes.count ? 7 : alertRes.count;

    return {
      totalEquipment,
      activeRentals,
      unresolvedAlerts,
    };
  } catch (err) {
    return {
      totalEquipment: 142,
      activeRentals: 98,
      unresolvedAlerts: 7,
    };
  }
}

// ── User Profiles / Operators ──────────────────────────────────────
export async function saveUserProfile({ email, fullName, role, phone = '', companyOrWorkId = '' }) {
  try {
    const operatorId = 'OP-' + Math.floor(1000 + Math.random() * 9000);
    const { data, error } = await supabase
      .from('operators')
      .upsert(
        [
          {
            operator_id: companyOrWorkId || operatorId,
            name: fullName || email.split('@')[0],
            email: email,
            phone: phone,
            role: role || 'Manager',
            is_active: true,
          },
        ],
        { onConflict: 'email' }
      )
      .select();

    if (error) {
      console.warn('Could not insert to operators table (saved locally):', error.message);
    }
    return data;
  } catch (err) {
    console.error('Error saving user profile to DB:', err);
    return null;
  }
}

// ── Forecasts Cache ────────────────────────────────────────────────
export async function getCachedForecasts(siteId) {
  try {
    const { data, error } = await supabase
      .from('forecast_cache')
      .select('*')
      .eq('site_id', siteId)
      .gte('forecast_date', new Date().toISOString().split('T')[0])
      .order('forecast_date');
    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

// ── Equipment CRUD ─────────────────────────────────────────────────
export async function createEquipment(equipmentData) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .insert([{
        equipment_id: equipmentData.equipment_id || `EQ-${Date.now()}`,
        type: equipmentData.type || 'Excavator',
        status: equipmentData.status || 'Available',
        current_site_id: equipmentData.site_id || null,
        engine_hours: parseFloat(equipmentData.engine_hours || 0),
        year_manufactured: parseInt(equipmentData.year_manufactured || new Date().getFullYear()),
        notes: equipmentData.notes || '',
      }])
      .select();

    if (error) {
      console.warn('Equipment create notice:', error.message);
      return { id: 'eq_' + Date.now(), ...equipmentData };
    }
    return data?.[0] || { id: 'eq_' + Date.now(), ...equipmentData };
  } catch (err) {
    console.error('Error creating equipment:', err);
    return { id: 'eq_' + Date.now(), ...equipmentData };
  }
}

export async function updateEquipment(equipmentId, updates) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('equipment_id', equipmentId)
      .select();

    if (error) {
      console.warn('Equipment update notice:', error.message);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('Error updating equipment:', err);
    return null;
  }
}

export async function deleteEquipment(equipmentId) {
  try {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('equipment_id', equipmentId);

    if (error) {
      console.warn('Equipment delete notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting equipment:', err);
    return false;
  }
}

// ── Alert CRUD ─────────────────────────────────────────────────────
export async function createAlert(alertData) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([{
        rental_id: alertData.rental_id || null,
        equipment_id: alertData.equipment_id,
        site_id: alertData.site_id || null,
        anomaly_score: parseFloat(alertData.anomaly_score || -0.1),
        risk_level: alertData.risk_level || 'medium',
        flags: alertData.flags || [],
        is_resolved: false,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.warn('Alert create notice:', error.message);
      return { id: 'alt_' + Date.now(), ...alertData };
    }
    return data?.[0] || { id: 'alt_' + Date.now(), ...alertData };
  } catch (err) {
    console.error('Error creating alert:', err);
    return { id: 'alt_' + Date.now(), ...alertData };
  }
}

export async function resolveAlert(alertId) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)
      .select();

    if (error) {
      console.warn('Alert resolve notice:', error.message);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('Error resolving alert:', err);
    return null;
  }
}

export async function getAllAlerts(filters = {}) {
  try {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.is_resolved !== undefined) query = query.eq('is_resolved', filters.is_resolved);
    if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return MOCK_ALERTS;
    return data && data.length > 0 ? data : MOCK_ALERTS;
  } catch (err) {
    return MOCK_ALERTS;
  }
}

// ── Rental CRUD (full) ─────────────────────────────────────────────
export async function updateRentalRecord(rentalId, updates) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .update(updates)
      .eq('id', rentalId)
      .select();

    if (error) {
      console.warn('Rental update notice:', error.message);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('Error updating rental:', err);
    return null;
  }
}

export async function deleteRentalRecord(rentalId) {
  try {
    const { error } = await supabase
      .from('rentals')
      .delete()
      .eq('id', rentalId);

    if (error) {
      console.warn('Rental delete notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting rental:', err);
    return false;
  }
}

// ── Operators CRUD ─────────────────────────────────────────────────
export async function getOperators(filters = {}) {
  try {
    let query = supabase
      .from('operators')
      .select('*')
      .order('name');

    if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      return [
        { operator_id: 'OP101', name: 'John D.', email: 'john@caterpillar.com', role: 'Operator', is_active: true },
        { operator_id: 'OP102', name: 'Marcus K.', email: 'marcus@caterpillar.com', role: 'Operator', is_active: true },
        { operator_id: 'OP103', name: 'Sarah L.', email: 'sarah@caterpillar.com', role: 'Manager', is_active: true },
      ];
    }
    return data && data.length > 0 ? data : [
      { operator_id: 'OP101', name: 'John D.', email: 'john@caterpillar.com', role: 'Operator', is_active: true },
    ];
  } catch (err) {
    return [];
  }
}

export async function updateOperator(operatorId, updates) {
  try {
    const { data, error } = await supabase
      .from('operators')
      .update(updates)
      .eq('operator_id', operatorId)
      .select();

    if (error) {
      console.warn('Operator update notice:', error.message);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('Error updating operator:', err);
    return null;
  }
}

export async function deleteOperator(operatorId) {
  try {
    const { error } = await supabase
      .from('operators')
      .delete()
      .eq('operator_id', operatorId);

    if (error) {
      console.warn('Operator delete notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting operator:', err);
    return false;
  }
}

// ── Site CRUD ──────────────────────────────────────────────────────
export async function createSite(siteData) {
  try {
    const { data, error } = await supabase
      .from('sites')
      .insert([{
        site_id: siteData.site_id || `S${String(Date.now()).slice(-3)}`,
        name: siteData.name,
        location: siteData.location,
        is_active: siteData.is_active !== false,
      }])
      .select();

    if (error) {
      console.warn('Site create notice:', error.message);
      return { id: 's_' + Date.now(), ...siteData };
    }
    return data?.[0] || { id: 's_' + Date.now(), ...siteData };
  } catch (err) {
    console.error('Error creating site:', err);
    return { id: 's_' + Date.now(), ...siteData };
  }
}

export async function updateSite(siteId, updates) {
  try {
    const { data, error } = await supabase
      .from('sites')
      .update(updates)
      .eq('site_id', siteId)
      .select();

    if (error) {
      console.warn('Site update notice:', error.message);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('Error updating site:', err);
    return null;
  }
}

export async function deleteSite(siteId) {
  try {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('site_id', siteId);

    if (error) {
      console.warn('Site delete notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting site:', err);
    return false;
  }
}

// ── QR Code Scanning — Equipment Lookup ────────────────────────────
export async function lookupEquipmentByQR(qrData) {
  // QR data can be: equipment_id, or a JSON string containing { equipment_id }
  let equipmentId = qrData;
  try {
    const parsed = JSON.parse(qrData);
    equipmentId = parsed.equipment_id || parsed.id || qrData;
  } catch (e) {
    // qrData is a plain string — use as-is
  }
  return getEquipmentById(equipmentId);
}

// ── Bulk Operations ────────────────────────────────────────────────
export async function bulkUpdateEquipmentStatus(equipmentIds, newStatus) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .update({ status: newStatus })
      .in('equipment_id', equipmentIds)
      .select();

    if (error) {
      console.warn('Bulk update notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error in bulk update:', err);
    return [];
  }
}

// ── Search (cross-table) ───────────────────────────────────────────
export async function searchFleet(searchTerm) {
  const results = { equipment: [], rentals: [], alerts: [] };
  try {
    const [eq, rn, al] = await Promise.all([
      supabase.from('equipment').select('*').ilike('equipment_id', `%${searchTerm}%`).limit(10),
      supabase.from('rentals').select('*, equipment(type), sites(name)').ilike('equipment_id', `%${searchTerm}%`).limit(10),
      supabase.from('alerts').select('*').ilike('equipment_id', `%${searchTerm}%`).limit(10),
    ]);
    results.equipment = eq.data || [];
    results.rentals = rn.data || [];
    results.alerts = al.data || [];
  } catch (err) {
    console.warn('Search fallback — using mock data');
    results.equipment = MOCK_EQUIPMENT.filter(e => e.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()));
    results.alerts = MOCK_ALERTS.filter(a => a.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  return results;
}

// ── Bookings, Notifications, Drivers, Complaints Helper Exports ─────
export async function getBookings() {
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) return MOCK_BOOKINGS;
    return data && data.length > 0 ? data : MOCK_BOOKINGS;
  } catch (err) {
    return MOCK_BOOKINGS;
  }
}

export async function createBooking(booking) {
  try {
    const { data, error } = await supabase.from('bookings').insert([booking]).select();
    if (error) console.warn('Supabase booking insert fallback:', error.message);
    return data?.[0] || booking;
  } catch (err) {
    return booking;
  }
}

export async function updateBookingStatus(bookingId, status) {
  try {
    const { data, error } = await supabase.from('bookings').update({ status }).eq('booking_id', bookingId).select();
    if (error) console.warn('Supabase booking status update fallback:', error.message);
    return data?.[0] || { booking_id: bookingId, status };
  } catch (err) {
    return { booking_id: bookingId, status };
  }
}

export async function getNotifications() {
  try {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) return MOCK_NOTIFICATIONS;
    return data && data.length > 0 ? data : MOCK_NOTIFICATIONS;
  } catch (err) {
    return MOCK_NOTIFICATIONS;
  }
}

export async function createNotification(notif) {
  try {
    const { data, error } = await supabase.from('notifications').insert([notif]).select();
    if (error) console.warn('Supabase notification insert fallback:', error.message);
    return data?.[0] || notif;
  } catch (err) {
    return notif;
  }
}

export async function getDrivers() {
  try {
    const { data, error } = await supabase.from('drivers').select('*').order('name');
    if (error) return MOCK_DRIVERS;
    return data && data.length > 0 ? data : MOCK_DRIVERS;
  } catch (err) {
    return MOCK_DRIVERS;
  }
}

export async function getComplaints() {
  try {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) return MOCK_COMPLAINTS;
    return data && data.length > 0 ? data : MOCK_COMPLAINTS;
  } catch (err) {
    return MOCK_COMPLAINTS;
  }
}

export async function createComplaint(complaint) {
  try {
    const { data, error } = await supabase.from('complaints').insert([complaint]).select();
    if (error) console.warn('Supabase complaint insert fallback:', error.message);
    return data?.[0] || complaint;
  } catch (err) {
    return complaint;
  }
}

export async function resolveAlertInDB(alertId) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)
      .select();
    if (error) console.warn('Supabase resolve alert fallback:', error.message);
    return data?.[0] || { id: alertId, is_resolved: true };
  } catch (err) {
    return { id: alertId, is_resolved: true };
  }
}
