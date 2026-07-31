-- =====================================================================
-- SMART RENTAL TRACK — Complete Supabase PostgreSQL Schema & Seeder
-- =====================================================================
-- Safe to run multiple times. Uses IF NOT EXISTS / ON CONFLICT / 
-- DROP POLICY IF EXISTS to prevent errors on re-execution.
-- =====================================================================

-- 1. DROP EXISTING TABLES (CASCADE) — clean slate
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

-- Drop existing policies first to allow re-runs without conflict
DROP POLICY IF EXISTS "Allow public read/write on sites" ON sites;
DROP POLICY IF EXISTS "Allow public read/write on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read/write on equipment" ON equipment;
DROP POLICY IF EXISTS "Allow public read/write on bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public read/write on rentals" ON rentals;
DROP POLICY IF EXISTS "Allow public read/write on alerts" ON alerts;
DROP POLICY IF EXISTS "Allow public read/write on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow public read/write on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public read/write on complaints" ON complaints;

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

-- Seed Sites (including S006-S012 referenced by equipment)
INSERT INTO sites (site_id, name, location, is_active) VALUES
('S001', 'Highway Construction Zone A', 'Chennai, TN', true),
('S002', 'Metro Rail Extension', 'Bangalore, KA', true),
('S003', 'Industrial Park Development', 'Hyderabad, TS', true),
('S004', 'River Dam Construction', 'Pune, MH', true),
('S005', 'Mining Operations East', 'Ranchi, JH', true),
('S006', 'Coastal Roadwork Phase II', 'Vizag, AP', true),
('S007', 'Bridge Overpass Expansion', 'Nagpur, MH', true),
('S008', 'Underground Tunnel Project', 'Kolkata, WB', true);

-- Seed Equipment (only references S001-S008 which all exist now)
INSERT INTO equipment (equipment_id, id, type, status, current_site_id, site, rental_days, operator) VALUES
('EQX1001', 'EQX1001', 'Excavator', 'In Use', 'S003', 'Industrial Park Development', '15 Days', 'Operator OP101'),
('EQX1002', 'EQX1002', 'Crane', 'Available', NULL, 'Unassigned Site Pool', '20 Days', 'Unassigned'),
('EQX1003', 'EQX1003', 'Bulldozer', 'Active', 'S002', 'Metro Rail Extension', '25 Days', 'Operator OP203'),
('EQX1004', 'EQX1004', 'Excavator', 'In Use', 'S004', 'River Dam Construction', '10 Days', 'Operator OP106'),
('EQX1005', 'EQX1005', 'Bulldozer', 'Active', 'S006', 'Coastal Roadwork Phase II', '30 Days', 'Operator OP301'),
('EQX1006', 'EQX1006', 'Grader', 'In Use', 'S001', 'Highway Construction Zone A', '18 Days', 'Operator OP114'),
('EQX1007', 'EQX1007', 'Excavator', 'Available', NULL, 'Unassigned Site Pool', '12 Days', 'Unassigned'),
('EQX1008', 'EQX1008', 'Excavator', 'In Use', 'S001', 'Highway Construction Zone A', '3 Days', 'Operator OP101'),
('EQX1009', 'EQX1009', 'Crane', 'In Use', 'S002', 'Metro Rail Extension', '4 Days', 'Operator OP102'),
('EQX1010', 'EQX1010', 'Bulldozer', 'Active', 'S003', 'Industrial Park Development', '5 Days', 'Operator OP103'),
('EQX1011', 'EQX1011', 'Grader', 'In Use', 'S004', 'River Dam Construction', '6 Days', 'Operator OP106'),
('EQX1012', 'EQX1012', 'Loader', 'In Use', 'S005', 'Mining Operations East', '7 Days', 'Operator OP114'),
('EQX1013', 'EQX1013', 'Dump Truck', 'Active', 'S006', 'Coastal Roadwork Phase II', '8 Days', 'Operator OP203'),
('EQX1014', 'EQX1014', 'Backhoe', 'In Use', 'S007', 'Bridge Overpass Expansion', '9 Days', 'Operator OP205'),
('EQX1015', 'EQX1015', 'Forklift', 'In Use', 'S008', 'Underground Tunnel Project', '10 Days', 'Operator OP301'),
('EQX1016', 'EQX1016', 'Compactor', 'Available', NULL, 'Unassigned Site Pool', '11 Days', 'Operator OP308'),
('EQX1017', 'EQX1017', 'Skid Steer', 'In Use', 'S001', 'Highway Construction Zone A', '12 Days', 'Unassigned'),
('EQX1018', 'EQX1018', 'Excavator', 'In Use', 'S002', 'Metro Rail Extension', '13 Days', 'Operator OP101'),
('EQX1019', 'EQX1019', 'Crane', 'Active', 'S003', 'Industrial Park Development', '14 Days', 'Operator OP102'),
('EQX1020', 'EQX1020', 'Bulldozer', 'In Use', 'S004', 'River Dam Construction', '15 Days', 'Operator OP103'),
('EQX1021', 'EQX1021', 'Grader', 'In Use', 'S005', 'Mining Operations East', '16 Days', 'Operator OP106'),
('EQX1022', 'EQX1022', 'Loader', 'Active', 'S006', 'Coastal Roadwork Phase II', '17 Days', 'Operator OP114'),
('EQX1023', 'EQX1023', 'Dump Truck', 'In Use', 'S007', 'Bridge Overpass Expansion', '18 Days', 'Operator OP203'),
('EQX1024', 'EQX1024', 'Backhoe', 'In Use', 'S008', 'Underground Tunnel Project', '19 Days', 'Operator OP205'),
('EQX1025', 'EQX1025', 'Forklift', 'Available', NULL, 'Unassigned Site Pool', '20 Days', 'Operator OP301'),
('EQX1026', 'EQX1026', 'Compactor', 'In Use', 'S001', 'Highway Construction Zone A', '21 Days', 'Operator OP308'),
('EQX1027', 'EQX1027', 'Skid Steer', 'In Use', 'S002', 'Metro Rail Extension', '22 Days', 'Unassigned'),
('EQX1028', 'EQX1028', 'Excavator', 'Active', 'S003', 'Industrial Park Development', '23 Days', 'Operator OP101'),
('EQX1029', 'EQX1029', 'Crane', 'In Use', 'S004', 'River Dam Construction', '24 Days', 'Operator OP102'),
('EQX1030', 'EQX1030', 'Bulldozer', 'In Use', 'S005', 'Mining Operations East', '25 Days', 'Operator OP103'),
('EQX1031', 'EQX1031', 'Grader', 'Active', 'S006', 'Coastal Roadwork Phase II', '26 Days', 'Operator OP106'),
('EQX1032', 'EQX1032', 'Loader', 'In Use', 'S007', 'Bridge Overpass Expansion', '27 Days', 'Operator OP114'),
('EQX1033', 'EQX1033', 'Dump Truck', 'In Use', 'S008', 'Underground Tunnel Project', '28 Days', 'Operator OP203'),
('EQX1034', 'EQX1034', 'Backhoe', 'Available', NULL, 'Unassigned Site Pool', '29 Days', 'Operator OP205'),
('EQX1035', 'EQX1035', 'Forklift', 'In Use', 'S001', 'Highway Construction Zone A', '30 Days', 'Operator OP301'),
('EQX1036', 'EQX1036', 'Compactor', 'In Use', 'S002', 'Metro Rail Extension', '3 Days', 'Operator OP308'),
('EQX1037', 'EQX1037', 'Skid Steer', 'Active', 'S003', 'Industrial Park Development', '4 Days', 'Unassigned'),
('EQX1038', 'EQX1038', 'Excavator', 'In Use', 'S004', 'River Dam Construction', '5 Days', 'Operator OP101'),
('EQX1039', 'EQX1039', 'Crane', 'In Use', 'S005', 'Mining Operations East', '6 Days', 'Operator OP102'),
('EQX1040', 'EQX1040', 'Bulldozer', 'Active', 'S006', 'Coastal Roadwork Phase II', '7 Days', 'Operator OP103'),
('EQX1041', 'EQX1041', 'Grader', 'In Use', 'S007', 'Bridge Overpass Expansion', '8 Days', 'Operator OP106'),
('EQX1042', 'EQX1042', 'Loader', 'In Use', 'S008', 'Underground Tunnel Project', '9 Days', 'Operator OP114'),
('EQX1043', 'EQX1043', 'Dump Truck', 'Available', NULL, 'Unassigned Site Pool', '10 Days', 'Operator OP203'),
('EQX1044', 'EQX1044', 'Backhoe', 'In Use', 'S001', 'Highway Construction Zone A', '11 Days', 'Operator OP205'),
('EQX1045', 'EQX1045', 'Forklift', 'In Use', 'S002', 'Metro Rail Extension', '12 Days', 'Operator OP301'),
('EQX1046', 'EQX1046', 'Compactor', 'Active', 'S003', 'Industrial Park Development', '13 Days', 'Operator OP308'),
('EQX1047', 'EQX1047', 'Skid Steer', 'In Use', 'S004', 'River Dam Construction', '14 Days', 'Unassigned'),
('EQX1048', 'EQX1048', 'Excavator', 'In Use', 'S005', 'Mining Operations East', '15 Days', 'Operator OP101'),
('EQX1049', 'EQX1049', 'Crane', 'Active', 'S006', 'Coastal Roadwork Phase II', '16 Days', 'Operator OP102'),
('EQX1050', 'EQX1050', 'Bulldozer', 'In Use', 'S007', 'Bridge Overpass Expansion', '17 Days', 'Operator OP103'),
('EQX1051', 'EQX1051', 'Grader', 'In Use', 'S008', 'Underground Tunnel Project', '18 Days', 'Operator OP106'),
('EQX1052', 'EQX1052', 'Loader', 'Available', NULL, 'Unassigned Site Pool', '19 Days', 'Operator OP114'),
('EQX1053', 'EQX1053', 'Dump Truck', 'In Use', 'S001', 'Highway Construction Zone A', '20 Days', 'Operator OP203'),
('EQX1054', 'EQX1054', 'Backhoe', 'In Use', 'S002', 'Metro Rail Extension', '21 Days', 'Operator OP205'),
('EQX1055', 'EQX1055', 'Forklift', 'Active', 'S003', 'Industrial Park Development', '22 Days', 'Operator OP301'),
('EQX1056', 'EQX1056', 'Compactor', 'In Use', 'S004', 'River Dam Construction', '23 Days', 'Operator OP308'),
('EQX1057', 'EQX1057', 'Skid Steer', 'In Use', 'S005', 'Mining Operations East', '24 Days', 'Unassigned'),
('EQX1058', 'EQX1058', 'Excavator', 'Active', 'S006', 'Coastal Roadwork Phase II', '25 Days', 'Operator OP101'),
('EQX1059', 'EQX1059', 'Crane', 'In Use', 'S007', 'Bridge Overpass Expansion', '26 Days', 'Operator OP102'),
('EQX1060', 'EQX1060', 'Bulldozer', 'In Use', 'S008', 'Underground Tunnel Project', '27 Days', 'Operator OP103'),
('EQX1061', 'EQX1061', 'Grader', 'Available', NULL, 'Unassigned Site Pool', '28 Days', 'Operator OP106'),
('EQX1062', 'EQX1062', 'Loader', 'In Use', 'S001', 'Highway Construction Zone A', '29 Days', 'Operator OP114'),
('EQX1063', 'EQX1063', 'Dump Truck', 'In Use', 'S002', 'Metro Rail Extension', '30 Days', 'Operator OP203'),
('EQX1064', 'EQX1064', 'Backhoe', 'Active', 'S003', 'Industrial Park Development', '3 Days', 'Operator OP205'),
('EQX1065', 'EQX1065', 'Forklift', 'In Use', 'S004', 'River Dam Construction', '4 Days', 'Operator OP301'),
('EQX1066', 'EQX1066', 'Compactor', 'In Use', 'S005', 'Mining Operations East', '5 Days', 'Operator OP308'),
('EQX1067', 'EQX1067', 'Skid Steer', 'Active', 'S006', 'Coastal Roadwork Phase II', '6 Days', 'Unassigned'),
('EQX1068', 'EQX1068', 'Excavator', 'In Use', 'S007', 'Bridge Overpass Expansion', '7 Days', 'Operator OP101'),
('EQX1069', 'EQX1069', 'Crane', 'In Use', 'S008', 'Underground Tunnel Project', '8 Days', 'Operator OP102'),
('EQX1070', 'EQX1070', 'Bulldozer', 'Available', NULL, 'Unassigned Site Pool', '9 Days', 'Operator OP103'),
('EQX1071', 'EQX1071', 'Grader', 'In Use', 'S001', 'Highway Construction Zone A', '10 Days', 'Operator OP106'),
('EQX1072', 'EQX1072', 'Loader', 'In Use', 'S002', 'Metro Rail Extension', '11 Days', 'Operator OP114'),
('EQX1073', 'EQX1073', 'Dump Truck', 'Active', 'S003', 'Industrial Park Development', '12 Days', 'Operator OP203'),
('EQX1074', 'EQX1074', 'Backhoe', 'In Use', 'S004', 'River Dam Construction', '13 Days', 'Operator OP205'),
('EQX1075', 'EQX1075', 'Forklift', 'In Use', 'S005', 'Mining Operations East', '14 Days', 'Operator OP301'),
('EQX1076', 'EQX1076', 'Compactor', 'Active', 'S006', 'Coastal Roadwork Phase II', '15 Days', 'Operator OP308'),
('EQX1077', 'EQX1077', 'Skid Steer', 'In Use', 'S007', 'Bridge Overpass Expansion', '16 Days', 'Unassigned'),
('EQX1078', 'EQX1078', 'Excavator', 'In Use', 'S008', 'Underground Tunnel Project', '17 Days', 'Operator OP101'),
('EQX1079', 'EQX1079', 'Crane', 'Available', NULL, 'Unassigned Site Pool', '18 Days', 'Operator OP102'),
('EQX1080', 'EQX1080', 'Bulldozer', 'In Use', 'S001', 'Highway Construction Zone A', '19 Days', 'Operator OP103'),
('EQX1081', 'EQX1081', 'Grader', 'In Use', 'S002', 'Metro Rail Extension', '20 Days', 'Operator OP106'),
('EQX1082', 'EQX1082', 'Loader', 'Active', 'S003', 'Industrial Park Development', '21 Days', 'Operator OP114'),
('EQX1083', 'EQX1083', 'Dump Truck', 'In Use', 'S004', 'River Dam Construction', '22 Days', 'Operator OP203'),
('EQX1084', 'EQX1084', 'Backhoe', 'In Use', 'S005', 'Mining Operations East', '23 Days', 'Operator OP205'),
('EQX1085', 'EQX1085', 'Forklift', 'Active', 'S006', 'Coastal Roadwork Phase II', '24 Days', 'Operator OP301'),
('EQX1086', 'EQX1086', 'Compactor', 'In Use', 'S007', 'Bridge Overpass Expansion', '25 Days', 'Operator OP308'),
('EQX1087', 'EQX1087', 'Skid Steer', 'In Use', 'S008', 'Underground Tunnel Project', '26 Days', 'Unassigned'),
('EQX1088', 'EQX1088', 'Excavator', 'Available', NULL, 'Unassigned Site Pool', '27 Days', 'Operator OP101'),
('EQX1089', 'EQX1089', 'Crane', 'In Use', 'S001', 'Highway Construction Zone A', '28 Days', 'Operator OP102'),
('EQX1090', 'EQX1090', 'Bulldozer', 'In Use', 'S002', 'Metro Rail Extension', '29 Days', 'Operator OP103'),
('EQX1091', 'EQX1091', 'Grader', 'Active', 'S003', 'Industrial Park Development', '30 Days', 'Operator OP106'),
('EQX1092', 'EQX1092', 'Loader', 'In Use', 'S004', 'River Dam Construction', '3 Days', 'Operator OP114'),
('EQX1093', 'EQX1093', 'Dump Truck', 'In Use', 'S005', 'Mining Operations East', '4 Days', 'Operator OP203'),
('EQX1094', 'EQX1094', 'Backhoe', 'Active', 'S006', 'Coastal Roadwork Phase II', '5 Days', 'Operator OP205'),
('EQX1095', 'EQX1095', 'Forklift', 'In Use', 'S007', 'Bridge Overpass Expansion', '6 Days', 'Operator OP301'),
('EQX1096', 'EQX1096', 'Compactor', 'In Use', 'S008', 'Underground Tunnel Project', '7 Days', 'Operator OP308'),
('EQX1097', 'EQX1097', 'Skid Steer', 'Available', NULL, 'Unassigned Site Pool', '8 Days', 'Unassigned'),
('EQX1098', 'EQX1098', 'Excavator', 'In Use', 'S001', 'Highway Construction Zone A', '9 Days', 'Operator OP101'),
('EQX1099', 'EQX1099', 'Crane', 'In Use', 'S002', 'Metro Rail Extension', '10 Days', 'Operator OP102'),
('EQX1100', 'EQX1100', 'Bulldozer', 'Active', 'S003', 'Industrial Park Development', '11 Days', 'Operator OP103');

-- Seed Bookings (references EQX equipment IDs that exist above)
INSERT INTO bookings (booking_id, id, equipment_id, customer_id, customer_name, customer_email, jobsite, start_date, end_date, transportation_type, estimated_cost, agreement_accepted, license_number, weather_confirmed, status, driver_id) VALUES
('BK-SAMPLE-01', 'BK-SAMPLE-01', 'EQX1001', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'North Quarry Site, Gate 2', '2025-04-01', '2025-04-05', 'delivery', 4000, true, 'DL-998827361', true, 'PENDING_EMPLOYEE_SCAN', NULL),
('BK-SAMPLE-02', 'BK-SAMPLE-02', 'EQX1009', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'Harbor Expansion, Dock 4', '2025-03-10', '2025-03-20', 'pickup', 10000, true, 'DL-998827361', true, 'HANDOVER_ACCEPTED', NULL),
('BK-SAMPLE-03', 'BK-SAMPLE-03', 'EQX1003', 'usr_customer2', 'Arjun Mehta', 'arjun@buildcorp.com', 'Metro Extension Zone C', '2025-05-01', '2025-05-15', 'delivery', 7500, true, 'DL-112233445', true, 'PENDING_EMPLOYEE_SCAN', NULL);

-- Seed Rentals
INSERT INTO rentals (id, equipment_id, site_id, operator_id, check_in_date, check_out_date, engine_hours_day, idle_hours_day, fuel_level, notes) VALUES
('R-1001', 'EQX1001', 'S003', 'OP101', '2025-04-01', '2025-04-16', 1.5, 10, 92, 'Telemetry: engine 1.5h/day, idle 10h/day'),
('R-1002', 'EQX1002', 'S001', 'OP101', '2025-03-10', '2025-03-30', 0, 11, 80, 'Telemetry: engine 0h/day, idle 11h/day'),
('R-1003', 'EQX1003', 'S002', 'OP203', '2025-02-15', '2025-03-11', 7.5, 0.5, 96, 'Telemetry: engine 7.5h/day, idle 0.5h/day'),
('R-1004', 'EQX1004', 'S004', 'OP106', '2025-05-05', '2025-05-15', 2, 9, 63, 'Telemetry: engine 2h/day, idle 9h/day'),
('R-1005', 'EQX1005', 'S006', 'OP301', '2025-01-01', '2025-01-31', 8, 0, 74, 'Telemetry: engine 8h/day, idle 0h/day'),
('R-1006', 'EQX1006', 'S001', 'OP114', '2025-04-05', '2025-04-23', 3, 6, 63, 'Telemetry: engine 3h/day, idle 6h/day'),
('R-1007', 'EQX1007', 'S001', 'OP101', '2025-03-20', '2025-04-01', 0, 12, 71, 'Telemetry: engine 0h/day, idle 12h/day'),
('R-1008', 'EQX1008', 'S001', 'OP101', '2025-04-09', '2025-05-13', 0.5, 3, 68, 'Telemetry: engine 0.5h/day, idle 3h/day'),
('R-1009', 'EQX1009', 'S002', 'OP102', '2025-05-10', '2025-06-14', 3.5, 5, 68, 'Telemetry: engine 3.5h/day, idle 5h/day'),
('R-1010', 'EQX1010', 'S003', 'OP103', '2025-01-11', '2025-02-15', 6.5, 7, 62, 'Telemetry: engine 6.5h/day, idle 7h/day'),
('R-1011', 'EQX1011', 'S004', 'OP106', '2025-02-12', '2025-03-16', 0.5, 9, 86, 'Telemetry: engine 0.5h/day, idle 9h/day'),
('R-1012', 'EQX1012', 'S005', 'OP114', '2025-03-13', '2025-04-17', 3.5, 0, 92, 'Telemetry: engine 3.5h/day, idle 0h/day'),
('R-1013', 'EQX1013', 'S006', 'OP203', '2025-04-14', '2025-05-18', 6.5, 2, 60, 'Telemetry: engine 6.5h/day, idle 2h/day'),
('R-1014', 'EQX1014', 'S007', 'OP205', '2025-05-15', '2025-06-19', 0.5, 4, 79, 'Telemetry: engine 0.5h/day, idle 4h/day'),
('R-1015', 'EQX1015', 'S008', 'OP301', '2025-01-16', '2025-02-20', 3.5, 6, 94, 'Telemetry: engine 3.5h/day, idle 6h/day'),
('R-1016', 'EQX1016', 'S001', 'OP308', '2025-02-17', '2025-03-21', 6.5, 8, 79, 'Telemetry: engine 6.5h/day, idle 8h/day'),
('R-1017', 'EQX1017', 'S001', 'OP101', '2025-03-18', '2025-04-22', 0.5, 10, 72, 'Telemetry: engine 0.5h/day, idle 10h/day'),
('R-1018', 'EQX1018', 'S002', 'OP101', '2025-04-19', '2025-05-23', 3.5, 1, 66, 'Telemetry: engine 3.5h/day, idle 1h/day'),
('R-1019', 'EQX1019', 'S003', 'OP102', '2025-05-20', '2025-06-24', 6.5, 3, 72, 'Telemetry: engine 6.5h/day, idle 3h/day'),
('R-1020', 'EQX1020', 'S004', 'OP103', '2025-01-01', '2025-02-05', 0.5, 5, 80, 'Telemetry: engine 0.5h/day, idle 5h/day'),
('R-1021', 'EQX1021', 'S005', 'OP106', '2025-02-02', '2025-03-06', 3.5, 7, 69, 'Telemetry: engine 3.5h/day, idle 7h/day'),
('R-1022', 'EQX1022', 'S006', 'OP114', '2025-03-03', '2025-04-07', 6.5, 9, 85, 'Telemetry: engine 6.5h/day, idle 9h/day'),
('R-1023', 'EQX1023', 'S007', 'OP203', '2025-04-04', '2025-05-08', 0.5, 0, 73, 'Telemetry: engine 0.5h/day, idle 0h/day'),
('R-1024', 'EQX1024', 'S008', 'OP205', '2025-05-05', '2025-06-09', 3.5, 2, 71, 'Telemetry: engine 3.5h/day, idle 2h/day'),
('R-1025', 'EQX1025', 'S001', 'OP301', '2025-01-06', '2025-02-10', 6.5, 4, 98, 'Telemetry: engine 6.5h/day, idle 4h/day'),
('R-1026', 'EQX1026', 'S001', 'OP308', '2025-02-07', '2025-03-11', 0.5, 6, 78, 'Telemetry: engine 0.5h/day, idle 6h/day'),
('R-1027', 'EQX1027', 'S002', 'OP101', '2025-03-08', '2025-04-12', 3.5, 8, 74, 'Telemetry: engine 3.5h/day, idle 8h/day'),
('R-1028', 'EQX1028', 'S003', 'OP101', '2025-04-09', '2025-05-13', 6.5, 10, 88, 'Telemetry: engine 6.5h/day, idle 10h/day'),
('R-1029', 'EQX1029', 'S004', 'OP102', '2025-05-10', '2025-06-14', 0.5, 1, 99, 'Telemetry: engine 0.5h/day, idle 1h/day'),
('R-1030', 'EQX1030', 'S005', 'OP103', '2025-01-11', '2025-02-15', 3.5, 3, 78, 'Telemetry: engine 3.5h/day, idle 3h/day');

-- Seed Alerts (references EQX equipment IDs that exist above)
INSERT INTO alerts (id, equipment_id, site_id, risk_level, anomaly_score, flags, is_resolved) VALUES
('ALT-101', 'EQX1008', 'S001', 'critical', -0.18, '["unauthorized_movement", "no_operator"]'::jsonb, false),
('ALT-102', 'EQX1009', 'S002', 'critical', -0.22, '["overdue_rental", "missing_check_out"]'::jsonb, false),
('ALT-103', 'EQX1010', 'S003', 'medium', -0.04, '["excessive_idle"]'::jsonb, false),
('ALT-104', 'EQX1004', 'S004', 'high', -0.12, '["impossible_hours", "extended_rental"]'::jsonb, false),
('ALT-105', 'EQX1007', 'S001', 'low', 0.05, '["unassigned_site"]'::jsonb, true);

-- Seed Drivers
INSERT INTO drivers (driver_id, name, status, assigned_booking_id, phone) VALUES
('DRV-101', 'Rajesh Kumar', 'unassigned', NULL, '+91 98765 43210'),
('DRV-102', 'Suresh Verma', 'unassigned', NULL, '+91 98765 43211'),
('DRV-103', 'Vikram Singh', 'assigned', 'BK-SAMPLE-01', '+91 98765 43212'),
('DRV-104', 'Amit Patel', 'unassigned', NULL, '+91 98765 43213'),
('DRV-105', 'Dinesh Sharma', 'unassigned', NULL, '+91 98765 43214');

-- Seed Notifications (references booking IDs that exist above)
INSERT INTO notifications (notification_id, id, type, booking_id, customer_name, equipment_id, jobsite, start_date, end_date, status) VALUES
('NOTIF-01', 'NOTIF-01', 'delivery_request', 'BK-SAMPLE-01', 'Jane Doe', 'EQX1001', 'North Quarry Site, Gate 2', '2025-04-01', '2025-04-05', 'pending'),
('NOTIF-02', 'NOTIF-02', 'delivery_request', 'BK-SAMPLE-03', 'Arjun Mehta', 'EQX1003', 'Metro Extension Zone C', '2025-05-01', '2025-05-15', 'pending');

-- Seed Complaints (references equipment IDs that exist above)
INSERT INTO complaints (complaint_id, id, customer_id, customer_name, booking_id, equipment_id, category, description, status) VALUES
('CMP-101', 'CMP-101', 'usr_customer1', 'Jane Doe', 'BK-SAMPLE-02', 'EQX1009', 'Equipment Breakdown / Malfunction', 'Crane hydraulic pressure is fluctuating dangerously during heavy lifting operations.', 'open'),
('CMP-102', 'CMP-102', 'usr_customer2', 'Arjun Mehta', 'BK-SAMPLE-03', 'EQX1003', 'Late Delivery', 'Bulldozer was delivered 4 hours late to the Metro Extension site.', 'open');

-- =====================================================================
-- ✅ SCHEMA & SEED COMPLETED SUCCESSFULLY
-- 9 tables created | 8 sites | 100 equipment | 3 bookings | 
-- 30 rentals | 5 alerts | 5 drivers | 2 notifications | 2 complaints
-- =====================================================================
