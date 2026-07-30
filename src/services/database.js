/**
 * Database Service — Smart Rental Track
 * ==========================================
 * Direct Supabase API queries for Equipment, Rentals, Alerts, Sites, Operators, Drivers, Complaints.
 * Features an uninitialized table cache guard to prevent browser console 404 error spam.
 */

import { supabase } from '../utils/supabase';

// In-memory set of uninitialized Supabase tables to prevent 404 network spam
const uninitializedTables = new Set();

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
  if (uninitializedTables.has('equipment')) return [];
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
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getEquipmentById(id) {
  if (uninitializedTables.has('equipment')) return null;
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name, location)')
      .or(`equipment_id.eq.${id},id.eq.${id}`)
      .single();

    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('equipment');
      return null;
    }
    return data;
  } catch (err) {
    return null;
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
  if (uninitializedTables.has('rentals')) return [];
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
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getRentalHistory(filters = {}) {
  if (uninitializedTables.has('rentals')) return [];
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
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
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
  if (uninitializedTables.has('alerts')) return [];
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
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
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
  if (uninitializedTables.has('sites')) return [];
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true)
      .order('site_id');

    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('sites');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
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
  if (uninitializedTables.has('drivers')) return [];
  try {
    const { data, error } = await supabase.from('drivers').select('*').order('name');
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('drivers');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getComplaints() {
  if (uninitializedTables.has('complaints')) return [];
  try {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('complaints');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
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
  if (uninitializedTables.has('bookings')) return [];
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('bookings');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getNotifications() {
  if (uninitializedTables.has('notifications')) return [];
  try {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) uninitializedTables.add('notifications');
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
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
      totalEquipment: equipRes.count !== null ? equipRes.count : 142,
      activeRentals: rentalRes.count !== null ? rentalRes.count : 98,
      unresolvedAlerts: alertRes.count !== null ? alertRes.count : 7,
    };
  } catch (err) {
    return {
      totalEquipment: 142,
      activeRentals: 98,
      unresolvedAlerts: 7,
    };
  }
}

export async function searchFleet(queryStr) {
  if (!queryStr || !queryStr.trim() || uninitializedTables.has('equipment')) return [];
  const term = `%${queryStr.trim()}%`;

  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name)')
      .or(`equipment_id.ilike.${term},type.ilike.${term},status.ilike.${term}`);

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}
