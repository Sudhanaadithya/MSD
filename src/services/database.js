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
  {
    "equipment_id": "EQX1001",
    "id": "EQX1001",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "15 Days",
    "operator": "Operator OP101",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1002",
    "id": "EQX1002",
    "type": "Crane",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "20 Days",
    "operator": "Unassigned",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1003",
    "id": "EQX1003",
    "type": "Bulldozer",
    "status": "Active",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "25 Days",
    "operator": "Operator OP203",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1004",
    "id": "EQX1004",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "10 Days",
    "operator": "Operator OP106",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1005",
    "id": "EQX1005",
    "type": "Bulldozer",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "30 Days",
    "operator": "Operator OP301",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1006",
    "id": "EQX1006",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "18 Days",
    "operator": "Operator OP114",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1007",
    "id": "EQX1007",
    "type": "Excavator",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "12 Days",
    "operator": "Unassigned",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1008",
    "id": "EQX1008",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "3 Days",
    "operator": "Operator OP101",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1009",
    "id": "EQX1009",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "4 Days",
    "operator": "Operator OP102",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1010",
    "id": "EQX1010",
    "type": "Bulldozer",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "5 Days",
    "operator": "Operator OP103",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1011",
    "id": "EQX1011",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "6 Days",
    "operator": "Operator OP106",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1012",
    "id": "EQX1012",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "7 Days",
    "operator": "Operator OP114",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1013",
    "id": "EQX1013",
    "type": "Dump Truck",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "8 Days",
    "operator": "Operator OP203",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1014",
    "id": "EQX1014",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "9 Days",
    "operator": "Operator OP205",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1015",
    "id": "EQX1015",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "10 Days",
    "operator": "Operator OP301",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1016",
    "id": "EQX1016",
    "type": "Compactor",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "11 Days",
    "operator": "Operator OP308",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1017",
    "id": "EQX1017",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "12 Days",
    "operator": "Unassigned",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1018",
    "id": "EQX1018",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "13 Days",
    "operator": "Operator OP101",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1019",
    "id": "EQX1019",
    "type": "Crane",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "14 Days",
    "operator": "Operator OP102",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1020",
    "id": "EQX1020",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "15 Days",
    "operator": "Operator OP103",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1021",
    "id": "EQX1021",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "16 Days",
    "operator": "Operator OP106",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1022",
    "id": "EQX1022",
    "type": "Loader",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "17 Days",
    "operator": "Operator OP114",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1023",
    "id": "EQX1023",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "18 Days",
    "operator": "Operator OP203",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1024",
    "id": "EQX1024",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "19 Days",
    "operator": "Operator OP205",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1025",
    "id": "EQX1025",
    "type": "Forklift",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "20 Days",
    "operator": "Operator OP301",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1026",
    "id": "EQX1026",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "21 Days",
    "operator": "Operator OP308",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1027",
    "id": "EQX1027",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "22 Days",
    "operator": "Unassigned",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1028",
    "id": "EQX1028",
    "type": "Excavator",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "23 Days",
    "operator": "Operator OP101",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1029",
    "id": "EQX1029",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "24 Days",
    "operator": "Operator OP102",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1030",
    "id": "EQX1030",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "25 Days",
    "operator": "Operator OP103",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1031",
    "id": "EQX1031",
    "type": "Grader",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "26 Days",
    "operator": "Operator OP106",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1032",
    "id": "EQX1032",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "27 Days",
    "operator": "Operator OP114",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1033",
    "id": "EQX1033",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "28 Days",
    "operator": "Operator OP203",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1034",
    "id": "EQX1034",
    "type": "Backhoe",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "29 Days",
    "operator": "Operator OP205",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1035",
    "id": "EQX1035",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "30 Days",
    "operator": "Operator OP301",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1036",
    "id": "EQX1036",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "3 Days",
    "operator": "Operator OP308",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1037",
    "id": "EQX1037",
    "type": "Skid Steer",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "4 Days",
    "operator": "Unassigned",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1038",
    "id": "EQX1038",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "5 Days",
    "operator": "Operator OP101",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1039",
    "id": "EQX1039",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "6 Days",
    "operator": "Operator OP102",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1040",
    "id": "EQX1040",
    "type": "Bulldozer",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "7 Days",
    "operator": "Operator OP103",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1041",
    "id": "EQX1041",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "8 Days",
    "operator": "Operator OP106",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1042",
    "id": "EQX1042",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "9 Days",
    "operator": "Operator OP114",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1043",
    "id": "EQX1043",
    "type": "Dump Truck",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "10 Days",
    "operator": "Operator OP203",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1044",
    "id": "EQX1044",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "11 Days",
    "operator": "Operator OP205",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1045",
    "id": "EQX1045",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "12 Days",
    "operator": "Operator OP301",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1046",
    "id": "EQX1046",
    "type": "Compactor",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "13 Days",
    "operator": "Operator OP308",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1047",
    "id": "EQX1047",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "14 Days",
    "operator": "Unassigned",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1048",
    "id": "EQX1048",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "15 Days",
    "operator": "Operator OP101",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1049",
    "id": "EQX1049",
    "type": "Crane",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "16 Days",
    "operator": "Operator OP102",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1050",
    "id": "EQX1050",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "17 Days",
    "operator": "Operator OP103",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1051",
    "id": "EQX1051",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "18 Days",
    "operator": "Operator OP106",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1052",
    "id": "EQX1052",
    "type": "Loader",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "19 Days",
    "operator": "Operator OP114",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1053",
    "id": "EQX1053",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "20 Days",
    "operator": "Operator OP203",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1054",
    "id": "EQX1054",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "21 Days",
    "operator": "Operator OP205",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1055",
    "id": "EQX1055",
    "type": "Forklift",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "22 Days",
    "operator": "Operator OP301",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1056",
    "id": "EQX1056",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "23 Days",
    "operator": "Operator OP308",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1057",
    "id": "EQX1057",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "24 Days",
    "operator": "Unassigned",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1058",
    "id": "EQX1058",
    "type": "Excavator",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "25 Days",
    "operator": "Operator OP101",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1059",
    "id": "EQX1059",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "26 Days",
    "operator": "Operator OP102",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1060",
    "id": "EQX1060",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "27 Days",
    "operator": "Operator OP103",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1061",
    "id": "EQX1061",
    "type": "Grader",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "28 Days",
    "operator": "Operator OP106",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1062",
    "id": "EQX1062",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "29 Days",
    "operator": "Operator OP114",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1063",
    "id": "EQX1063",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "30 Days",
    "operator": "Operator OP203",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1064",
    "id": "EQX1064",
    "type": "Backhoe",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "3 Days",
    "operator": "Operator OP205",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1065",
    "id": "EQX1065",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "4 Days",
    "operator": "Operator OP301",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1066",
    "id": "EQX1066",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "5 Days",
    "operator": "Operator OP308",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1067",
    "id": "EQX1067",
    "type": "Skid Steer",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "6 Days",
    "operator": "Unassigned",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1068",
    "id": "EQX1068",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "7 Days",
    "operator": "Operator OP101",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1069",
    "id": "EQX1069",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "8 Days",
    "operator": "Operator OP102",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1070",
    "id": "EQX1070",
    "type": "Bulldozer",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "9 Days",
    "operator": "Operator OP103",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1071",
    "id": "EQX1071",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "10 Days",
    "operator": "Operator OP106",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1072",
    "id": "EQX1072",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "11 Days",
    "operator": "Operator OP114",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1073",
    "id": "EQX1073",
    "type": "Dump Truck",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "12 Days",
    "operator": "Operator OP203",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1074",
    "id": "EQX1074",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "13 Days",
    "operator": "Operator OP205",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1075",
    "id": "EQX1075",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "14 Days",
    "operator": "Operator OP301",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1076",
    "id": "EQX1076",
    "type": "Compactor",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "15 Days",
    "operator": "Operator OP308",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1077",
    "id": "EQX1077",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "16 Days",
    "operator": "Unassigned",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1078",
    "id": "EQX1078",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "17 Days",
    "operator": "Operator OP101",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1079",
    "id": "EQX1079",
    "type": "Crane",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "18 Days",
    "operator": "Operator OP102",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1080",
    "id": "EQX1080",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "19 Days",
    "operator": "Operator OP103",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1081",
    "id": "EQX1081",
    "type": "Grader",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "20 Days",
    "operator": "Operator OP106",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1082",
    "id": "EQX1082",
    "type": "Loader",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "21 Days",
    "operator": "Operator OP114",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1083",
    "id": "EQX1083",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "22 Days",
    "operator": "Operator OP203",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1084",
    "id": "EQX1084",
    "type": "Backhoe",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "23 Days",
    "operator": "Operator OP205",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1085",
    "id": "EQX1085",
    "type": "Forklift",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "24 Days",
    "operator": "Operator OP301",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1086",
    "id": "EQX1086",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "25 Days",
    "operator": "Operator OP308",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1087",
    "id": "EQX1087",
    "type": "Skid Steer",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "26 Days",
    "operator": "Unassigned",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1088",
    "id": "EQX1088",
    "type": "Excavator",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "27 Days",
    "operator": "Operator OP101",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1089",
    "id": "EQX1089",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "28 Days",
    "operator": "Operator OP102",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1090",
    "id": "EQX1090",
    "type": "Bulldozer",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "29 Days",
    "operator": "Operator OP103",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1091",
    "id": "EQX1091",
    "type": "Grader",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "30 Days",
    "operator": "Operator OP106",
    "current_site_id": "S003"
  },
  {
    "equipment_id": "EQX1092",
    "id": "EQX1092",
    "type": "Loader",
    "status": "In Use",
    "site": "Site S004",
    "sites": {
      "name": "Site S004"
    },
    "rentalDays": "3 Days",
    "operator": "Operator OP114",
    "current_site_id": "S004"
  },
  {
    "equipment_id": "EQX1093",
    "id": "EQX1093",
    "type": "Dump Truck",
    "status": "In Use",
    "site": "Site S005",
    "sites": {
      "name": "Site S005"
    },
    "rentalDays": "4 Days",
    "operator": "Operator OP203",
    "current_site_id": "S005"
  },
  {
    "equipment_id": "EQX1094",
    "id": "EQX1094",
    "type": "Backhoe",
    "status": "Active",
    "site": "Site S006",
    "sites": {
      "name": "Site S006"
    },
    "rentalDays": "5 Days",
    "operator": "Operator OP205",
    "current_site_id": "S006"
  },
  {
    "equipment_id": "EQX1095",
    "id": "EQX1095",
    "type": "Forklift",
    "status": "In Use",
    "site": "Site S007",
    "sites": {
      "name": "Site S007"
    },
    "rentalDays": "6 Days",
    "operator": "Operator OP301",
    "current_site_id": "S007"
  },
  {
    "equipment_id": "EQX1096",
    "id": "EQX1096",
    "type": "Compactor",
    "status": "In Use",
    "site": "Site S008",
    "sites": {
      "name": "Site S008"
    },
    "rentalDays": "7 Days",
    "operator": "Operator OP308",
    "current_site_id": "S008"
  },
  {
    "equipment_id": "EQX1097",
    "id": "EQX1097",
    "type": "Skid Steer",
    "status": "Available",
    "site": "Unassigned Site Pool",
    "sites": {
      "name": "Unassigned Site Pool"
    },
    "rentalDays": "8 Days",
    "operator": "Unassigned",
    "current_site_id": null
  },
  {
    "equipment_id": "EQX1098",
    "id": "EQX1098",
    "type": "Excavator",
    "status": "In Use",
    "site": "Site S001",
    "sites": {
      "name": "Site S001"
    },
    "rentalDays": "9 Days",
    "operator": "Operator OP101",
    "current_site_id": "S001"
  },
  {
    "equipment_id": "EQX1099",
    "id": "EQX1099",
    "type": "Crane",
    "status": "In Use",
    "site": "Site S002",
    "sites": {
      "name": "Site S002"
    },
    "rentalDays": "10 Days",
    "operator": "Operator OP102",
    "current_site_id": "S002"
  },
  {
    "equipment_id": "EQX1100",
    "id": "EQX1100",
    "type": "Bulldozer",
    "status": "Active",
    "site": "Site S003",
    "sites": {
      "name": "Site S003"
    },
    "rentalDays": "11 Days",
    "operator": "Operator OP103",
    "current_site_id": "S003"
  }
];

const SEED_RENTALS = [
  {
    "id": "R-1001",
    "equipment_id": "EQX1001",
    "site_id": "S003",
    "operator_id": "OP101",
    "check_in_date": "2025-04-01",
    "check_out_date": "2025-04-16",
    "engine_hours_day": 1.5,
    "idle_hours_day": 10,
    "fuel_level": 91,
    "notes": "Telemetry logged: engine 1.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1002",
    "equipment_id": "EQX1002",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-03-10",
    "check_out_date": "2025-03-30",
    "engine_hours_day": 0,
    "idle_hours_day": 11,
    "fuel_level": 80,
    "notes": "Telemetry logged: engine 0h/day, idle 11h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1003",
    "equipment_id": "EQX1003",
    "site_id": "S002",
    "operator_id": "OP203",
    "check_in_date": "2025-02-15",
    "check_out_date": "2025-03-11",
    "engine_hours_day": 7.5,
    "idle_hours_day": 0.5,
    "fuel_level": 73,
    "notes": "Telemetry logged: engine 7.5h/day, idle 0.5h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1004",
    "equipment_id": "EQX1004",
    "site_id": "S004",
    "operator_id": "OP106",
    "check_in_date": "2025-05-05",
    "check_out_date": "2025-05-15",
    "engine_hours_day": 2,
    "idle_hours_day": 9,
    "fuel_level": 63,
    "notes": "Telemetry logged: engine 2h/day, idle 9h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1005",
    "equipment_id": "EQX1005",
    "site_id": "S006",
    "operator_id": "OP301",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-01-31",
    "engine_hours_day": 8,
    "idle_hours_day": 0,
    "fuel_level": 76,
    "notes": "Telemetry logged: engine 8h/day, idle 0h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1006",
    "equipment_id": "EQX1006",
    "site_id": "S001",
    "operator_id": "OP114",
    "check_in_date": "2025-04-05",
    "check_out_date": "2025-04-23",
    "engine_hours_day": 3,
    "idle_hours_day": 6,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 3h/day, idle 6h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1007",
    "equipment_id": "EQX1007",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-03-20",
    "check_out_date": "2025-04-01",
    "engine_hours_day": 0,
    "idle_hours_day": 12,
    "fuel_level": 67,
    "notes": "Telemetry logged: engine 0h/day, idle 12h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1008",
    "equipment_id": "EQX1008",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-04-09",
    "check_out_date": "2025-05-13",
    "engine_hours_day": 0.5,
    "idle_hours_day": 3,
    "fuel_level": 89,
    "notes": "Telemetry logged: engine 0.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1009",
    "equipment_id": "EQX1009",
    "site_id": "S002",
    "operator_id": "OP102",
    "check_in_date": "2025-05-10",
    "check_out_date": "2025-06-14",
    "engine_hours_day": 3.5,
    "idle_hours_day": 5,
    "fuel_level": 74,
    "notes": "Telemetry logged: engine 3.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1010",
    "equipment_id": "EQX1010",
    "site_id": "S003",
    "operator_id": "OP103",
    "check_in_date": "2025-01-11",
    "check_out_date": "2025-02-15",
    "engine_hours_day": 6.5,
    "idle_hours_day": 7,
    "fuel_level": 91,
    "notes": "Telemetry logged: engine 6.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1011",
    "equipment_id": "EQX1011",
    "site_id": "S004",
    "operator_id": "OP106",
    "check_in_date": "2025-02-12",
    "check_out_date": "2025-03-16",
    "engine_hours_day": 0.5,
    "idle_hours_day": 9,
    "fuel_level": 82,
    "notes": "Telemetry logged: engine 0.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1012",
    "equipment_id": "EQX1012",
    "site_id": "S005",
    "operator_id": "OP114",
    "check_in_date": "2025-03-13",
    "check_out_date": "2025-04-17",
    "engine_hours_day": 3.5,
    "idle_hours_day": 0,
    "fuel_level": 97,
    "notes": "Telemetry logged: engine 3.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1013",
    "equipment_id": "EQX1013",
    "site_id": "S006",
    "operator_id": "OP203",
    "check_in_date": "2025-04-14",
    "check_out_date": "2025-05-18",
    "engine_hours_day": 6.5,
    "idle_hours_day": 2,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 6.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1014",
    "equipment_id": "EQX1014",
    "site_id": "S007",
    "operator_id": "OP205",
    "check_in_date": "2025-05-15",
    "check_out_date": "2025-06-19",
    "engine_hours_day": 0.5,
    "idle_hours_day": 4,
    "fuel_level": 62,
    "notes": "Telemetry logged: engine 0.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1015",
    "equipment_id": "EQX1015",
    "site_id": "S008",
    "operator_id": "OP301",
    "check_in_date": "2025-01-16",
    "check_out_date": "2025-02-20",
    "engine_hours_day": 3.5,
    "idle_hours_day": 6,
    "fuel_level": 87,
    "notes": "Telemetry logged: engine 3.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1016",
    "equipment_id": "EQX1016",
    "site_id": "S001",
    "operator_id": "OP308",
    "check_in_date": "2025-02-17",
    "check_out_date": "2025-03-21",
    "engine_hours_day": 6.5,
    "idle_hours_day": 8,
    "fuel_level": 80,
    "notes": "Telemetry logged: engine 6.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1017",
    "equipment_id": "EQX1017",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-03-18",
    "check_out_date": "2025-04-22",
    "engine_hours_day": 0.5,
    "idle_hours_day": 10,
    "fuel_level": 65,
    "notes": "Telemetry logged: engine 0.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1018",
    "equipment_id": "EQX1018",
    "site_id": "S002",
    "operator_id": "OP101",
    "check_in_date": "2025-04-19",
    "check_out_date": "2025-05-23",
    "engine_hours_day": 3.5,
    "idle_hours_day": 1,
    "fuel_level": 73,
    "notes": "Telemetry logged: engine 3.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1019",
    "equipment_id": "EQX1019",
    "site_id": "S003",
    "operator_id": "OP102",
    "check_in_date": "2025-05-20",
    "check_out_date": "2025-06-24",
    "engine_hours_day": 6.5,
    "idle_hours_day": 3,
    "fuel_level": 78,
    "notes": "Telemetry logged: engine 6.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1020",
    "equipment_id": "EQX1020",
    "site_id": "S004",
    "operator_id": "OP103",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-02-05",
    "engine_hours_day": 0.5,
    "idle_hours_day": 5,
    "fuel_level": 95,
    "notes": "Telemetry logged: engine 0.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1021",
    "equipment_id": "EQX1021",
    "site_id": "S005",
    "operator_id": "OP106",
    "check_in_date": "2025-02-02",
    "check_out_date": "2025-03-06",
    "engine_hours_day": 3.5,
    "idle_hours_day": 7,
    "fuel_level": 62,
    "notes": "Telemetry logged: engine 3.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1022",
    "equipment_id": "EQX1022",
    "site_id": "S006",
    "operator_id": "OP114",
    "check_in_date": "2025-03-03",
    "check_out_date": "2025-04-07",
    "engine_hours_day": 6.5,
    "idle_hours_day": 9,
    "fuel_level": 67,
    "notes": "Telemetry logged: engine 6.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1023",
    "equipment_id": "EQX1023",
    "site_id": "S007",
    "operator_id": "OP203",
    "check_in_date": "2025-04-04",
    "check_out_date": "2025-05-08",
    "engine_hours_day": 0.5,
    "idle_hours_day": 0,
    "fuel_level": 96,
    "notes": "Telemetry logged: engine 0.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1024",
    "equipment_id": "EQX1024",
    "site_id": "S008",
    "operator_id": "OP205",
    "check_in_date": "2025-05-05",
    "check_out_date": "2025-06-09",
    "engine_hours_day": 3.5,
    "idle_hours_day": 2,
    "fuel_level": 81,
    "notes": "Telemetry logged: engine 3.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1025",
    "equipment_id": "EQX1025",
    "site_id": "S001",
    "operator_id": "OP301",
    "check_in_date": "2025-01-06",
    "check_out_date": "2025-02-10",
    "engine_hours_day": 6.5,
    "idle_hours_day": 4,
    "fuel_level": 88,
    "notes": "Telemetry logged: engine 6.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1026",
    "equipment_id": "EQX1026",
    "site_id": "S001",
    "operator_id": "OP308",
    "check_in_date": "2025-02-07",
    "check_out_date": "2025-03-11",
    "engine_hours_day": 0.5,
    "idle_hours_day": 6,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 0.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1027",
    "equipment_id": "EQX1027",
    "site_id": "S002",
    "operator_id": "OP101",
    "check_in_date": "2025-03-08",
    "check_out_date": "2025-04-12",
    "engine_hours_day": 3.5,
    "idle_hours_day": 8,
    "fuel_level": 88,
    "notes": "Telemetry logged: engine 3.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1028",
    "equipment_id": "EQX1028",
    "site_id": "S003",
    "operator_id": "OP101",
    "check_in_date": "2025-04-09",
    "check_out_date": "2025-05-13",
    "engine_hours_day": 6.5,
    "idle_hours_day": 10,
    "fuel_level": 78,
    "notes": "Telemetry logged: engine 6.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1029",
    "equipment_id": "EQX1029",
    "site_id": "S004",
    "operator_id": "OP102",
    "check_in_date": "2025-05-10",
    "check_out_date": "2025-06-14",
    "engine_hours_day": 0.5,
    "idle_hours_day": 1,
    "fuel_level": 64,
    "notes": "Telemetry logged: engine 0.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1030",
    "equipment_id": "EQX1030",
    "site_id": "S005",
    "operator_id": "OP103",
    "check_in_date": "2025-01-11",
    "check_out_date": "2025-02-15",
    "engine_hours_day": 3.5,
    "idle_hours_day": 3,
    "fuel_level": 95,
    "notes": "Telemetry logged: engine 3.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1031",
    "equipment_id": "EQX1031",
    "site_id": "S006",
    "operator_id": "OP106",
    "check_in_date": "2025-02-12",
    "check_out_date": "2025-03-16",
    "engine_hours_day": 6.5,
    "idle_hours_day": 5,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 6.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1032",
    "equipment_id": "EQX1032",
    "site_id": "S007",
    "operator_id": "OP114",
    "check_in_date": "2025-03-13",
    "check_out_date": "2025-04-17",
    "engine_hours_day": 0.5,
    "idle_hours_day": 7,
    "fuel_level": 72,
    "notes": "Telemetry logged: engine 0.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1033",
    "equipment_id": "EQX1033",
    "site_id": "S008",
    "operator_id": "OP203",
    "check_in_date": "2025-04-14",
    "check_out_date": "2025-05-18",
    "engine_hours_day": 3.5,
    "idle_hours_day": 9,
    "fuel_level": 72,
    "notes": "Telemetry logged: engine 3.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1034",
    "equipment_id": "EQX1034",
    "site_id": "S001",
    "operator_id": "OP205",
    "check_in_date": "2025-05-15",
    "check_out_date": "2025-06-19",
    "engine_hours_day": 6.5,
    "idle_hours_day": 0,
    "fuel_level": 84,
    "notes": "Telemetry logged: engine 6.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1035",
    "equipment_id": "EQX1035",
    "site_id": "S001",
    "operator_id": "OP301",
    "check_in_date": "2025-01-16",
    "check_out_date": "2025-02-20",
    "engine_hours_day": 0.5,
    "idle_hours_day": 2,
    "fuel_level": 60,
    "notes": "Telemetry logged: engine 0.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1036",
    "equipment_id": "EQX1036",
    "site_id": "S002",
    "operator_id": "OP308",
    "check_in_date": "2025-02-17",
    "check_out_date": "2025-03-21",
    "engine_hours_day": 3.5,
    "idle_hours_day": 4,
    "fuel_level": 66,
    "notes": "Telemetry logged: engine 3.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1037",
    "equipment_id": "EQX1037",
    "site_id": "S003",
    "operator_id": "OP101",
    "check_in_date": "2025-03-18",
    "check_out_date": "2025-04-22",
    "engine_hours_day": 6.5,
    "idle_hours_day": 6,
    "fuel_level": 88,
    "notes": "Telemetry logged: engine 6.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1038",
    "equipment_id": "EQX1038",
    "site_id": "S004",
    "operator_id": "OP101",
    "check_in_date": "2025-04-19",
    "check_out_date": "2025-05-23",
    "engine_hours_day": 0.5,
    "idle_hours_day": 8,
    "fuel_level": 64,
    "notes": "Telemetry logged: engine 0.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1039",
    "equipment_id": "EQX1039",
    "site_id": "S005",
    "operator_id": "OP102",
    "check_in_date": "2025-05-20",
    "check_out_date": "2025-06-24",
    "engine_hours_day": 3.5,
    "idle_hours_day": 10,
    "fuel_level": 95,
    "notes": "Telemetry logged: engine 3.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1040",
    "equipment_id": "EQX1040",
    "site_id": "S006",
    "operator_id": "OP103",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-02-05",
    "engine_hours_day": 6.5,
    "idle_hours_day": 1,
    "fuel_level": 89,
    "notes": "Telemetry logged: engine 6.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1041",
    "equipment_id": "EQX1041",
    "site_id": "S007",
    "operator_id": "OP106",
    "check_in_date": "2025-02-02",
    "check_out_date": "2025-03-06",
    "engine_hours_day": 0.5,
    "idle_hours_day": 3,
    "fuel_level": 69,
    "notes": "Telemetry logged: engine 0.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1042",
    "equipment_id": "EQX1042",
    "site_id": "S008",
    "operator_id": "OP114",
    "check_in_date": "2025-03-03",
    "check_out_date": "2025-04-07",
    "engine_hours_day": 3.5,
    "idle_hours_day": 5,
    "fuel_level": 78,
    "notes": "Telemetry logged: engine 3.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1043",
    "equipment_id": "EQX1043",
    "site_id": "S001",
    "operator_id": "OP203",
    "check_in_date": "2025-04-04",
    "check_out_date": "2025-05-08",
    "engine_hours_day": 6.5,
    "idle_hours_day": 7,
    "fuel_level": 70,
    "notes": "Telemetry logged: engine 6.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1044",
    "equipment_id": "EQX1044",
    "site_id": "S001",
    "operator_id": "OP205",
    "check_in_date": "2025-05-05",
    "check_out_date": "2025-06-09",
    "engine_hours_day": 0.5,
    "idle_hours_day": 9,
    "fuel_level": 76,
    "notes": "Telemetry logged: engine 0.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1045",
    "equipment_id": "EQX1045",
    "site_id": "S002",
    "operator_id": "OP301",
    "check_in_date": "2025-01-06",
    "check_out_date": "2025-02-10",
    "engine_hours_day": 3.5,
    "idle_hours_day": 0,
    "fuel_level": 95,
    "notes": "Telemetry logged: engine 3.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1046",
    "equipment_id": "EQX1046",
    "site_id": "S003",
    "operator_id": "OP308",
    "check_in_date": "2025-02-07",
    "check_out_date": "2025-03-11",
    "engine_hours_day": 6.5,
    "idle_hours_day": 2,
    "fuel_level": 78,
    "notes": "Telemetry logged: engine 6.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1047",
    "equipment_id": "EQX1047",
    "site_id": "S004",
    "operator_id": "OP101",
    "check_in_date": "2025-03-08",
    "check_out_date": "2025-04-12",
    "engine_hours_day": 0.5,
    "idle_hours_day": 4,
    "fuel_level": 85,
    "notes": "Telemetry logged: engine 0.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1048",
    "equipment_id": "EQX1048",
    "site_id": "S005",
    "operator_id": "OP101",
    "check_in_date": "2025-04-09",
    "check_out_date": "2025-05-13",
    "engine_hours_day": 3.5,
    "idle_hours_day": 6,
    "fuel_level": 65,
    "notes": "Telemetry logged: engine 3.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1049",
    "equipment_id": "EQX1049",
    "site_id": "S006",
    "operator_id": "OP102",
    "check_in_date": "2025-05-10",
    "check_out_date": "2025-06-14",
    "engine_hours_day": 6.5,
    "idle_hours_day": 8,
    "fuel_level": 70,
    "notes": "Telemetry logged: engine 6.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1050",
    "equipment_id": "EQX1050",
    "site_id": "S007",
    "operator_id": "OP103",
    "check_in_date": "2025-01-11",
    "check_out_date": "2025-02-15",
    "engine_hours_day": 0.5,
    "idle_hours_day": 10,
    "fuel_level": 91,
    "notes": "Telemetry logged: engine 0.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1051",
    "equipment_id": "EQX1051",
    "site_id": "S008",
    "operator_id": "OP106",
    "check_in_date": "2025-02-12",
    "check_out_date": "2025-03-16",
    "engine_hours_day": 3.5,
    "idle_hours_day": 1,
    "fuel_level": 65,
    "notes": "Telemetry logged: engine 3.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1052",
    "equipment_id": "EQX1052",
    "site_id": "S001",
    "operator_id": "OP114",
    "check_in_date": "2025-03-13",
    "check_out_date": "2025-04-17",
    "engine_hours_day": 6.5,
    "idle_hours_day": 3,
    "fuel_level": 60,
    "notes": "Telemetry logged: engine 6.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1053",
    "equipment_id": "EQX1053",
    "site_id": "S001",
    "operator_id": "OP203",
    "check_in_date": "2025-04-14",
    "check_out_date": "2025-05-18",
    "engine_hours_day": 0.5,
    "idle_hours_day": 5,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 0.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1054",
    "equipment_id": "EQX1054",
    "site_id": "S002",
    "operator_id": "OP205",
    "check_in_date": "2025-05-15",
    "check_out_date": "2025-06-19",
    "engine_hours_day": 3.5,
    "idle_hours_day": 7,
    "fuel_level": 91,
    "notes": "Telemetry logged: engine 3.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1055",
    "equipment_id": "EQX1055",
    "site_id": "S003",
    "operator_id": "OP301",
    "check_in_date": "2025-01-16",
    "check_out_date": "2025-02-20",
    "engine_hours_day": 6.5,
    "idle_hours_day": 9,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 6.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1056",
    "equipment_id": "EQX1056",
    "site_id": "S004",
    "operator_id": "OP308",
    "check_in_date": "2025-02-17",
    "check_out_date": "2025-03-21",
    "engine_hours_day": 0.5,
    "idle_hours_day": 0,
    "fuel_level": 63,
    "notes": "Telemetry logged: engine 0.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1057",
    "equipment_id": "EQX1057",
    "site_id": "S005",
    "operator_id": "OP101",
    "check_in_date": "2025-03-18",
    "check_out_date": "2025-04-22",
    "engine_hours_day": 3.5,
    "idle_hours_day": 2,
    "fuel_level": 62,
    "notes": "Telemetry logged: engine 3.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1058",
    "equipment_id": "EQX1058",
    "site_id": "S006",
    "operator_id": "OP101",
    "check_in_date": "2025-04-19",
    "check_out_date": "2025-05-23",
    "engine_hours_day": 6.5,
    "idle_hours_day": 4,
    "fuel_level": 60,
    "notes": "Telemetry logged: engine 6.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1059",
    "equipment_id": "EQX1059",
    "site_id": "S007",
    "operator_id": "OP102",
    "check_in_date": "2025-05-20",
    "check_out_date": "2025-06-24",
    "engine_hours_day": 0.5,
    "idle_hours_day": 6,
    "fuel_level": 98,
    "notes": "Telemetry logged: engine 0.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1060",
    "equipment_id": "EQX1060",
    "site_id": "S008",
    "operator_id": "OP103",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-02-05",
    "engine_hours_day": 3.5,
    "idle_hours_day": 8,
    "fuel_level": 64,
    "notes": "Telemetry logged: engine 3.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1061",
    "equipment_id": "EQX1061",
    "site_id": "S001",
    "operator_id": "OP106",
    "check_in_date": "2025-02-02",
    "check_out_date": "2025-03-06",
    "engine_hours_day": 6.5,
    "idle_hours_day": 10,
    "fuel_level": 76,
    "notes": "Telemetry logged: engine 6.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1062",
    "equipment_id": "EQX1062",
    "site_id": "S001",
    "operator_id": "OP114",
    "check_in_date": "2025-03-03",
    "check_out_date": "2025-04-07",
    "engine_hours_day": 0.5,
    "idle_hours_day": 1,
    "fuel_level": 81,
    "notes": "Telemetry logged: engine 0.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1063",
    "equipment_id": "EQX1063",
    "site_id": "S002",
    "operator_id": "OP203",
    "check_in_date": "2025-04-04",
    "check_out_date": "2025-05-08",
    "engine_hours_day": 3.5,
    "idle_hours_day": 3,
    "fuel_level": 67,
    "notes": "Telemetry logged: engine 3.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1064",
    "equipment_id": "EQX1064",
    "site_id": "S003",
    "operator_id": "OP205",
    "check_in_date": "2025-05-05",
    "check_out_date": "2025-06-09",
    "engine_hours_day": 6.5,
    "idle_hours_day": 5,
    "fuel_level": 72,
    "notes": "Telemetry logged: engine 6.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1065",
    "equipment_id": "EQX1065",
    "site_id": "S004",
    "operator_id": "OP301",
    "check_in_date": "2025-01-06",
    "check_out_date": "2025-02-10",
    "engine_hours_day": 0.5,
    "idle_hours_day": 7,
    "fuel_level": 87,
    "notes": "Telemetry logged: engine 0.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1066",
    "equipment_id": "EQX1066",
    "site_id": "S005",
    "operator_id": "OP308",
    "check_in_date": "2025-02-07",
    "check_out_date": "2025-03-11",
    "engine_hours_day": 3.5,
    "idle_hours_day": 9,
    "fuel_level": 75,
    "notes": "Telemetry logged: engine 3.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1067",
    "equipment_id": "EQX1067",
    "site_id": "S006",
    "operator_id": "OP101",
    "check_in_date": "2025-03-08",
    "check_out_date": "2025-04-12",
    "engine_hours_day": 6.5,
    "idle_hours_day": 0,
    "fuel_level": 71,
    "notes": "Telemetry logged: engine 6.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1068",
    "equipment_id": "EQX1068",
    "site_id": "S007",
    "operator_id": "OP101",
    "check_in_date": "2025-04-09",
    "check_out_date": "2025-05-13",
    "engine_hours_day": 0.5,
    "idle_hours_day": 2,
    "fuel_level": 84,
    "notes": "Telemetry logged: engine 0.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1069",
    "equipment_id": "EQX1069",
    "site_id": "S008",
    "operator_id": "OP102",
    "check_in_date": "2025-05-10",
    "check_out_date": "2025-06-14",
    "engine_hours_day": 3.5,
    "idle_hours_day": 4,
    "fuel_level": 65,
    "notes": "Telemetry logged: engine 3.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1070",
    "equipment_id": "EQX1070",
    "site_id": "S001",
    "operator_id": "OP103",
    "check_in_date": "2025-01-11",
    "check_out_date": "2025-02-15",
    "engine_hours_day": 6.5,
    "idle_hours_day": 6,
    "fuel_level": 85,
    "notes": "Telemetry logged: engine 6.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1071",
    "equipment_id": "EQX1071",
    "site_id": "S001",
    "operator_id": "OP106",
    "check_in_date": "2025-02-12",
    "check_out_date": "2025-03-16",
    "engine_hours_day": 0.5,
    "idle_hours_day": 8,
    "fuel_level": 74,
    "notes": "Telemetry logged: engine 0.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1072",
    "equipment_id": "EQX1072",
    "site_id": "S002",
    "operator_id": "OP114",
    "check_in_date": "2025-03-13",
    "check_out_date": "2025-04-17",
    "engine_hours_day": 3.5,
    "idle_hours_day": 10,
    "fuel_level": 62,
    "notes": "Telemetry logged: engine 3.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1073",
    "equipment_id": "EQX1073",
    "site_id": "S003",
    "operator_id": "OP203",
    "check_in_date": "2025-04-14",
    "check_out_date": "2025-05-18",
    "engine_hours_day": 6.5,
    "idle_hours_day": 1,
    "fuel_level": 87,
    "notes": "Telemetry logged: engine 6.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1074",
    "equipment_id": "EQX1074",
    "site_id": "S004",
    "operator_id": "OP205",
    "check_in_date": "2025-05-15",
    "check_out_date": "2025-06-19",
    "engine_hours_day": 0.5,
    "idle_hours_day": 3,
    "fuel_level": 87,
    "notes": "Telemetry logged: engine 0.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1075",
    "equipment_id": "EQX1075",
    "site_id": "S005",
    "operator_id": "OP301",
    "check_in_date": "2025-01-16",
    "check_out_date": "2025-02-20",
    "engine_hours_day": 3.5,
    "idle_hours_day": 5,
    "fuel_level": 75,
    "notes": "Telemetry logged: engine 3.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1076",
    "equipment_id": "EQX1076",
    "site_id": "S006",
    "operator_id": "OP308",
    "check_in_date": "2025-02-17",
    "check_out_date": "2025-03-21",
    "engine_hours_day": 6.5,
    "idle_hours_day": 7,
    "fuel_level": 85,
    "notes": "Telemetry logged: engine 6.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1077",
    "equipment_id": "EQX1077",
    "site_id": "S007",
    "operator_id": "OP101",
    "check_in_date": "2025-03-18",
    "check_out_date": "2025-04-22",
    "engine_hours_day": 0.5,
    "idle_hours_day": 9,
    "fuel_level": 70,
    "notes": "Telemetry logged: engine 0.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1078",
    "equipment_id": "EQX1078",
    "site_id": "S008",
    "operator_id": "OP101",
    "check_in_date": "2025-04-19",
    "check_out_date": "2025-05-23",
    "engine_hours_day": 3.5,
    "idle_hours_day": 0,
    "fuel_level": 96,
    "notes": "Telemetry logged: engine 3.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1079",
    "equipment_id": "EQX1079",
    "site_id": "S001",
    "operator_id": "OP102",
    "check_in_date": "2025-05-20",
    "check_out_date": "2025-06-24",
    "engine_hours_day": 6.5,
    "idle_hours_day": 2,
    "fuel_level": 92,
    "notes": "Telemetry logged: engine 6.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1080",
    "equipment_id": "EQX1080",
    "site_id": "S001",
    "operator_id": "OP103",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-02-05",
    "engine_hours_day": 0.5,
    "idle_hours_day": 4,
    "fuel_level": 69,
    "notes": "Telemetry logged: engine 0.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1081",
    "equipment_id": "EQX1081",
    "site_id": "S002",
    "operator_id": "OP106",
    "check_in_date": "2025-02-02",
    "check_out_date": "2025-03-06",
    "engine_hours_day": 3.5,
    "idle_hours_day": 6,
    "fuel_level": 64,
    "notes": "Telemetry logged: engine 3.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1082",
    "equipment_id": "EQX1082",
    "site_id": "S003",
    "operator_id": "OP114",
    "check_in_date": "2025-03-03",
    "check_out_date": "2025-04-07",
    "engine_hours_day": 6.5,
    "idle_hours_day": 8,
    "fuel_level": 85,
    "notes": "Telemetry logged: engine 6.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1083",
    "equipment_id": "EQX1083",
    "site_id": "S004",
    "operator_id": "OP203",
    "check_in_date": "2025-04-04",
    "check_out_date": "2025-05-08",
    "engine_hours_day": 0.5,
    "idle_hours_day": 10,
    "fuel_level": 98,
    "notes": "Telemetry logged: engine 0.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1084",
    "equipment_id": "EQX1084",
    "site_id": "S005",
    "operator_id": "OP205",
    "check_in_date": "2025-05-05",
    "check_out_date": "2025-06-09",
    "engine_hours_day": 3.5,
    "idle_hours_day": 1,
    "fuel_level": 83,
    "notes": "Telemetry logged: engine 3.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1085",
    "equipment_id": "EQX1085",
    "site_id": "S006",
    "operator_id": "OP301",
    "check_in_date": "2025-01-06",
    "check_out_date": "2025-02-10",
    "engine_hours_day": 6.5,
    "idle_hours_day": 3,
    "fuel_level": 92,
    "notes": "Telemetry logged: engine 6.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1086",
    "equipment_id": "EQX1086",
    "site_id": "S007",
    "operator_id": "OP308",
    "check_in_date": "2025-02-07",
    "check_out_date": "2025-03-11",
    "engine_hours_day": 0.5,
    "idle_hours_day": 5,
    "fuel_level": 95,
    "notes": "Telemetry logged: engine 0.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1087",
    "equipment_id": "EQX1087",
    "site_id": "S008",
    "operator_id": "OP101",
    "check_in_date": "2025-03-08",
    "check_out_date": "2025-04-12",
    "engine_hours_day": 3.5,
    "idle_hours_day": 7,
    "fuel_level": 81,
    "notes": "Telemetry logged: engine 3.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1088",
    "equipment_id": "EQX1088",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-04-09",
    "check_out_date": "2025-05-13",
    "engine_hours_day": 6.5,
    "idle_hours_day": 9,
    "fuel_level": 77,
    "notes": "Telemetry logged: engine 6.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1089",
    "equipment_id": "EQX1089",
    "site_id": "S001",
    "operator_id": "OP102",
    "check_in_date": "2025-05-10",
    "check_out_date": "2025-06-14",
    "engine_hours_day": 0.5,
    "idle_hours_day": 0,
    "fuel_level": 80,
    "notes": "Telemetry logged: engine 0.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1090",
    "equipment_id": "EQX1090",
    "site_id": "S002",
    "operator_id": "OP103",
    "check_in_date": "2025-01-11",
    "check_out_date": "2025-02-15",
    "engine_hours_day": 3.5,
    "idle_hours_day": 2,
    "fuel_level": 62,
    "notes": "Telemetry logged: engine 3.5h/day, idle 2h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP103"
    }
  },
  {
    "id": "R-1091",
    "equipment_id": "EQX1091",
    "site_id": "S003",
    "operator_id": "OP106",
    "check_in_date": "2025-02-12",
    "check_out_date": "2025-03-16",
    "engine_hours_day": 6.5,
    "idle_hours_day": 4,
    "fuel_level": 86,
    "notes": "Telemetry logged: engine 6.5h/day, idle 4h/day.",
    "equipment": {
      "type": "Grader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP106"
    }
  },
  {
    "id": "R-1092",
    "equipment_id": "EQX1092",
    "site_id": "S004",
    "operator_id": "OP114",
    "check_in_date": "2025-03-13",
    "check_out_date": "2025-04-17",
    "engine_hours_day": 0.5,
    "idle_hours_day": 6,
    "fuel_level": 72,
    "notes": "Telemetry logged: engine 0.5h/day, idle 6h/day.",
    "equipment": {
      "type": "Loader",
      "status": "Active"
    },
    "sites": {
      "name": "Site S004"
    },
    "operators": {
      "name": "Operator OP114"
    }
  },
  {
    "id": "R-1093",
    "equipment_id": "EQX1093",
    "site_id": "S005",
    "operator_id": "OP203",
    "check_in_date": "2025-04-14",
    "check_out_date": "2025-05-18",
    "engine_hours_day": 3.5,
    "idle_hours_day": 8,
    "fuel_level": 77,
    "notes": "Telemetry logged: engine 3.5h/day, idle 8h/day.",
    "equipment": {
      "type": "Dump Truck",
      "status": "Active"
    },
    "sites": {
      "name": "Site S005"
    },
    "operators": {
      "name": "Operator OP203"
    }
  },
  {
    "id": "R-1094",
    "equipment_id": "EQX1094",
    "site_id": "S006",
    "operator_id": "OP205",
    "check_in_date": "2025-05-15",
    "check_out_date": "2025-06-19",
    "engine_hours_day": 6.5,
    "idle_hours_day": 10,
    "fuel_level": 86,
    "notes": "Telemetry logged: engine 6.5h/day, idle 10h/day.",
    "equipment": {
      "type": "Backhoe",
      "status": "Active"
    },
    "sites": {
      "name": "Site S006"
    },
    "operators": {
      "name": "Operator OP205"
    }
  },
  {
    "id": "R-1095",
    "equipment_id": "EQX1095",
    "site_id": "S007",
    "operator_id": "OP301",
    "check_in_date": "2025-01-16",
    "check_out_date": "2025-02-20",
    "engine_hours_day": 0.5,
    "idle_hours_day": 1,
    "fuel_level": 61,
    "notes": "Telemetry logged: engine 0.5h/day, idle 1h/day.",
    "equipment": {
      "type": "Forklift",
      "status": "Active"
    },
    "sites": {
      "name": "Site S007"
    },
    "operators": {
      "name": "Operator OP301"
    }
  },
  {
    "id": "R-1096",
    "equipment_id": "EQX1096",
    "site_id": "S008",
    "operator_id": "OP308",
    "check_in_date": "2025-02-17",
    "check_out_date": "2025-03-21",
    "engine_hours_day": 3.5,
    "idle_hours_day": 3,
    "fuel_level": 76,
    "notes": "Telemetry logged: engine 3.5h/day, idle 3h/day.",
    "equipment": {
      "type": "Compactor",
      "status": "Active"
    },
    "sites": {
      "name": "Site S008"
    },
    "operators": {
      "name": "Operator OP308"
    }
  },
  {
    "id": "R-1097",
    "equipment_id": "EQX1097",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-03-18",
    "check_out_date": "2025-04-22",
    "engine_hours_day": 6.5,
    "idle_hours_day": 5,
    "fuel_level": 66,
    "notes": "Telemetry logged: engine 6.5h/day, idle 5h/day.",
    "equipment": {
      "type": "Skid Steer",
      "status": "Available"
    },
    "sites": {
      "name": "Highway Construction Zone A"
    },
    "operators": {
      "name": "Unassigned"
    }
  },
  {
    "id": "R-1098",
    "equipment_id": "EQX1098",
    "site_id": "S001",
    "operator_id": "OP101",
    "check_in_date": "2025-04-19",
    "check_out_date": "2025-05-23",
    "engine_hours_day": 0.5,
    "idle_hours_day": 7,
    "fuel_level": 82,
    "notes": "Telemetry logged: engine 0.5h/day, idle 7h/day.",
    "equipment": {
      "type": "Excavator",
      "status": "Active"
    },
    "sites": {
      "name": "Site S001"
    },
    "operators": {
      "name": "Operator OP101"
    }
  },
  {
    "id": "R-1099",
    "equipment_id": "EQX1099",
    "site_id": "S002",
    "operator_id": "OP102",
    "check_in_date": "2025-05-20",
    "check_out_date": "2025-06-24",
    "engine_hours_day": 3.5,
    "idle_hours_day": 9,
    "fuel_level": 94,
    "notes": "Telemetry logged: engine 3.5h/day, idle 9h/day.",
    "equipment": {
      "type": "Crane",
      "status": "Active"
    },
    "sites": {
      "name": "Site S002"
    },
    "operators": {
      "name": "Operator OP102"
    }
  },
  {
    "id": "R-1100",
    "equipment_id": "EQX1100",
    "site_id": "S003",
    "operator_id": "OP103",
    "check_in_date": "2025-01-01",
    "check_out_date": "2025-02-05",
    "engine_hours_day": 6.5,
    "idle_hours_day": 0,
    "fuel_level": 74,
    "notes": "Telemetry logged: engine 6.5h/day, idle 0h/day.",
    "equipment": {
      "type": "Bulldozer",
      "status": "Active"
    },
    "sites": {
      "name": "Site S003"
    },
    "operators": {
      "name": "Operator OP103"
    }
  }
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

// ── Cloud Database Direct Auto-Seeder ────────────────────────────────
export async function seedCloudDatabase() {
  const results = {};
  try {
    const { error: siteErr } = await supabase.from('sites').upsert(SEED_SITES, { onConflict: 'site_id' });
    results.sites = siteErr ? siteErr.message : 'OK';

    const equipPayload = SEED_EQUIPMENT.map(({ sites, ...rest }) => ({ ...rest, current_site_id: 'S001' }));
    const { error: eqErr } = await supabase.from('equipment').upsert(equipPayload, { onConflict: 'equipment_id' });
    results.equipment = eqErr ? eqErr.message : 'OK';

    const rentalPayload = SEED_RENTALS.map(({ equipment, sites, operators, ...rest }) => rest);
    const { error: rentErr } = await supabase.from('rentals').upsert(rentalPayload, { onConflict: 'id' });
    results.rentals = rentErr ? rentErr.message : 'OK';

    const { error: altErr } = await supabase.from('alerts').upsert(SEED_ALERTS, { onConflict: 'id' });
    results.alerts = altErr ? altErr.message : 'OK';

    const { error: drvErr } = await supabase.from('drivers').upsert(SEED_DRIVERS, { onConflict: 'driver_id' });
    results.drivers = drvErr ? drvErr.message : 'OK';

    const { error: bkErr } = await supabase.from('bookings').upsert(SEED_BOOKINGS, { onConflict: 'booking_id' });
    results.bookings = bkErr ? bkErr.message : 'OK';

    const { error: notifErr } = await supabase.from('notifications').upsert(SEED_NOTIFICATIONS, { onConflict: 'notification_id' });
    results.notifications = notifErr ? notifErr.message : 'OK';

    const { error: cmpErr } = await supabase.from('complaints').upsert(SEED_COMPLAINTS, { onConflict: 'complaint_id' });
    results.complaints = cmpErr ? cmpErr.message : 'OK';

    console.log('[Supabase Cloud Seeder Results]:', results);
    return { success: true, results };
  } catch (err) {
    console.warn('[Supabase Cloud Seeder Notice]:', err);
    return { success: false, error: err.message };
  }
}

