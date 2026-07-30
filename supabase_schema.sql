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
INSERT INTO equipment (equipment_id, id, type, status, current_site_id, site, rental_days, operator) VALUES
('EQX1001', 'EQX1001', 'Excavator', 'In Use', 'S003', 'Site S003', '15 Days', 'Operator OP101'),
('EQX1002', 'EQX1002', 'Crane', 'Available', NULL, 'Unassigned Site Pool', '20 Days', 'Unassigned'),
('EQX1003', 'EQX1003', 'Bulldozer', 'Active', 'S002', 'Site S002', '25 Days', 'Operator OP203'),
('EQX1004', 'EQX1004', 'Excavator', 'In Use', 'S004', 'Site S004', '10 Days', 'Operator OP106'),
('EQX1005', 'EQX1005', 'Bulldozer', 'Active', 'S006', 'Site S006', '30 Days', 'Operator OP301'),
('EQX1006', 'EQX1006', 'Grader', 'In Use', 'S001', 'Site S001', '18 Days', 'Operator OP114'),
('EQX1007', 'EQX1007', 'Excavator', 'Available', NULL, 'Unassigned Site Pool', '12 Days', 'Unassigned'),
('EQX1008', 'EQX1008', 'Excavator', 'In Use', 'S001', 'Site S001', '3 Days', 'Operator OP101'),
('EQX1009', 'EQX1009', 'Crane', 'In Use', 'S002', 'Site S002', '4 Days', 'Operator OP102'),
('EQX1010', 'EQX1010', 'Bulldozer', 'Active', 'S003', 'Site S003', '5 Days', 'Operator OP103'),
('EQX1011', 'EQX1011', 'Grader', 'In Use', 'S004', 'Site S004', '6 Days', 'Operator OP106'),
('EQX1012', 'EQX1012', 'Loader', 'In Use', 'S005', 'Site S005', '7 Days', 'Operator OP114'),
('EQX1013', 'EQX1013', 'Dump Truck', 'Active', 'S006', 'Site S006', '8 Days', 'Operator OP203'),
('EQX1014', 'EQX1014', 'Backhoe', 'In Use', 'S007', 'Site S007', '9 Days', 'Operator OP205'),
('EQX1015', 'EQX1015', 'Forklift', 'In Use', 'S008', 'Site S008', '10 Days', 'Operator OP301'),
('EQX1016', 'EQX1016', 'Compactor', 'Available', NULL, 'Unassigned Site Pool', '11 Days', 'Operator OP308'),
('EQX1017', 'EQX1017', 'Skid Steer', 'In Use', 'S001', 'Site S001', '12 Days', 'Unassigned'),
('EQX1018', 'EQX1018', 'Excavator', 'In Use', 'S002', 'Site S002', '13 Days', 'Operator OP101'),
('EQX1019', 'EQX1019', 'Crane', 'Active', 'S003', 'Site S003', '14 Days', 'Operator OP102'),
('EQX1020', 'EQX1020', 'Bulldozer', 'In Use', 'S004', 'Site S004', '15 Days', 'Operator OP103'),
('EQX1021', 'EQX1021', 'Grader', 'In Use', 'S005', 'Site S005', '16 Days', 'Operator OP106'),
('EQX1022', 'EQX1022', 'Loader', 'Active', 'S006', 'Site S006', '17 Days', 'Operator OP114'),
('EQX1023', 'EQX1023', 'Dump Truck', 'In Use', 'S007', 'Site S007', '18 Days', 'Operator OP203'),
('EQX1024', 'EQX1024', 'Backhoe', 'In Use', 'S008', 'Site S008', '19 Days', 'Operator OP205'),
('EQX1025', 'EQX1025', 'Forklift', 'Available', NULL, 'Unassigned Site Pool', '20 Days', 'Operator OP301'),
('EQX1026', 'EQX1026', 'Compactor', 'In Use', 'S001', 'Site S001', '21 Days', 'Operator OP308'),
('EQX1027', 'EQX1027', 'Skid Steer', 'In Use', 'S002', 'Site S002', '22 Days', 'Unassigned'),
('EQX1028', 'EQX1028', 'Excavator', 'Active', 'S003', 'Site S003', '23 Days', 'Operator OP101'),
('EQX1029', 'EQX1029', 'Crane', 'In Use', 'S004', 'Site S004', '24 Days', 'Operator OP102'),
('EQX1030', 'EQX1030', 'Bulldozer', 'In Use', 'S005', 'Site S005', '25 Days', 'Operator OP103'),
('EQX1031', 'EQX1031', 'Grader', 'Active', 'S006', 'Site S006', '26 Days', 'Operator OP106'),
('EQX1032', 'EQX1032', 'Loader', 'In Use', 'S007', 'Site S007', '27 Days', 'Operator OP114'),
('EQX1033', 'EQX1033', 'Dump Truck', 'In Use', 'S008', 'Site S008', '28 Days', 'Operator OP203'),
('EQX1034', 'EQX1034', 'Backhoe', 'Available', NULL, 'Unassigned Site Pool', '29 Days', 'Operator OP205'),
('EQX1035', 'EQX1035', 'Forklift', 'In Use', 'S001', 'Site S001', '30 Days', 'Operator OP301'),
('EQX1036', 'EQX1036', 'Compactor', 'In Use', 'S002', 'Site S002', '3 Days', 'Operator OP308'),
('EQX1037', 'EQX1037', 'Skid Steer', 'Active', 'S003', 'Site S003', '4 Days', 'Unassigned'),
('EQX1038', 'EQX1038', 'Excavator', 'In Use', 'S004', 'Site S004', '5 Days', 'Operator OP101'),
('EQX1039', 'EQX1039', 'Crane', 'In Use', 'S005', 'Site S005', '6 Days', 'Operator OP102'),
('EQX1040', 'EQX1040', 'Bulldozer', 'Active', 'S006', 'Site S006', '7 Days', 'Operator OP103'),
('EQX1041', 'EQX1041', 'Grader', 'In Use', 'S007', 'Site S007', '8 Days', 'Operator OP106'),
('EQX1042', 'EQX1042', 'Loader', 'In Use', 'S008', 'Site S008', '9 Days', 'Operator OP114'),
('EQX1043', 'EQX1043', 'Dump Truck', 'Available', NULL, 'Unassigned Site Pool', '10 Days', 'Operator OP203'),
('EQX1044', 'EQX1044', 'Backhoe', 'In Use', 'S001', 'Site S001', '11 Days', 'Operator OP205'),
('EQX1045', 'EQX1045', 'Forklift', 'In Use', 'S002', 'Site S002', '12 Days', 'Operator OP301'),
('EQX1046', 'EQX1046', 'Compactor', 'Active', 'S003', 'Site S003', '13 Days', 'Operator OP308'),
('EQX1047', 'EQX1047', 'Skid Steer', 'In Use', 'S004', 'Site S004', '14 Days', 'Unassigned'),
('EQX1048', 'EQX1048', 'Excavator', 'In Use', 'S005', 'Site S005', '15 Days', 'Operator OP101'),
('EQX1049', 'EQX1049', 'Crane', 'Active', 'S006', 'Site S006', '16 Days', 'Operator OP102'),
('EQX1050', 'EQX1050', 'Bulldozer', 'In Use', 'S007', 'Site S007', '17 Days', 'Operator OP103'),
('EQX1051', 'EQX1051', 'Grader', 'In Use', 'S008', 'Site S008', '18 Days', 'Operator OP106'),
('EQX1052', 'EQX1052', 'Loader', 'Available', NULL, 'Unassigned Site Pool', '19 Days', 'Operator OP114'),
('EQX1053', 'EQX1053', 'Dump Truck', 'In Use', 'S001', 'Site S001', '20 Days', 'Operator OP203'),
('EQX1054', 'EQX1054', 'Backhoe', 'In Use', 'S002', 'Site S002', '21 Days', 'Operator OP205'),
('EQX1055', 'EQX1055', 'Forklift', 'Active', 'S003', 'Site S003', '22 Days', 'Operator OP301'),
('EQX1056', 'EQX1056', 'Compactor', 'In Use', 'S004', 'Site S004', '23 Days', 'Operator OP308'),
('EQX1057', 'EQX1057', 'Skid Steer', 'In Use', 'S005', 'Site S005', '24 Days', 'Unassigned'),
('EQX1058', 'EQX1058', 'Excavator', 'Active', 'S006', 'Site S006', '25 Days', 'Operator OP101'),
('EQX1059', 'EQX1059', 'Crane', 'In Use', 'S007', 'Site S007', '26 Days', 'Operator OP102'),
('EQX1060', 'EQX1060', 'Bulldozer', 'In Use', 'S008', 'Site S008', '27 Days', 'Operator OP103'),
('EQX1061', 'EQX1061', 'Grader', 'Available', NULL, 'Unassigned Site Pool', '28 Days', 'Operator OP106'),
('EQX1062', 'EQX1062', 'Loader', 'In Use', 'S001', 'Site S001', '29 Days', 'Operator OP114'),
('EQX1063', 'EQX1063', 'Dump Truck', 'In Use', 'S002', 'Site S002', '30 Days', 'Operator OP203'),
('EQX1064', 'EQX1064', 'Backhoe', 'Active', 'S003', 'Site S003', '3 Days', 'Operator OP205'),
('EQX1065', 'EQX1065', 'Forklift', 'In Use', 'S004', 'Site S004', '4 Days', 'Operator OP301'),
('EQX1066', 'EQX1066', 'Compactor', 'In Use', 'S005', 'Site S005', '5 Days', 'Operator OP308'),
('EQX1067', 'EQX1067', 'Skid Steer', 'Active', 'S006', 'Site S006', '6 Days', 'Unassigned'),
('EQX1068', 'EQX1068', 'Excavator', 'In Use', 'S007', 'Site S007', '7 Days', 'Operator OP101'),
('EQX1069', 'EQX1069', 'Crane', 'In Use', 'S008', 'Site S008', '8 Days', 'Operator OP102'),
('EQX1070', 'EQX1070', 'Bulldozer', 'Available', NULL, 'Unassigned Site Pool', '9 Days', 'Operator OP103'),
('EQX1071', 'EQX1071', 'Grader', 'In Use', 'S001', 'Site S001', '10 Days', 'Operator OP106'),
('EQX1072', 'EQX1072', 'Loader', 'In Use', 'S002', 'Site S002', '11 Days', 'Operator OP114'),
('EQX1073', 'EQX1073', 'Dump Truck', 'Active', 'S003', 'Site S003', '12 Days', 'Operator OP203'),
('EQX1074', 'EQX1074', 'Backhoe', 'In Use', 'S004', 'Site S004', '13 Days', 'Operator OP205'),
('EQX1075', 'EQX1075', 'Forklift', 'In Use', 'S005', 'Site S005', '14 Days', 'Operator OP301'),
('EQX1076', 'EQX1076', 'Compactor', 'Active', 'S006', 'Site S006', '15 Days', 'Operator OP308'),
('EQX1077', 'EQX1077', 'Skid Steer', 'In Use', 'S007', 'Site S007', '16 Days', 'Unassigned'),
('EQX1078', 'EQX1078', 'Excavator', 'In Use', 'S008', 'Site S008', '17 Days', 'Operator OP101'),
('EQX1079', 'EQX1079', 'Crane', 'Available', NULL, 'Unassigned Site Pool', '18 Days', 'Operator OP102'),
('EQX1080', 'EQX1080', 'Bulldozer', 'In Use', 'S001', 'Site S001', '19 Days', 'Operator OP103'),
('EQX1081', 'EQX1081', 'Grader', 'In Use', 'S002', 'Site S002', '20 Days', 'Operator OP106'),
('EQX1082', 'EQX1082', 'Loader', 'Active', 'S003', 'Site S003', '21 Days', 'Operator OP114'),
('EQX1083', 'EQX1083', 'Dump Truck', 'In Use', 'S004', 'Site S004', '22 Days', 'Operator OP203'),
('EQX1084', 'EQX1084', 'Backhoe', 'In Use', 'S005', 'Site S005', '23 Days', 'Operator OP205'),
('EQX1085', 'EQX1085', 'Forklift', 'Active', 'S006', 'Site S006', '24 Days', 'Operator OP301'),
('EQX1086', 'EQX1086', 'Compactor', 'In Use', 'S007', 'Site S007', '25 Days', 'Operator OP308'),
('EQX1087', 'EQX1087', 'Skid Steer', 'In Use', 'S008', 'Site S008', '26 Days', 'Unassigned'),
('EQX1088', 'EQX1088', 'Excavator', 'Available', NULL, 'Unassigned Site Pool', '27 Days', 'Operator OP101'),
('EQX1089', 'EQX1089', 'Crane', 'In Use', 'S001', 'Site S001', '28 Days', 'Operator OP102'),
('EQX1090', 'EQX1090', 'Bulldozer', 'In Use', 'S002', 'Site S002', '29 Days', 'Operator OP103'),
('EQX1091', 'EQX1091', 'Grader', 'Active', 'S003', 'Site S003', '30 Days', 'Operator OP106'),
('EQX1092', 'EQX1092', 'Loader', 'In Use', 'S004', 'Site S004', '3 Days', 'Operator OP114'),
('EQX1093', 'EQX1093', 'Dump Truck', 'In Use', 'S005', 'Site S005', '4 Days', 'Operator OP203'),
('EQX1094', 'EQX1094', 'Backhoe', 'Active', 'S006', 'Site S006', '5 Days', 'Operator OP205'),
('EQX1095', 'EQX1095', 'Forklift', 'In Use', 'S007', 'Site S007', '6 Days', 'Operator OP301'),
('EQX1096', 'EQX1096', 'Compactor', 'In Use', 'S008', 'Site S008', '7 Days', 'Operator OP308'),
('EQX1097', 'EQX1097', 'Skid Steer', 'Available', NULL, 'Unassigned Site Pool', '8 Days', 'Unassigned'),
('EQX1098', 'EQX1098', 'Excavator', 'In Use', 'S001', 'Site S001', '9 Days', 'Operator OP101'),
('EQX1099', 'EQX1099', 'Crane', 'In Use', 'S002', 'Site S002', '10 Days', 'Operator OP102'),
('EQX1100', 'EQX1100', 'Bulldozer', 'Active', 'S003', 'Site S003', '11 Days', 'Operator OP103');

-- Seed Bookings
INSERT INTO bookings (booking_id, id, equipment_id, customer_id, customer_name, customer_email, jobsite, start_date, end_date, transportation_type, estimated_cost, agreement_accepted, license_number, weather_confirmed, status, driver_id) VALUES
('BK-SAMPLE-01', 'BK-SAMPLE-01', 'EX-402', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'North Quarry Site, Gate 2', '2025-04-01', '2025-04-05', 'delivery', 4000, true, 'DL-998827361', true, 'PENDING_EMPLOYEE_SCAN', NULL),
('BK-SAMPLE-02', 'BK-SAMPLE-02', 'CR-110', 'usr_customer1', 'Jane Doe', 'jane@contractor.com', 'Harbor Expansion, Dock 4', '2025-03-10', '2025-03-20', 'pickup', 10000, true, 'DL-998827361', true, 'HANDOVER_ACCEPTED', NULL);

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
('R-1030', 'EQX1030', 'S005', 'OP103', '2025-01-11', '2025-02-15', 3.5, 3, 78, 'Telemetry: engine 3.5h/day, idle 3h/day'),
('R-1031', 'EQX1031', 'S006', 'OP106', '2025-02-12', '2025-03-16', 6.5, 5, 83, 'Telemetry: engine 6.5h/day, idle 5h/day'),
('R-1032', 'EQX1032', 'S007', 'OP114', '2025-03-13', '2025-04-17', 0.5, 7, 73, 'Telemetry: engine 0.5h/day, idle 7h/day'),
('R-1033', 'EQX1033', 'S008', 'OP203', '2025-04-14', '2025-05-18', 3.5, 9, 95, 'Telemetry: engine 3.5h/day, idle 9h/day'),
('R-1034', 'EQX1034', 'S001', 'OP205', '2025-05-15', '2025-06-19', 6.5, 0, 80, 'Telemetry: engine 6.5h/day, idle 0h/day'),
('R-1035', 'EQX1035', 'S001', 'OP301', '2025-01-16', '2025-02-20', 0.5, 2, 93, 'Telemetry: engine 0.5h/day, idle 2h/day'),
('R-1036', 'EQX1036', 'S002', 'OP308', '2025-02-17', '2025-03-21', 3.5, 4, 81, 'Telemetry: engine 3.5h/day, idle 4h/day'),
('R-1037', 'EQX1037', 'S003', 'OP101', '2025-03-18', '2025-04-22', 6.5, 6, 69, 'Telemetry: engine 6.5h/day, idle 6h/day'),
('R-1038', 'EQX1038', 'S004', 'OP101', '2025-04-19', '2025-05-23', 0.5, 8, 78, 'Telemetry: engine 0.5h/day, idle 8h/day'),
('R-1039', 'EQX1039', 'S005', 'OP102', '2025-05-20', '2025-06-24', 3.5, 10, 84, 'Telemetry: engine 3.5h/day, idle 10h/day'),
('R-1040', 'EQX1040', 'S006', 'OP103', '2025-01-01', '2025-02-05', 6.5, 1, 67, 'Telemetry: engine 6.5h/day, idle 1h/day'),
('R-1041', 'EQX1041', 'S007', 'OP106', '2025-02-02', '2025-03-06', 0.5, 3, 66, 'Telemetry: engine 0.5h/day, idle 3h/day'),
('R-1042', 'EQX1042', 'S008', 'OP114', '2025-03-03', '2025-04-07', 3.5, 5, 89, 'Telemetry: engine 3.5h/day, idle 5h/day'),
('R-1043', 'EQX1043', 'S001', 'OP203', '2025-04-04', '2025-05-08', 6.5, 7, 92, 'Telemetry: engine 6.5h/day, idle 7h/day'),
('R-1044', 'EQX1044', 'S001', 'OP205', '2025-05-05', '2025-06-09', 0.5, 9, 76, 'Telemetry: engine 0.5h/day, idle 9h/day'),
('R-1045', 'EQX1045', 'S002', 'OP301', '2025-01-06', '2025-02-10', 3.5, 0, 83, 'Telemetry: engine 3.5h/day, idle 0h/day'),
('R-1046', 'EQX1046', 'S003', 'OP308', '2025-02-07', '2025-03-11', 6.5, 2, 69, 'Telemetry: engine 6.5h/day, idle 2h/day'),
('R-1047', 'EQX1047', 'S004', 'OP101', '2025-03-08', '2025-04-12', 0.5, 4, 62, 'Telemetry: engine 0.5h/day, idle 4h/day'),
('R-1048', 'EQX1048', 'S005', 'OP101', '2025-04-09', '2025-05-13', 3.5, 6, 85, 'Telemetry: engine 3.5h/day, idle 6h/day'),
('R-1049', 'EQX1049', 'S006', 'OP102', '2025-05-10', '2025-06-14', 6.5, 8, 73, 'Telemetry: engine 6.5h/day, idle 8h/day'),
('R-1050', 'EQX1050', 'S007', 'OP103', '2025-01-11', '2025-02-15', 0.5, 10, 92, 'Telemetry: engine 0.5h/day, idle 10h/day'),
('R-1051', 'EQX1051', 'S008', 'OP106', '2025-02-12', '2025-03-16', 3.5, 1, 71, 'Telemetry: engine 3.5h/day, idle 1h/day'),
('R-1052', 'EQX1052', 'S001', 'OP114', '2025-03-13', '2025-04-17', 6.5, 3, 83, 'Telemetry: engine 6.5h/day, idle 3h/day'),
('R-1053', 'EQX1053', 'S001', 'OP203', '2025-04-14', '2025-05-18', 0.5, 5, 99, 'Telemetry: engine 0.5h/day, idle 5h/day'),
('R-1054', 'EQX1054', 'S002', 'OP205', '2025-05-15', '2025-06-19', 3.5, 7, 92, 'Telemetry: engine 3.5h/day, idle 7h/day'),
('R-1055', 'EQX1055', 'S003', 'OP301', '2025-01-16', '2025-02-20', 6.5, 9, 94, 'Telemetry: engine 6.5h/day, idle 9h/day'),
('R-1056', 'EQX1056', 'S004', 'OP308', '2025-02-17', '2025-03-21', 0.5, 0, 64, 'Telemetry: engine 0.5h/day, idle 0h/day'),
('R-1057', 'EQX1057', 'S005', 'OP101', '2025-03-18', '2025-04-22', 3.5, 2, 95, 'Telemetry: engine 3.5h/day, idle 2h/day'),
('R-1058', 'EQX1058', 'S006', 'OP101', '2025-04-19', '2025-05-23', 6.5, 4, 72, 'Telemetry: engine 6.5h/day, idle 4h/day'),
('R-1059', 'EQX1059', 'S007', 'OP102', '2025-05-20', '2025-06-24', 0.5, 6, 99, 'Telemetry: engine 0.5h/day, idle 6h/day'),
('R-1060', 'EQX1060', 'S008', 'OP103', '2025-01-01', '2025-02-05', 3.5, 8, 78, 'Telemetry: engine 3.5h/day, idle 8h/day'),
('R-1061', 'EQX1061', 'S001', 'OP106', '2025-02-02', '2025-03-06', 6.5, 10, 80, 'Telemetry: engine 6.5h/day, idle 10h/day'),
('R-1062', 'EQX1062', 'S001', 'OP114', '2025-03-03', '2025-04-07', 0.5, 1, 74, 'Telemetry: engine 0.5h/day, idle 1h/day'),
('R-1063', 'EQX1063', 'S002', 'OP203', '2025-04-04', '2025-05-08', 3.5, 3, 79, 'Telemetry: engine 3.5h/day, idle 3h/day'),
('R-1064', 'EQX1064', 'S003', 'OP205', '2025-05-05', '2025-06-09', 6.5, 5, 72, 'Telemetry: engine 6.5h/day, idle 5h/day'),
('R-1065', 'EQX1065', 'S004', 'OP301', '2025-01-06', '2025-02-10', 0.5, 7, 86, 'Telemetry: engine 0.5h/day, idle 7h/day'),
('R-1066', 'EQX1066', 'S005', 'OP308', '2025-02-07', '2025-03-11', 3.5, 9, 91, 'Telemetry: engine 3.5h/day, idle 9h/day'),
('R-1067', 'EQX1067', 'S006', 'OP101', '2025-03-08', '2025-04-12', 6.5, 0, 99, 'Telemetry: engine 6.5h/day, idle 0h/day'),
('R-1068', 'EQX1068', 'S007', 'OP101', '2025-04-09', '2025-05-13', 0.5, 2, 73, 'Telemetry: engine 0.5h/day, idle 2h/day'),
('R-1069', 'EQX1069', 'S008', 'OP102', '2025-05-10', '2025-06-14', 3.5, 4, 83, 'Telemetry: engine 3.5h/day, idle 4h/day'),
('R-1070', 'EQX1070', 'S001', 'OP103', '2025-01-11', '2025-02-15', 6.5, 6, 74, 'Telemetry: engine 6.5h/day, idle 6h/day'),
('R-1071', 'EQX1071', 'S001', 'OP106', '2025-02-12', '2025-03-16', 0.5, 8, 88, 'Telemetry: engine 0.5h/day, idle 8h/day'),
('R-1072', 'EQX1072', 'S002', 'OP114', '2025-03-13', '2025-04-17', 3.5, 10, 71, 'Telemetry: engine 3.5h/day, idle 10h/day'),
('R-1073', 'EQX1073', 'S003', 'OP203', '2025-04-14', '2025-05-18', 6.5, 1, 97, 'Telemetry: engine 6.5h/day, idle 1h/day'),
('R-1074', 'EQX1074', 'S004', 'OP205', '2025-05-15', '2025-06-19', 0.5, 3, 93, 'Telemetry: engine 0.5h/day, idle 3h/day'),
('R-1075', 'EQX1075', 'S005', 'OP301', '2025-01-16', '2025-02-20', 3.5, 5, 77, 'Telemetry: engine 3.5h/day, idle 5h/day'),
('R-1076', 'EQX1076', 'S006', 'OP308', '2025-02-17', '2025-03-21', 6.5, 7, 92, 'Telemetry: engine 6.5h/day, idle 7h/day'),
('R-1077', 'EQX1077', 'S007', 'OP101', '2025-03-18', '2025-04-22', 0.5, 9, 89, 'Telemetry: engine 0.5h/day, idle 9h/day'),
('R-1078', 'EQX1078', 'S008', 'OP101', '2025-04-19', '2025-05-23', 3.5, 0, 70, 'Telemetry: engine 3.5h/day, idle 0h/day'),
('R-1079', 'EQX1079', 'S001', 'OP102', '2025-05-20', '2025-06-24', 6.5, 2, 84, 'Telemetry: engine 6.5h/day, idle 2h/day'),
('R-1080', 'EQX1080', 'S001', 'OP103', '2025-01-01', '2025-02-05', 0.5, 4, 74, 'Telemetry: engine 0.5h/day, idle 4h/day'),
('R-1081', 'EQX1081', 'S002', 'OP106', '2025-02-02', '2025-03-06', 3.5, 6, 98, 'Telemetry: engine 3.5h/day, idle 6h/day'),
('R-1082', 'EQX1082', 'S003', 'OP114', '2025-03-03', '2025-04-07', 6.5, 8, 68, 'Telemetry: engine 6.5h/day, idle 8h/day'),
('R-1083', 'EQX1083', 'S004', 'OP203', '2025-04-04', '2025-05-08', 0.5, 10, 79, 'Telemetry: engine 0.5h/day, idle 10h/day'),
('R-1084', 'EQX1084', 'S005', 'OP205', '2025-05-05', '2025-06-09', 3.5, 1, 67, 'Telemetry: engine 3.5h/day, idle 1h/day'),
('R-1085', 'EQX1085', 'S006', 'OP301', '2025-01-06', '2025-02-10', 6.5, 3, 82, 'Telemetry: engine 6.5h/day, idle 3h/day'),
('R-1086', 'EQX1086', 'S007', 'OP308', '2025-02-07', '2025-03-11', 0.5, 5, 91, 'Telemetry: engine 0.5h/day, idle 5h/day'),
('R-1087', 'EQX1087', 'S008', 'OP101', '2025-03-08', '2025-04-12', 3.5, 7, 73, 'Telemetry: engine 3.5h/day, idle 7h/day'),
('R-1088', 'EQX1088', 'S001', 'OP101', '2025-04-09', '2025-05-13', 6.5, 9, 86, 'Telemetry: engine 6.5h/day, idle 9h/day'),
('R-1089', 'EQX1089', 'S001', 'OP102', '2025-05-10', '2025-06-14', 0.5, 0, 73, 'Telemetry: engine 0.5h/day, idle 0h/day'),
('R-1090', 'EQX1090', 'S002', 'OP103', '2025-01-11', '2025-02-15', 3.5, 2, 69, 'Telemetry: engine 3.5h/day, idle 2h/day'),
('R-1091', 'EQX1091', 'S003', 'OP106', '2025-02-12', '2025-03-16', 6.5, 4, 77, 'Telemetry: engine 6.5h/day, idle 4h/day'),
('R-1092', 'EQX1092', 'S004', 'OP114', '2025-03-13', '2025-04-17', 0.5, 6, 79, 'Telemetry: engine 0.5h/day, idle 6h/day'),
('R-1093', 'EQX1093', 'S005', 'OP203', '2025-04-14', '2025-05-18', 3.5, 8, 77, 'Telemetry: engine 3.5h/day, idle 8h/day'),
('R-1094', 'EQX1094', 'S006', 'OP205', '2025-05-15', '2025-06-19', 6.5, 10, 66, 'Telemetry: engine 6.5h/day, idle 10h/day'),
('R-1095', 'EQX1095', 'S007', 'OP301', '2025-01-16', '2025-02-20', 0.5, 1, 85, 'Telemetry: engine 0.5h/day, idle 1h/day'),
('R-1096', 'EQX1096', 'S008', 'OP308', '2025-02-17', '2025-03-21', 3.5, 3, 77, 'Telemetry: engine 3.5h/day, idle 3h/day'),
('R-1097', 'EQX1097', 'S001', 'OP101', '2025-03-18', '2025-04-22', 6.5, 5, 91, 'Telemetry: engine 6.5h/day, idle 5h/day'),
('R-1098', 'EQX1098', 'S001', 'OP101', '2025-04-19', '2025-05-23', 0.5, 7, 69, 'Telemetry: engine 0.5h/day, idle 7h/day'),
('R-1099', 'EQX1099', 'S002', 'OP102', '2025-05-20', '2025-06-24', 3.5, 9, 68, 'Telemetry: engine 3.5h/day, idle 9h/day'),
('R-1100', 'EQX1100', 'S003', 'OP103', '2025-01-01', '2025-02-05', 6.5, 0, 62, 'Telemetry: engine 6.5h/day, idle 0h/day');

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
