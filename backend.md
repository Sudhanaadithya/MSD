# Backend Integration Guide — Smart Rental Track

> Step-by-step phases to wire Supabase (auth + database) and the ML microservice into your React frontend.

---

## Overview

```
Phase 1 → Supabase Project Setup & Auth
Phase 2 → Database Tables + RLS Policies
Phase 3 → Frontend ↔ Supabase Integration
Phase 4 → Frontend ↔ ML Service Integration
Phase 5 → Supabase Edge Functions (ML ↔ DB automation)
Phase 6 → Production Deployment
```

---

## Phase 1 — Supabase Project Setup & Auth

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `smart-rental-track`
3. Set a strong database password (save it)
4. Region: Choose closest to your users
5. Wait for provisioning (~2 min)

### Step 1.2: Grab API Keys

After creation, go to **Settings → API**. Copy these two values:

| Key                  | Where to Find                  | Used By       |
|----------------------|--------------------------------|---------------|
| `Project URL`        | Settings → API → Project URL   | Frontend      |
| `anon / public key`  | Settings → API → Project API Keys | Frontend   |
| `service_role key`   | Settings → API → Project API Keys | Edge Functions only (NEVER expose to frontend) |

### Step 1.3: Create Frontend `.env`

```env
# app/.env
VITE_SUPABASE_URL=https://tullkyvbklzznfdlteec.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pAYQ3iYRXxBdvqnj9fK-UQ_zvKaql39
VITE_ML_API_URL=http://localhost:8000
```

### Step 1.4: Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** (enabled by default)
3. Optional: Enable **Google OAuth**
   - Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Paste Client ID + Secret into Supabase
4. Go to **Authentication → URL Configuration**
   - Set **Site URL**: `http://localhost:5173` (dev) or your production URL
   - Add redirect URLs: `http://localhost:5173/**`

### Step 1.5: Install Supabase Client in Frontend

```bash
cd app
npm install @supabase/supabase-js
```

---

## Phase 2 — Database Tables + Row Level Security

### Step 2.1: Create Tables

Run these SQL statements in **Supabase → SQL Editor**:

```sql
-- ════════════════════════════════════════════════════════════════
-- 1. SITES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE sites (
  site_id    TEXT PRIMARY KEY,           -- S001–S010
  name       TEXT NOT NULL,
  location   TEXT,
  latitude   FLOAT,
  longitude  FLOAT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial sites
INSERT INTO sites (site_id, name, location) VALUES
  ('S001', 'Highway Construction Zone A', 'Chennai, TN'),
  ('S002', 'Metro Rail Extension',        'Bangalore, KA'),
  ('S003', 'Industrial Park Development', 'Hyderabad, TS'),
  ('S004', 'Dam Construction Site',       'Pune, MH'),
  ('S005', 'Mining Operations East',      'Ranchi, JH'),
  ('S006', 'Bridge Construction',         'Kolkata, WB'),
  ('S007', 'Wind Farm Installation',      'Jaisalmer, RJ'),
  ('S008', 'Airport Runway Extension',    'Delhi, DL'),
  ('S009', 'Residential Township',        'Mumbai, MH'),
  ('S010', 'Quarry Operations South',     'Coimbatore, TN');

-- ════════════════════════════════════════════════════════════════
-- 2. OPERATORS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE operators (
  operator_id TEXT PRIMARY KEY,           -- OP101–OP150
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT DEFAULT 'Operator',    -- Manager | Admin | Operator
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- 3. EQUIPMENT
-- ════════════════════════════════════════════════════════════════
CREATE TABLE equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    TEXT UNIQUE NOT NULL,       -- EQX1001–EQX1200
  type            TEXT NOT NULL,              -- Excavator, Bulldozer, Crane, Loader, Grader, Compactor
  model           TEXT,
  manufacturer    TEXT DEFAULT 'Caterpillar',
  year            INT,
  status          TEXT DEFAULT 'available',   -- available, rented, maintenance, decommissioned
  current_site_id TEXT REFERENCES sites(site_id),
  last_service    DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- 4. RENTALS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE rentals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id     TEXT NOT NULL REFERENCES equipment(equipment_id),
  site_id          TEXT REFERENCES sites(site_id),
  operator_id      TEXT REFERENCES operators(operator_id),
  check_in_date    DATE NOT NULL,
  check_out_date   DATE,
  engine_hours_day FLOAT DEFAULT 0,
  idle_hours_day   FLOAT DEFAULT 0,
  rental_days      INT,
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Auto-calculate rental_days on insert/update
CREATE OR REPLACE FUNCTION calc_rental_days()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_date IS NOT NULL THEN
    NEW.rental_days := NEW.check_out_date - NEW.check_in_date;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_rental_days
  BEFORE INSERT OR UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION calc_rental_days();

-- ════════════════════════════════════════════════════════════════
-- 5. ALERTS (generated by ML anomaly detection)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id      UUID REFERENCES rentals(id) ON DELETE CASCADE,
  equipment_id   TEXT NOT NULL,
  site_id        TEXT,
  risk_level     TEXT NOT NULL,                -- low, medium, high, critical
  anomaly_score  FLOAT,
  flags          TEXT[] DEFAULT '{}',          -- e.g. {'excessive_idle', 'no_operator'}
  is_resolved    BOOLEAN DEFAULT false,
  resolved_by    UUID REFERENCES auth.users(id),
  resolved_at    TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- 6. FORECAST CACHE (stores daily ML predictions)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE forecast_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          TEXT NOT NULL REFERENCES sites(site_id),
  equipment_type   TEXT NOT NULL,
  forecast_date    DATE NOT NULL,
  predicted_demand FLOAT NOT NULL,
  season           TEXT,
  generated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, equipment_type, forecast_date)
);
```

### Step 2.2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE sites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators      ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_cache ENABLE ROW LEVEL SECURITY;

-- ── Read policies (any authenticated user can read) ────────────
CREATE POLICY "Authenticated users can read sites"
  ON sites FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read operators"
  ON operators FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read equipment"
  ON equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read rentals"
  ON rentals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read alerts"
  ON alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read forecasts"
  ON forecast_cache FOR SELECT TO authenticated USING (true);

-- ── Write policies (authenticated users can create) ────────────
CREATE POLICY "Authenticated users can insert rentals"
  ON rentals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their rentals"
  ON rentals FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- ── Alert resolution (any authenticated user) ──────────────────
CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE TO authenticated
  USING (true);

-- ── Service role can insert alerts and forecasts ───────────────
-- (Edge Functions use service_role key, which bypasses RLS)
CREATE POLICY "Service role can insert alerts"
  ON alerts FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert forecasts"
  ON forecast_cache FOR INSERT TO service_role
  WITH CHECK (true);
```

### Step 2.3: Create Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_rentals_site       ON rentals(site_id);
CREATE INDEX idx_rentals_equipment  ON rentals(equipment_id);
CREATE INDEX idx_rentals_dates      ON rentals(check_in_date, check_out_date);
CREATE INDEX idx_alerts_unresolved  ON alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_alerts_risk        ON alerts(risk_level);
CREATE INDEX idx_forecast_lookup    ON forecast_cache(site_id, equipment_type, forecast_date);
CREATE INDEX idx_equipment_status   ON equipment(status);
```

---

## Phase 3 — Frontend ↔ Supabase Integration

### Step 3.1: Create Supabase Client (React JS)

Create `app/src/utils/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 3.2: Auth Context & Role-Based Authorization

Create `app/src/contexts/AuthContext.jsx`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('Manager'); // Manager | Admin | Operator
  const [userMetadata, setUserMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          const meta = session.user.user_metadata || {};
          setUserMetadata(meta);
          setRole(meta.role || 'Manager');
        }
      } catch (err) {
        console.error('Error getting auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        setUserMetadata(meta);
        setRole(meta.role || 'Manager');
      } else {
        setUser(null);
        setRole('Customer');
        setUserMetadata({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password, fullName, role, regType, companyOrWorkId }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role || 'Manager',
          reg_type: regType || 'customer',
          company_or_work_id: companyOrWorkId || '',
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        userMetadata,
        loading,
        login,
        signUp,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Step 3.3: Custom Hooks (`app/src/hooks/useAuth.js`)

For Vite React Fast Refresh compliance:

```javascript
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Step 3.4: Role-Based Protected Route Wrapper

Create `app/src/components/ProtectedRoute.jsx`:

```javascript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-body-md text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-bold text-secondary uppercase tracking-widest text-xs">Authenticating Station...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Step 3.5: Action Reporting Notification System

Create `app/src/contexts/ToastContext.jsx` & `app/src/hooks/useToast.js` for real-time reporting of account actions (creation, sign in, sign out, role access):

```javascript
import React, { createContext, useState, useContext } from 'react';

export const ToastContext = createContext({});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-sm max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto p-md rounded-lg shadow-xl border flex items-start gap-sm">
            <span className="material-symbols-outlined text-xl">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <div className="flex-1">
              {toast.title && <h4 className="font-label-bold text-xs uppercase tracking-wider mb-0.5">{toast.title}</h4>}
              <p className="font-body-sm text-xs leading-snug">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
```
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

### Step 3.3: Protected Route Wrapper

Create `frontend/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

### Step 3.4: Data Service Layer

Create `frontend/src/services/database.ts`:

```typescript
import { supabase } from "../lib/supabase";

// ── Equipment ──────────────────────────────────────────────────

export async function getEquipmentList() {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, sites(name)")
    .order("equipment_id");
  if (error) throw error;
  return data;
}

export async function getEquipmentById(equipmentId: string) {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, sites(name, location)")
    .eq("equipment_id", equipmentId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEquipmentStatus(
  equipmentId: string,
  status: "available" | "rented" | "maintenance"
) {
  const { error } = await supabase
    .from("equipment")
    .update({ status })
    .eq("equipment_id", equipmentId);
  if (error) throw error;
}

// ── Rentals ────────────────────────────────────────────────────

export async function getActiveRentals() {
  const { data, error } = await supabase
    .from("rentals")
    .select("*, equipment(type, status), sites(name), operators(name)")
    .is("check_out_date", null)
    .order("check_in_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRentalHistory(filters?: {
  siteId?: string;
  equipmentType?: string;
  limit?: number;
}) {
  let query = supabase
    .from("rentals")
    .select("*, equipment(type), sites(name), operators(name)")
    .not("check_out_date", "is", null)
    .order("check_in_date", { ascending: false });

  if (filters?.siteId) query = query.eq("site_id", filters.siteId);
  if (filters?.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createRental(rental: {
  equipment_id: string;
  site_id: string;
  operator_id?: string;
  check_in_date: string;
  engine_hours_day?: number;
  idle_hours_day?: number;
}) {
  // Get the current user's ID for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("rentals")
    .insert({ ...rental, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkOutRental(rentalId: string, checkOutDate: string) {
  const { error } = await supabase
    .from("rentals")
    .update({ check_out_date: checkOutDate })
    .eq("id", rentalId);
  if (error) throw error;
}

// ── Alerts ─────────────────────────────────────────────────────

export async function getUnresolvedAlerts() {
  const { data, error } = await supabase
    .from("alerts")
    .select("*, rentals(equipment_id, site_id, check_in_date)")
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolveAlert(alertId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("alerts")
    .update({
      is_resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);
  if (error) throw error;
}

// ── Sites ──────────────────────────────────────────────────────

export async function getSites() {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("is_active", true)
    .order("site_id");
  if (error) throw error;
  return data;
}

// ── Forecasts ──────────────────────────────────────────────────

export async function getCachedForecasts(siteId: string) {
  const { data, error } = await supabase
    .from("forecast_cache")
    .select("*")
    .eq("site_id", siteId)
    .gte("forecast_date", new Date().toISOString().split("T")[0])
    .order("forecast_date");
  if (error) throw error;
  return data;
}

// ── Dashboard KPIs ─────────────────────────────────────────────

export async function getDashboardStats() {
  const [equipmentRes, rentalRes, alertRes] = await Promise.all([
    supabase.from("equipment").select("status", { count: "exact" }),
    supabase.from("rentals").select("id", { count: "exact" }).is("check_out_date", null),
    supabase.from("alerts").select("id", { count: "exact" }).eq("is_resolved", false),
  ]);

  return {
    totalEquipment: equipmentRes.count ?? 0,
    activeRentals: rentalRes.count ?? 0,
    unresolvedAlerts: alertRes.count ?? 0,
  };
}
```

---

## Phase 4 — Frontend ↔ ML Service Integration

### Step 4.1: Create ML API Service

Create `frontend/src/services/mlApi.ts`:

```typescript
const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────

export interface ForecastRequest {
  site_id: string;
  equipment_type: string;
  date: string;  // YYYY-MM-DD
}

export interface ForecastResponse {
  site_id: string;
  equipment_type: string;
  date: string;
  predicted_demand: number;
  season: "peak" | "monsoon_low" | "normal";
}

export interface AnomalyRequest {
  equipment_type: string;
  engine_hours_day: number;
  idle_hours_day: number;
  rental_days: number;
  site_id?: string | null;
  operator_id?: string | null;
}

export interface AnomalyResponse {
  is_anomaly: boolean;
  anomaly_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  flags: string[];
}

export interface DemandSummaryItem {
  Site_ID: string;
  Type: string;
  month: number;
  total_rentals: number;
  avg_rental_days: number;
  avg_engine_hours: number;
}

// ── API Calls ──────────────────────────────────────────────────

export async function checkMLHealth() {
  const res = await fetch(`${ML_API_URL}/health`);
  return res.json();
}

export async function getDemandForecast(req: ForecastRequest): Promise<ForecastResponse> {
  const res = await fetch(`${ML_API_URL}/api/v1/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
  return res.json();
}

export async function detectAnomaly(req: AnomalyRequest): Promise<AnomalyResponse> {
  const res = await fetch(`${ML_API_URL}/api/v1/detect-anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Anomaly detection failed: ${res.status}`);
  return res.json();
}

export async function getAnomalies(limit = 50) {
  const res = await fetch(`${ML_API_URL}/api/v1/anomalies?limit=${limit}`);
  return res.json();
}

export async function getDemandSummary(): Promise<DemandSummaryItem[]> {
  const res = await fetch(`${ML_API_URL}/api/v1/demand-summary`);
  return res.json();
}
```

### Step 4.2: Wire into Frontend Pages

| Page              | ML Endpoint Used                  | Purpose                                 |
|-------------------|-----------------------------------|-----------------------------------------|
| `Forecasting.jsx` | `POST /api/v1/forecast`           | Show demand prediction chart per site   |
| `Alerts.jsx`      | `GET /api/v1/anomalies`           | Display detected anomaly list           |
| `Dashboard.jsx`   | `GET /api/v1/demand-summary`      | Render demand KPI cards                 |
| `CheckInOut.jsx`  | `POST /api/v1/detect-anomaly`     | Auto-scan new rentals on submit         |
| `EquipmentDetail` | `POST /api/v1/forecast`           | Show demand forecast for that asset type|

### Step 4.3: Auto-Scan Rental on Check-In (Key Integration)

When a user submits a new rental via `CheckInOut.jsx`:

```typescript
// In your check-in form submit handler:
import { createRental } from "../services/database";
import { detectAnomaly } from "../services/mlApi";

async function handleCheckIn(formData) {
  // 1. Save rental to Supabase
  const rental = await createRental({
    equipment_id: formData.equipmentId,
    site_id: formData.siteId,
    operator_id: formData.operatorId,
    check_in_date: formData.date,
    engine_hours_day: formData.engineHours,
    idle_hours_day: formData.idleHours,
  });

  // 2. Run anomaly detection on the new rental
  const anomalyResult = await detectAnomaly({
    equipment_type: formData.equipmentType,
    engine_hours_day: formData.engineHours,
    idle_hours_day: formData.idleHours,
    rental_days: formData.rentalDays,
    site_id: formData.siteId,
    operator_id: formData.operatorId,
  });

  // 3. If anomalous, show alert to user and save to alerts table
  if (anomalyResult.is_anomaly) {
    // Insert alert into Supabase
    await supabase.from("alerts").insert({
      rental_id: rental.id,
      equipment_id: formData.equipmentId,
      site_id: formData.siteId,
      risk_level: anomalyResult.risk_level,
      anomaly_score: anomalyResult.anomaly_score,
      flags: anomalyResult.flags,
    });

    // Show toast/modal to user
    toast.warning(
      `⚠️ Anomaly detected: ${anomalyResult.flags.join(", ")} — Risk: ${anomalyResult.risk_level}`
    );
  }
}
```

---

## Phase 5 — Supabase Edge Functions (Automation)

These run server-side on Supabase infrastructure. Use when you need automated ML checks without frontend involvement.

### Step 5.1: Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase init    # run in project root
supabase link --project-ref your-project-id
```

### Step 5.2: Edge Function — Auto Anomaly Check on Rental Insert

Create `supabase/functions/check-anomaly/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ML_API_URL = Deno.env.get("ML_API_URL") || "https://smart-rental-ml-api.onrender.com";

serve(async (req) => {
  const { record } = await req.json();  // rental row from DB webhook

  // Call ML anomaly detection
  const mlRes = await fetch(`${ML_API_URL}/api/v1/detect-anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      equipment_type: record.equipment_type,
      engine_hours_day: record.engine_hours_day,
      idle_hours_day: record.idle_hours_day,
      rental_days: record.rental_days,
      site_id: record.site_id,
      operator_id: record.operator_id,
    }),
  });
  const result = await mlRes.json();

  // If anomalous, insert an alert
  if (result.is_anomaly) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("alerts").insert({
      rental_id: record.id,
      equipment_id: record.equipment_id,
      site_id: record.site_id,
      risk_level: result.risk_level,
      anomaly_score: result.anomaly_score,
      flags: result.flags,
    });
  }

  return new Response(JSON.stringify({ checked: true, is_anomaly: result.is_anomaly }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Step 5.3: Create Database Webhook Trigger

In Supabase Dashboard → **Database → Webhooks**:

| Setting       | Value                                          |
|---------------|------------------------------------------------|
| Name          | `on_rental_insert_check_anomaly`               |
| Table         | `rentals`                                      |
| Events        | `INSERT`                                       |
| Webhook URL   | `https://your-project.supabase.co/functions/v1/check-anomaly` |
| HTTP Headers  | `Authorization: Bearer <SUPABASE_ANON_KEY>`    |

### Step 5.4: Edge Function — Daily Forecast Cron

Create `supabase/functions/daily-forecast/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ML_API_URL = Deno.env.get("ML_API_URL")!;
const SITES = ["S001","S002","S003","S004","S005","S006","S007","S008","S009","S010"];
const TYPES = ["Excavator","Bulldozer","Crane","Loader","Grader","Compactor"];

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const forecasts = [];

  // Generate forecasts for next 7 days × all sites × all types
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split("T")[0];

    for (const site of SITES) {
      for (const type of TYPES) {
        try {
          const res = await fetch(`${ML_API_URL}/api/v1/forecast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ site_id: site, equipment_type: type, date: dateStr }),
          });
          const result = await res.json();
          forecasts.push({
            site_id: site,
            equipment_type: type,
            forecast_date: dateStr,
            predicted_demand: result.predicted_demand,
            season: result.season,
          });
        } catch (e) {
          console.error(`Forecast failed for ${site}/${type}/${dateStr}:`, e);
        }
      }
    }
  }

  // Upsert all forecasts
  const { error } = await supabase
    .from("forecast_cache")
    .upsert(forecasts, { onConflict: "site_id,equipment_type,forecast_date" });

  return new Response(JSON.stringify({
    generated: forecasts.length,
    error: error?.message || null,
  }), { headers: { "Content-Type": "application/json" } });
});
```

### Step 5.5: Set Up Cron Schedule

In Supabase Dashboard → **Database → Extensions** → Enable `pg_cron`.

```sql
-- Run daily forecast every day at 2:00 AM IST (8:30 PM UTC previous day)
SELECT cron.schedule(
  'daily-forecast-job',
  '30 20 * * *',  -- 20:30 UTC = 02:00 IST
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-forecast',
    headers := '{"Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Step 5.6: Deploy Edge Functions

```bash
supabase functions deploy check-anomaly
supabase functions deploy daily-forecast

# Set secrets
supabase secrets set ML_API_URL=https://smart-rental-ml-api.onrender.com
```

---

## Phase 6 — Production Deployment

### Step 6.1: Deploy ML Service to Render

```bash
cd ml-model
git add .
git commit -m "ML service ready for deployment"
git push origin main
```

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect GitHub repo
3. Set **Root Directory**: `ml-model`
4. Render detects `Dockerfile` and `render.yaml` automatically
5. Copy deployed URL → update `.env` and Edge Function secrets

### Step 6.2: Deploy Frontend to Vercel

```bash
cd frontend
npm run build    # verify build succeeds locally
```

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect GitHub repo, set **Root Directory**: `frontend`
3. Framework: **Vite**
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ML_API_URL` (Render URL from Step 6.1)

### Step 6.3: Update CORS and Auth URLs

- **Supabase Auth** → URL Configuration → Set **Site URL** to your Vercel domain
- **ML Service** (`app.py`) → Update `CORS allow_origins` from `*` to your Vercel domain for production

### Step 6.4: Checklist

| Task | Status |
|------|--------|
| Supabase project created | ☐ |
| Auth enabled (email + optional OAuth) | ☐ |
| All 6 tables created with RLS | ☐ |
| Sites seeded with initial data | ☐ |
| Frontend `.env` configured | ☐ |
| `@supabase/supabase-js` installed | ☐ |
| Auth context + protected routes added | ☐ |
| Database service layer created | ☐ |
| ML API service layer created | ☐ |
| Check-in form wired to anomaly detection | ☐ |
| Forecasting page wired to ML forecast | ☐ |
| Edge functions deployed (optional) | ☐ |
| ML service deployed to Render | ☐ |
| Frontend deployed to Vercel | ☐ |
| CORS + Auth URLs updated for production | ☐ |

---

## Quick Reference — All API Endpoints

### ML Service (`http://localhost:8000`)

| Method | Endpoint                  | Auth Required | Description                   |
|--------|---------------------------|---------------|-------------------------------|
| GET    | `/`                       | No            | Service info + endpoint index |
| GET    | `/health`                 | No            | Health check                  |
| POST   | `/api/v1/forecast`        | No            | Demand prediction             |
| POST   | `/api/v1/detect-anomaly`  | No            | Anomaly scoring               |
| GET    | `/api/v1/anomalies`       | No            | List scored anomalies         |
| GET    | `/api/v1/demand-summary`  | No            | Aggregated demand stats       |

### Supabase (auto-generated REST)

| Method | Table            | Auth Required | Common Queries                  |
|--------|------------------|---------------|---------------------------------|
| GET    | `equipment`      | Yes           | List all, filter by status/type |
| GET    | `rentals`        | Yes           | Active rentals, history         |
| POST   | `rentals`        | Yes           | Create new rental               |
| PATCH  | `rentals`        | Yes           | Check-out (set check_out_date)  |
| GET    | `alerts`         | Yes           | Unresolved alerts               |
| PATCH  | `alerts`         | Yes           | Resolve alert                   |
| GET    | `sites`          | Yes           | List active sites               |
| GET    | `forecast_cache` | Yes           | Cached ML predictions           |
