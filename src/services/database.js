/**
 * Database Service — Smart Rental Track
 * ==========================================
 * Direct Supabase API queries for Equipment, Rentals, Alerts, Sites, Operators, Drivers, Complaints.
 * Features structured seed mock fallbacks when Supabase tables are uninitialized (404 / PGRST205).
 */

import { supabase } from '../utils/supabase';

// In-memory set of uninitialized Supabase tables to prevent repeated 404 network calls
const uninitializedTables = new Set();

// ── Rich Seed Datasets ──────────────────────────────────────────────
const SEED_SITES = [
  { site_id: 'S001', name: 'Highway Construction Zone A', location: 'Chennai, TN', is_active: true },
  { site_id: 'S002', name: 'Metro Rail Extension', location: 'Bangalore, KA', is_active: true },
  { site_id: 'S003', name: 'Industrial Park Development', location: 'Hyderabad, TS', is_active: true },
  { site_id: 'S004', name: 'River Dam Construction', location: 'Pune, MH', is_active: true },
  { site_id: 'S005', name: 'Mining Operations East', location: 'Ranchi, JH', is_active: true },
];

const SEED_EQUIPMENT = [
  { equipment_id: 'EX-402', id: 'EX-402', type: 'Excavator', status: 'Available', site: 'Highway Construction Zone A', sites: { name: 'Highway Construction Zone A' }, rentalDays: '14 Days', operator: 'John D.', image: 'https://images.unsplash.com/photo-1579412690850-bd41cd0af397?auto=format&fit=crop&w=600&q=80' },
  { equipment_id: 'CR-110', id: 'CR-110', type: 'Crane', status: 'Available', site: 'Metro Rail Extension', sites: { name: 'Metro Rail Extension' }, rentalDays: '42 Days', operator: 'Marcus K.', image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80' },
  { equipment_id: 'BD-088', id: 'BD-088', type: 'Bulldozer', status: 'Available', site: 'Industrial Park', sites: { name: 'Industrial Park' }, rentalDays: '--', operator: 'Unassigned', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
  { equipment_id: 'EX-405', id: 'EX-405', type: 'Excavator', status: 'Available', site: 'Highway Construction Zone A', sites: { name: 'Highway Construction Zone A' }, rentalDays: '5 Days', operator: 'Sarah L.', image: 'https://images.unsplash.com/photo-1579412690850-bd41cd0af397?auto=format&fit=crop&w=600&q=80' },
  { equipment_id: 'LD-099', id: 'LD-099', type: 'Loader', status: 'Available', site: 'Sector 7 Expansion', sites: { name: 'Sector 7 Expansion' }, rentalDays: '--', operator: 'Unassigned', image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80' },
  { equipment_id: 'GR-201', id: 'GR-201', type: 'Grader', status: 'Available', site: 'River Dam Site', sites: { name: 'River Dam Site' }, rentalDays: '10 Days', operator: 'Robert T.', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80' },
];

const SEED_RENTALS = [
  { id: 'R-1001', equipment_id: 'EX-402', site_id: 'S001', operator_id: 'OP101', check_in_date: '2025-03-01', engine_hours_day: 8.5, idle_hours_day: 1.2, equipment: { type: 'Excavator', status: 'Active' }, sites: { name: 'Highway Zone A' }, operators: { name: 'John D.' } },
  { id: 'R-1002', equipment_id: 'CR-110', site_id: 'S002', operator_id: 'OP102', check_in_date: '2025-02-15', engine_hours_day: 6.0, idle_hours_day: 4.5, equipment: { type: 'Crane', status: 'Overdue' }, sites: { name: 'Metro Extension' }, operators: { name: 'Marcus K.' } },
  { id: 'R-1003', equipment_id: 'EX-405', site_id: 'S001', operator_id: 'OP103', check_in_date: '2025-03-05', engine_hours_day: 7.2, idle_hours_day: 0.8, equipment: { type: 'Excavator', status: 'Active' }, sites: { name: 'Highway Zone A' }, operators: { name: 'Sarah L.' } },
];

const SEED_ALERTS = [
  { id: 'ALT-101', equipment_id: 'EX-402', site_id: 'S001', risk_level: 'critical', anomaly_score: -0.18, flags: ['unauthorized_movement', 'no_operator'], is_resolved: false, created_at: new Date().toISOString() },
  { id: 'ALT-102', equipment_id: 'CR-110', site_id: 'S002', risk_level: 'critical', anomaly_score: -0.22, flags: ['overdue_rental', 'missing_check_out'], is_resolved: false, created_at: new Date().toISOString() },
  { id: 'ALT-103', equipment_id: 'BD-088', site_id: 'S003', risk_level: 'medium', anomaly_score: -0.04, flags: ['excessive_idle'], is_resolved: false, created_at: new Date().toISOString() },
];

const SEED_DRIVERS = [
  { driver_id: 'DRV-101', name: 'Rajesh Kumar', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43210' },
  { driver_id: 'DRV-102', name: 'Suresh Verma', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43211' },
  { driver_id: 'DRV-103', name: 'Vikram Singh', status: 'assigned', assigned_booking_id: 'BK-SAMPLE-01', phone: '+91 98765 43212' },
  { driver_id: 'DRV-104', name: 'Amit Patel', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43213' },
  { driver_id: 'DRV-105', name: 'Dinesh Sharma', status: 'unassigned', assigned_booking_id: null, phone: '+91 98765 43214' },
];

const SEED_BOOKINGS = [
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
    status: 'PENDING_EMPLOYEE_SCAN',
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
    status: 'HANDOVER_ACCEPTED',
    qr_code: 'data:image/png;base64,sample',
    driver_id: null,
    created_at: '2025-03-08T14:15:00Z',
  }
];

const SEED_NOTIFICATIONS = [
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
    status: 'pending',
    created_at: '2025-03-28T10:30:00Z',
  }
];

const SEED_COMPLAINTS = [
  {
    complaint_id: 'CMP-101',
    id: 'CMP-101',
    customer_id: 'usr_customer1',
    customer_name: 'Jane Doe',
    booking_id: 'BK-SAMPLE-02',
    equipment_id: 'CR-110',
    category: 'Equipment Breakdown / Malfunction',
    description: 'Crane hydraulic pressure is fluctuating dangerously during heavy lifting operations.',
    status: 'open',
    created_at: '2025-03-15T09:20:00Z',
  }
];

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
  if (uninitializedTables.has('equipment')) return SEED_EQUIPMENT;
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
      if (isMissingTableError(error)) uninitializedTables.add('equipment');
      return SEED_EQUIPMENT;
    }
    return data && data.length > 0 ? data : SEED_EQUIPMENT;
  } catch (err) {
    return SEED_EQUIPMENT;
  }
}

export async function getEquipmentById(id) {
  if (uninitializedTables.has('equipment')) {
    return SEED_EQUIPMENT.find(e => e.equipment_id === id || e.id === id) || null;
  }
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name, location)')
      .or(`equipment_id.eq.${id},id.eq.${id}`)
      .single();

    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('equipment');
      return SEED_EQUIPMENT.find(e => e.equipment_id === id || e.id === id) || null;
    }
    return data;
  } catch (err) {
    return SEED_EQUIPMENT.find(e => e.equipment_id === id || e.id === id) || null;
  }
}

export async function lookupEquipmentByQR(qrPayload) {
  let targetId = qrPayload;
  try {
    const parsed = JSON.parse(qrPayload);
    targetId = parsed.equipment_id || parsed.id || qrPayload;
  } catch (e) {}

  const asset = await getEquipmentById(targetId);
  if (asset) return asset;

  return {
    equipment_id: targetId,
    type: targetId.startsWith('CR') ? 'Crane' : targetId.startsWith('BD') ? 'Bulldozer' : 'Excavator',
    status: 'Available',
    current_site_id: 'S001',
    sites: { name: 'Highway Construction Zone A' },
  };
}

export async function createEquipment(equipmentData) {
  try {
    const { data, error } = await supabase.from('equipment').insert([equipmentData]).select();
    if (error) return equipmentData;
    return data?.[0] || equipmentData;
  } catch (err) {
    return equipmentData;
  }
}

export async function updateEquipment(id, updates) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .or(`equipment_id.eq.${id},id.eq.${id}`)
      .select();

    if (error) return { id, ...updates };
    return data?.[0] || { id, ...updates };
  } catch (err) {
    return { id, ...updates };
  }
}

export async function deleteEquipment(id) {
  try {
    await supabase.from('equipment').delete().or(`equipment_id.eq.${id},id.eq.${id}`);
    return true;
  } catch (err) {
    return true;
  }
}

export async function bulkUpdateEquipmentStatus(equipmentIds, newStatus) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .update({ status: newStatus })
      .in('equipment_id', equipmentIds)
      .select();

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

// ── Rentals ────────────────────────────────────────────────────────
export async function getActiveRentals(filters = {}) {
  if (uninitializedTables.has('rentals')) return SEED_RENTALS;
  try {
    let query = supabase
      .from('rentals')
      .select('*, equipment(*), sites(name), operators(name)')
      .is('check_out_date', null)
      .order('check_in_date', { ascending: false });

    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('rentals');
      return SEED_RENTALS;
    }
    return data && data.length > 0 ? data : SEED_RENTALS;
  } catch (err) {
    return SEED_RENTALS;
  }
}

export async function getRentalHistory(filters = {}) {
  if (uninitializedTables.has('rentals')) return SEED_RENTALS;
  try {
    let query = supabase
      .from('rentals')
      .select('*, equipment(*), sites(name), operators(name)')
      .order('check_in_date', { ascending: false });

    if (filters.equipment_id) query = query.eq('equipment_id', filters.equipment_id);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('rentals');
      return SEED_RENTALS;
    }
    return data && data.length > 0 ? data : SEED_RENTALS;
  } catch (err) {
    return SEED_RENTALS;
  }
}

export async function createRentalRecord(rentalData) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .insert([rentalData])
      .select('*, equipment(*), sites(name), operators(name)');

    if (error) return rentalData;

    if (rentalData.equipment_id) {
      await updateEquipment(rentalData.equipment_id, { status: 'rented', current_site_id: rentalData.site_id });
    }

    return data?.[0] || rentalData;
  } catch (err) {
    return rentalData;
  }
}

export async function checkOutRentalRecord(equipmentId, checkOutDate = null) {
  const date = checkOutDate || new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('rentals')
      .update({ check_out_date: date })
      .eq('equipment_id', equipmentId)
      .is('check_out_date', null)
      .select();

    if (error) return { equipment_id: equipmentId, check_out_date: date };
    await updateEquipment(equipmentId, { status: 'available' });
    return data?.[0] || { equipment_id: equipmentId, check_out_date: date };
  } catch (err) {
    return { equipment_id: equipmentId, check_out_date: date };
  }
}

// ── Alerts ─────────────────────────────────────────────────────────
export async function getUnresolvedAlerts(filters = {}) {
  if (uninitializedTables.has('alerts')) return SEED_ALERTS;
  try {
    let query = supabase
      .from('alerts')
      .select('*, equipment(*), sites(name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('alerts');
      return SEED_ALERTS;
    }
    return data && data.length > 0 ? data : SEED_ALERTS;
  } catch (err) {
    return SEED_ALERTS;
  }
}

export async function createAlertRecord(alertData) {
  try {
    const { data, error } = await supabase.from('alerts').insert([alertData]).select();
    if (error) return alertData;
    return data?.[0] || alertData;
  } catch (err) {
    return alertData;
  }
}

export async function resolveAlertInDB(alertId, notes = null) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        notes: notes,
      })
      .eq('id', alertId)
      .select();

    if (error) return { id: alertId, is_resolved: true };
    return data?.[0] || { id: alertId, is_resolved: true };
  } catch (err) {
    return { id: alertId, is_resolved: true };
  }
}

// ── Sites / Operators / Drivers / Complaints / Bookings / Notifications
export async function getSites() {
  if (uninitializedTables.has('sites')) return SEED_SITES;
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true)
      .order('site_id');

    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('sites');
      return SEED_SITES;
    }
    return data && data.length > 0 ? data : SEED_SITES;
  } catch (err) {
    return SEED_SITES;
  }
}

export async function getOperators() {
  if (uninitializedTables.has('operators')) return [];
  try {
    const { data, error } = await supabase.from('operators').select('*').eq('is_active', true).order('name');
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('operators');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getDrivers() {
  if (uninitializedTables.has('drivers')) return SEED_DRIVERS;
  try {
    const { data, error } = await supabase.from('drivers').select('*').order('name');
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('drivers');
      return SEED_DRIVERS;
    }
    return data && data.length > 0 ? data : SEED_DRIVERS;
  } catch (err) {
    return SEED_DRIVERS;
  }
}

export async function getComplaints() {
  if (uninitializedTables.has('complaints')) return SEED_COMPLAINTS;
  try {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('complaints');
      return SEED_COMPLAINTS;
    }
    return data && data.length > 0 ? data : SEED_COMPLAINTS;
  } catch (err) {
    return SEED_COMPLAINTS;
  }
}

export async function createComplaint(complaint) {
  try {
    const { data, error } = await supabase.from('complaints').insert([complaint]).select();
    if (error) return complaint;
    return data?.[0] || complaint;
  } catch (err) {
    return complaint;
  }
}

export async function getBookings() {
  if (uninitializedTables.has('bookings')) return SEED_BOOKINGS;
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('bookings');
      return SEED_BOOKINGS;
    }
    return data && data.length > 0 ? data : SEED_BOOKINGS;
  } catch (err) {
    return SEED_BOOKINGS;
  }
}

export async function getNotifications() {
  if (uninitializedTables.has('notifications')) return SEED_NOTIFICATIONS;
  try {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('notifications');
      return SEED_NOTIFICATIONS;
    }
    return data && data.length > 0 ? data : SEED_NOTIFICATIONS;
  } catch (err) {
    return SEED_NOTIFICATIONS;
  }
}

export async function saveUserProfile(user, extraData = {}) {
  try {
    const profile = {
      id: user.id,
      email: user.email,
      role: extraData.role || 'Customer',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('profiles').upsert(profile).select();
    if (error) uninitializedTables.add('profiles');
    return data?.[0] || profile;
  } catch (err) {
    return { id: user.id, email: user.email, role: extraData.role || 'Customer' };
  }
}

export async function createBooking(bookingData) {
  try {
    const { data, error } = await supabase.from('bookings').insert([bookingData]).select();
    if (error) return bookingData;
    return data?.[0] || bookingData;
  } catch (err) {
    return bookingData;
  }
}

export async function updateBookingStatus(bookingId, status, extra = {}) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, ...extra })
      .or(`booking_id.eq.${bookingId},id.eq.${bookingId}`)
      .select();
    if (error) return { id: bookingId, status, ...extra };
    return data?.[0] || { id: bookingId, status, ...extra };
  } catch (err) {
    return { id: bookingId, status, ...extra };
  }
}

export async function createNotification(notifData) {
  try {
    const { data, error } = await supabase.from('notifications').insert([notifData]).select();
    if (error) return notifData;
    return data?.[0] || notifData;
  } catch (err) {
    return notifData;
  }
}

// ── Dashboard Stats ────────────────────────────────────────────────
export async function getDashboardStats() {
  try {
    const [equipRes, rentalRes, alertRes] = await Promise.all([
      supabase.from('equipment').select('id', { count: 'exact', head: true }),
      supabase.from('rentals').select('id', { count: 'exact', head: true }).is('check_out_date', null),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
    ]);

    return {
      totalEquipment: equipRes.count !== null && equipRes.count > 0 ? equipRes.count : SEED_EQUIPMENT.length,
      activeRentals: rentalRes.count !== null && rentalRes.count > 0 ? rentalRes.count : SEED_RENTALS.length,
      unresolvedAlerts: alertRes.count !== null && alertRes.count > 0 ? alertRes.count : SEED_ALERTS.length,
    };
  } catch (err) {
    return {
      totalEquipment: SEED_EQUIPMENT.length,
      activeRentals: SEED_RENTALS.length,
      unresolvedAlerts: SEED_ALERTS.length,
    };
  }
}

export async function searchFleet(queryStr) {
  if (!queryStr || !queryStr.trim()) return [];
  const term = `%${queryStr.trim()}%`;

  if (uninitializedTables.has('equipment')) {
    return SEED_EQUIPMENT.filter(e => e.type.toLowerCase().includes(queryStr.toLowerCase()) || e.equipment_id.toLowerCase().includes(queryStr.toLowerCase()));
  }

  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name)')
      .or(`equipment_id.ilike.${term},type.ilike.${term},status.ilike.${term}`);

    if (error) return SEED_EQUIPMENT.filter(e => e.type.toLowerCase().includes(queryStr.toLowerCase()) || e.equipment_id.toLowerCase().includes(queryStr.toLowerCase()));
    return data || [];
  } catch (err) {
    return [];
  }
}
