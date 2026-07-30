-- =====================================================================
-- SMART RENTAL TRACK — Complete Supabase PostgreSQL Schema & Seeder
-- =====================================================================
-- Wipes any old schema tables, creates fresh clean relational tables,
-- sets up public RLS access policies, and seeds complete initial data.
-- =====================================================================

-- 1. DROP EXISTING TABLES (CASCADE)
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. CREATE SITES TABLE
CREATE TABLE sites (
  site_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE USER PROFILES TABLE
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'customer',
  company_or_work_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE EQUIPMENT TABLE
CREATE TABLE equipment (
  equipment_id TEXT PRIMARY KEY,
  id TEXT UNIQUE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Available',
  current_site_id TEXT REFERENCES sites(site_id) ON DELETE SET NULL,
  site TEXT,
  rental_days TEXT DEFAULT '--',
  operator TEXT DEFAULT 'Unassigned',
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE BOOKINGS TABLE
CREATE TABLE bookings (
  booking_id TEXT PRIMARY KEY,
  id TEXT UNIQUE,
  equipment_id TEXT REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  jobsite TEXT,
  start_date DATE,
  end_date DATE,
  transportation_type TEXT DEFAULT 'delivery',
  estimated_cost NUMERIC DEFAULT 0,
  agreement_accepted BOOLEAN DEFAULT true,
  agreement_timestamp TIMESTAMPTZ DEFAULT NOW(),
  license_number TEXT,
  weather_confirmed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'PENDING_EMPLOYEE_SCAN',
  qr_code TEXT,
  driver_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE RENTALS TABLE
CREATE TABLE rentals (
  id TEXT PRIMARY KEY,
  equipment_id TEXT REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(site_id) ON DELETE SET NULL,
  operator_id TEXT,
  check_in_date DATE DEFAULT CURRENT_DATE,
  check_out_date DATE,
  engine_hours_day NUMERIC DEFAULT 8.0,
  idle_hours_day NUMERIC DEFAULT 1.0,
  fuel_level NUMERIC DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE ALERTS TABLE
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  equipment_id TEXT REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(site_id) ON DELETE SET NULL,
  risk_level TEXT DEFAULT 'low',
  anomaly_score NUMERIC DEFAULT 0,
  flags JSONB DEFAULT '[]'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE DRIVERS TABLE
CREATE TABLE drivers (
  driver_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unassigned',
  assigned_booking_id TEXT REFERENCES bookings(booking_id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE NOTIFICATIONS TABLE
CREATE TABLE notifications (
  notification_id TEXT PRIMARY KEY,
  id TEXT UNIQUE,
  type TEXT DEFAULT 'delivery_request',
  booking_id TEXT REFERENCES bookings(booking_id) ON DELETE CASCADE,
  customer_name TEXT,
  equipment_id TEXT,
  jobsite TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE COMPLAINTS TABLE
CREATE TABLE complaints (
  complaint_id TEXT PRIMARY KEY,
  id TEXT UNIQUE,
  customer_id TEXT,
  customer_name TEXT,
  booking_id TEXT,
  equipment_id TEXT,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 11. ENABLE ROW LEVEL SECURITY & OPEN PUBLIC PERMISSIONS
-- =====================================================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on sites" ON sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on rentals" ON rentals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 12. SEED INITIAL MOCK DATA
-- =====================================================================

-- Seed Sites
INSERT INTO sites (site_id, name, location, is_active) VALUES
('S001', 'Highway Construction Zone A', 'Chennai, TN', true),
('S002', 'Metro Rail Extension', 'Bangalore, KA', true),
('S003', 'Industrial Park Development', 'Hyderabad, TS', true),
('S004', 'River Dam Construction', 'Pune, MH', true),
('S005', 'Mining Operations East', 'Ranchi, JH', true);

-- Seed Equipment
INSERT INTO equipment (equipment_id, id, type, status, current_site_id, site, rental_days, operator, image) VALUES
('EX-402', 'EX-402', 'Excavator', 'Available', 'S001', 'Highway Construction Zone A', '14 Days', 'John D.', 'https://images.unsplash.com/photo-1579412690850-bd41cd0af397?auto=format&fit=crop&w=600&q=80'),
('CR-110', 'CR-110', 'Crane', 'Available', 'S002', 'Metro Rail Extension', '42 Days', 'Marcus K.', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80'),
('BD-088', 'BD-088', 'Bulldozer', 'Available', 'S003', 'Industrial Park Development', '--', 'Unassigned', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
('EX-405', 'EX-405', 'Excavator', 'Available', 'S001', 'Highway Construction Zone A', '5 Days', 'Sarah L.', 'https://images.unsplash.com/photo-1579412690850-bd41cd0af397?auto=format&fit=crop&w=600&q=80'),
('LD-099', 'LD-099', 'Loader', 'Available', 'S004', 'River Dam Construction', '--', 'Unassigned', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'),
('GR-201', 'GR-201', 'Grader', 'Available', 'S005', 'Mining Operations East', '10 Days', 'Robert T.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80');

-- Seed Bookings
INSERT INTO bookings (booking_id, id, equipment_id, customer_id, customer_name, customer_email, jobsite, start_date, end_date, transportation_type, estimated_cost, agreement_accepted, license_number, weather_confirmed, status, driver_id) VALUES
('BK-SAMPLE-01', 'BK-SAMPLE-01', 'EX-402', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'North Quarry Site, Gate 2', '2025-04-01', '2025-04-05', 'delivery', 4000, true, 'DL-998827361', true, 'PENDING_EMPLOYEE_SCAN', NULL),
('BK-SAMPLE-02', 'BK-SAMPLE-02', 'CR-110', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'Harbor Expansion, Dock 4', '2025-03-10', '2025-03-20', 'pickup', 10000, true, 'DL-998827361', true, 'HANDOVER_ACCEPTED', NULL);

-- Seed Rentals
INSERT INTO rentals (id, equipment_id, site_id, operator_id, check_in_date, engine_hours_day, idle_hours_day, fuel_level, notes) VALUES
('R-1001', 'EX-402', 'S001', 'OP101', '2025-03-01', 8.5, 1.2, 85, 'Routine shift check-in clear.'),
('R-1002', 'CR-110', 'S002', 'OP102', '2025-02-15', 6.0, 4.5, 60, 'Overdue alert flag pending return.'),
('R-1003', 'EX-405', 'S001', 'OP103', '2025-03-05', 7.2, 0.8, 90, 'High engine utilization recorded.');

-- Seed Alerts
INSERT INTO alerts (id, equipment_id, site_id, risk_level, anomaly_score, flags, is_resolved) VALUES
('ALT-101', 'EX-402', 'S001', 'critical', -0.18, '["unauthorized_movement", "no_operator"]'::jsonb, false),
('ALT-102', 'CR-110', 'S002', 'critical', -0.22, '["overdue_rental", "missing_check_out"]'::jsonb, false),
('ALT-103', 'BD-088', 'S003', 'medium', -0.04, '["excessive_idle"]'::jsonb, false);

-- Seed Drivers
INSERT INTO drivers (driver_id, name, status, assigned_booking_id, phone) VALUES
('DRV-101', 'Rajesh Kumar', 'unassigned', NULL, '+91 98765 43210'),
('DRV-102', 'Suresh Verma', 'unassigned', NULL, '+91 98765 43211'),
('DRV-103', 'Vikram Singh', 'assigned', 'BK-SAMPLE-01', '+91 98765 43212'),
('DRV-104', 'Amit Patel', 'unassigned', NULL, '+91 98765 43213'),
('DRV-105', 'Dinesh Sharma', 'unassigned', NULL, '+91 98765 43214');

-- Seed Notifications
INSERT INTO notifications (notification_id, id, type, booking_id, customer_name, equipment_id, jobsite, start_date, end_date, status) VALUES
('NOTIF-01', 'NOTIF-01', 'delivery_request', 'BK-SAMPLE-01', 'Jane Doe', 'EX-402', 'North Quarry Site, Gate 2', '2025-04-01', '2025-04-05', 'pending');

-- Seed Complaints
INSERT INTO complaints (complaint_id, id, customer_id, customer_name, booking_id, equipment_id, category, description, status) VALUES
('CMP-101', 'CMP-101', 'usr_customer1', 'Jane Doe', 'BK-SAMPLE-02', 'CR-110', 'Equipment Breakdown / Malfunction', 'Crane hydraulic pressure is fluctuating dangerously during heavy lifting operations.', 'open');

-- =====================================================================
-- SCHEMA & SEED COMPLETED SUCCESSFULLY
-- =====================================================================
