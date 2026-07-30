# Smart Rental Track — Industrial Fleet Management System

> AI/ML-powered demand forecasting and anomaly detection for heavy equipment rental fleets.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [ML Model Service](#ml-model-service)
  - [Dataset](#dataset)
  - [Demand Forecasting — LightGBM](#demand-forecasting--lightgbm)
  - [Anomaly Detection — Isolation Forest](#anomaly-detection--isolation-forest)
  - [API Endpoints](#ml-api-endpoints)
- [Backend Service (Next Phase)](#backend-service-next-phase)
- [Frontend Application](#frontend-application)
  - [Pages & Routes](#pages--routes)
  - [ML API Integration — TypeScript Boilerplate](#ml-api-integration--typescript-boilerplate)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Project Overview

Smart Rental Track is a full-stack industrial fleet management platform that helps construction and mining companies:

1. **Track equipment** (excavators, bulldozers, cranes, loaders, graders, compactors) across 10 job sites
2. **Forecast demand** per site × equipment type × date using gradient-boosted trees
3. **Detect anomalies** in rental events (excessive idle, impossible hours, missing operators/sites, extended rentals)
4. **Alert operators** in real-time when irregularities are found

---

## Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   React / Vite   │─────▶│   Supabase       │      │   ML Service     │
│   (Frontend)     │      │   (Auth + DB)    │      │   (Flask API)    │
│                  │      │                  │      │                  │
│   Port: 5173     │      │   Cloud Hosted   │      │   Port: 8000     │
│                  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                                                    ▲
        │                                                    │
        └────────────── REST calls ──────────────────────────┘
                        (forecast, anomaly detection)
```

---

## Tech Stack

| Layer      | Technology                          | Purpose                           |
|------------|-------------------------------------|-----------------------------------|
| Frontend   | React 19, Vite 8, Tailwind CSS 3   | UI, routing, data visualization   |
| Backend    | Supabase (PostgreSQL + Auth + RLS)  | User auth, equipment CRUD, RLS    |
| ML Service | Flask, LightGBM, scikit-learn       | Demand forecasting, anomaly detection |
| Deployment | Render (ML), Vercel/Netlify (FE)    | Hosting                           |

---

## ML Model Service

Located in `ml-model/`. This is a standalone Flask microservice that loads pre-trained models and exposes REST endpoints.

### Dataset

- **Source**: Synthetically generated (`generate_dataset.py`)
- **Records**: 2,000 rental events
- **Anomaly Rate**: ~5.45% (109 injected anomalies across 5 types)
- **Date Range**: Oct 2023 — Oct 2025
- **Sites**: S001 — S010
- **Equipment Types**: Excavator, Bulldozer, Crane, Loader, Grader, Compactor

#### Schema — `rental_dataset.csv`

| Column            | Type     | Description                                |
|-------------------|----------|--------------------------------------------|
| `Equipment_ID`    | string   | Unique equipment identifier (EQX1001–1200) |
| `Type`            | string   | Equipment category                         |
| `Site_ID`         | string   | Job site (S001–S010), nullable for anomaly  |
| `Check_In_Date`   | date     | Rental start date                          |
| `Check_Out_Date`  | date     | Rental end date                            |
| `Engine_Hours_Day`| float    | Avg daily engine hours                     |
| `Idle_Hours_Day`  | float    | Avg daily idle hours                       |
| `Rental_Days`     | int      | Duration of rental                         |
| `Last_Operator_ID`| string   | Operator assigned, nullable for anomaly     |
| `is_anomaly`      | int      | Ground truth label (0=normal, 1=anomaly)   |
| `anomaly_type`    | string   | Category: `none`, `excessive_idle`, `impossible_hours`, `unassigned_site`, `no_operator`, `extended_rental` |

#### Anomaly Injection Rules

| Anomaly Type        | Trigger Condition                     | Prevalence |
|---------------------|---------------------------------------|------------|
| `excessive_idle`    | idle_ratio > 0.85                     | ~1.5%      |
| `impossible_hours`  | engine + idle > 24 hrs/day            | ~0.5%      |
| `unassigned_site`   | Site_ID = NULL                        | ~1.5%      |
| `no_operator`       | Last_Operator_ID = NULL               | ~1.0%      |
| `extended_rental`   | Rental_Days > 90                      | ~1.0%      |

---

### Demand Forecasting — LightGBM

**Algorithm**: Gradient Boosted Decision Trees (LightGBM)

**Why LightGBM?**

| Alternative          | Problem                                         |
|----------------------|-------------------------------------------------|
| Linear Regression    | High bias — can't capture site×type×season interactions |
| Random Forest        | Decent but LightGBM converges faster with better accuracy |
| LSTM / Deep Learning | High variance on 2,000 rows — massive overfitting risk |
| **LightGBM**        | ✅ Best bias/variance tradeoff for tabular data at this scale |

**Features Used** (7 features):

| Feature        | Source                       |
|----------------|------------------------------|
| `site_enc`     | Label-encoded Site_ID        |
| `type_enc`     | Label-encoded Equipment Type |
| `month`        | Calendar month (1–12)        |
| `day_of_week`  | 0=Mon, 6=Sun                 |
| `day_of_year`  | 1–366                        |
| `quarter`      | 1–4                          |
| `is_weekend`   | Binary (Sat/Sun = 1)         |

**Anti-Memorization / Overfitting Controls**:

```
max_depth        = 4        # shallow trees → lower variance
num_leaves       = 15       # constrained complexity
subsample        = 0.7      # row subsampling per tree
colsample_bytree = 0.7      # feature subsampling per tree
reg_alpha        = 0.1      # L1 regularization
reg_lambda       = 0.5      # L2 regularization
min_child_samples= 10       # minimum data per leaf
early_stopping   = 30 rounds
```

**Results**:

| Metric | Value  |
|--------|--------|
| MAE    | 0.4521 |
| R²     | 0.1635 |

> Note: R² is modest because daily demand is inherently noisy at the site-level granularity. The model correctly captures seasonal trends (monsoon dips, peak season surges).

---

### Anomaly Detection — Isolation Forest

**Algorithm**: Isolation Forest (unsupervised ensemble)

**Why Isolation Forest?**

| Alternative        | Problem                                       |
|--------------------|-----------------------------------------------|
| Threshold Rules    | Too rigid, misses multivariate anomalies       |
| One-Class SVM      | Sensitive to kernel choice, poor on mixed types |
| Autoencoders       | Overkill for 9 features, memorization risk      |
| **Isolation Forest**| ✅ Naturally isolates rare events in fewer splits; ensemble of randomized trees keeps variance low |

**Features Used** (9 features):

| Feature              | Source                                |
|----------------------|---------------------------------------|
| `Engine_Hours_Day`   | Raw from dataset                      |
| `Idle_Hours_Day`     | Raw from dataset                      |
| `Rental_Days`        | Raw from dataset                      |
| `total_hours`        | Engineered: engine + idle             |
| `idle_ratio`         | Engineered: idle / total              |
| `is_missing_site`    | Binary: Site_ID is null               |
| `is_missing_operator`| Binary: Operator_ID is null           |
| `hours_over_24`      | Binary: total > 24                    |
| `type_enc`           | Label-encoded equipment type          |

**Anti-Memorization Controls**:

```
n_estimators = 200       # ensemble size
max_samples  = 0.8       # don't train on 100% → reduces memorization
max_features = 0.8       # feature subsampling
contamination= 0.06      # expected anomaly fraction
```

**Results**:

| Class    | Precision | Recall | F1-Score | Support |
|----------|-----------|--------|----------|---------|
| Normal   | 1.00      | 0.99   | 0.99     | 1891    |
| Anomaly  | 0.85      | 0.94   | 0.89     | 109     |
| **Overall Accuracy** | | | **0.99** | **2000** |

---

### ML API Endpoints

**Base URL**: `http://localhost:8000` (local) or `https://your-app.onrender.com` (deployed)

---

#### `GET /`

Index page — returns service info and available endpoints.

**Response**:
```json
{
  "message": "Smart Rental Track ML API is Live 🚀",
  "endpoints": {
    "health": "/health",
    "demand_forecast": "POST /api/v1/forecast",
    "anomaly_detection": "POST /api/v1/detect-anomaly",
    "anomalies_list": "GET /api/v1/anomalies",
    "demand_summary": "GET /api/v1/demand-summary"
  }
}
```

---

#### `GET /health`

Health check for monitoring and load balancers.

**Response**:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0"
}
```

---

#### `POST /api/v1/forecast`

Predict equipment demand for a specific site, type, and date.

**Request Body**:
```json
{
  "site_id": "S001",
  "equipment_type": "Excavator",
  "date": "2025-03-15"
}
```

| Field            | Type   | Required | Description                              |
|------------------|--------|----------|------------------------------------------|
| `site_id`        | string | ✅       | Site identifier (S001–S010)              |
| `equipment_type` | string | ✅       | One of: Excavator, Bulldozer, Crane, Loader, Grader, Compactor |
| `date`           | string | ✅       | Target date in YYYY-MM-DD format         |

**Response**:
```json
{
  "site_id": "S001",
  "equipment_type": "Excavator",
  "date": "2025-03-15",
  "predicted_demand": 4.23,
  "season": "peak"
}
```

| Field              | Type   | Description                                  |
|--------------------|--------|----------------------------------------------|
| `predicted_demand` | float  | Predicted number of active rentals            |
| `season`           | string | `peak` (Mar-Apr, Oct-Nov), `monsoon_low` (Jun-Sep), `normal` |

---

#### `POST /api/v1/detect-anomaly`

Score a single rental event for anomalies.

**Request Body**:
```json
{
  "equipment_type": "Bulldozer",
  "engine_hours_day": 0.5,
  "idle_hours_day": 22.0,
  "rental_days": 14,
  "site_id": "S003",
  "operator_id": "OP105"
}
```

| Field              | Type   | Required | Description                              |
|--------------------|--------|----------|------------------------------------------|
| `equipment_type`   | string | ✅       | Equipment category                       |
| `engine_hours_day` | float  | ✅       | Average daily engine hours (≥ 0)         |
| `idle_hours_day`   | float  | ✅       | Average daily idle hours (≥ 0)           |
| `rental_days`      | int    | ✅       | Rental duration in days (≥ 1)            |
| `site_id`          | string | optional | Site ID (null = unassigned → flag)        |
| `operator_id`      | string | optional | Operator ID (null = no operator → flag)   |

**Response**:
```json
{
  "is_anomaly": true,
  "anomaly_score": -0.1823,
  "risk_level": "critical",
  "flags": ["excessive_idle"]
}
```

| Field           | Type     | Description                                             |
|-----------------|----------|---------------------------------------------------------|
| `is_anomaly`    | boolean  | `true` if the model flags this event                    |
| `anomaly_score` | float    | Isolation Forest score (more negative = more anomalous) |
| `risk_level`    | string   | `low`, `medium`, `high`, `critical`                     |
| `flags`         | string[] | Human-readable flags: `excessive_idle`, `impossible_hours`, `unassigned_site`, `no_operator`, `extended_rental` |

**Risk Level Thresholds**:

| Score Range     | Risk Level |
|-----------------|------------|
| < -0.15         | critical   |
| -0.15 to -0.05  | high       |
| -0.05 to 0.0    | medium     |
| > 0.0           | low        |

---

#### `GET /api/v1/anomalies?limit=50`

Return pre-scored anomalies from the full dataset.

**Query Parameters**:

| Param   | Type | Default | Description                |
|---------|------|---------|----------------------------|
| `limit` | int  | 50      | Max number of results      |

**Response**: Array of scored rental records with `anomaly_score` and `predicted_anomaly` fields appended.

---

#### `GET /api/v1/demand-summary`

Aggregated demand statistics grouped by Site × Type × Month.

**Response**: Array of summary objects:
```json
[
  {
    "Site_ID": "S001",
    "Type": "Excavator",
    "month": 3,
    "total_rentals": 12,
    "avg_rental_days": 8.3,
    "avg_engine_hours": 7.1
  }
]
```

---

## Backend Service & Supabase Layer (COMPLETED)

The backend service is fully implemented using **Supabase Cloud (PostgreSQL + Auth + RLS)** combined with the **Flask ML Backend** and **Gemini AI Copilot**:

### Phase 1 — Supabase & Auth Setup (✅ Complete)

| Task | Detail | Status |
|------|--------|--------|
| Supabase client | Wired via `@supabase/supabase-js` | ✅ Complete |
| Auth & RBAC | Email authentication + 4 User Roles (Admin, Manager, Operator, Customer) | ✅ Complete |
| Data Sync | Direct DB profile storage on signup into `operators` table | ✅ Complete |
| Schema Resilience | 404/PGRST205 error handling with structured local fallbacks | ✅ Complete |

### Phase 2 — Complete Database CRUD Service (`database.js`) (✅ Complete)

Full service layer implementing cross-table queries and mutation functions:
- **Equipment CRUD**: `getEquipmentList`, `getEquipmentById`, `createEquipment`, `updateEquipment`, `deleteEquipment`, `bulkUpdateEquipmentStatus`, `lookupEquipmentByQR`
- **Rentals CRUD**: `getActiveRentals`, `getRentalHistory`, `createRentalRecord`, `checkOutRentalRecord`, `deleteRentalRecord`
- **Alerts CRUD**: `getUnresolvedAlerts`, `getAllAlerts`, `createAlert`, `resolveAlert`
- **Sites CRUD**: `getSites`, `createSite`, `updateSite`, `deleteSite`
- **Operators CRUD**: `getOperators`, `updateOperator`, `deleteOperator`, `saveUserProfile`
- **Fleet Search**: `searchFleet()` across equipment, rentals, and alerts

### Phase 2 — Database Schema

```sql
-- Equipment master table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT UNIQUE NOT NULL,       -- e.g. "EQX1001"
  type TEXT NOT NULL,                       -- Excavator, Bulldozer, etc.
  status TEXT DEFAULT 'available',          -- available, rented, maintenance
  current_site_id TEXT REFERENCES sites(site_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rental events
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT REFERENCES equipment(equipment_id),
  site_id TEXT NOT NULL,
  operator_id TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  engine_hours_day FLOAT DEFAULT 0,
  idle_hours_day FLOAT DEFAULT 0,
  rental_days INT GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_score FLOAT,
  risk_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sites
CREATE TABLE sites (
  site_id TEXT PRIMARY KEY,               -- S001–S010
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Operators
CREATE TABLE operators (
  operator_id TEXT PRIMARY KEY,            -- OP101–OP150
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts (generated by ML anomaly detection)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id),
  risk_level TEXT NOT NULL,
  flags TEXT[] DEFAULT '{}',
  anomaly_score FLOAT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 3 — Supabase Edge Functions (Optional)

If you need server-side logic beyond Supabase's auto-generated REST API:

| Function | Purpose |
|----------|---------|
| `check-anomaly` | On rental insert → call ML API `/detect-anomaly` → insert alert if flagged |
| `daily-forecast` | Cron job → call ML API `/forecast` for all sites → cache results |
| `send-alert` | Trigger email/push notification when critical anomaly detected |

### Phase 4 — Environment Variables

```env
# app/.env
VITE_SUPABASE_URL=https://tullkyvbklzznfdlteec.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pAYQ3iYRXxBdvqnj9fK-UQ_zvKaql39
VITE_ML_API_URL=http://localhost:8000

# ML Service .env (if needed)
PORT=8000
```

---

## Frontend Application

Located in `frontend/`. Built with React 19 + Vite 8 + Tailwind CSS 3.

### Pages & Routes

| Route                      | Component         | Description                     |
|----------------------------|-------------------|---------------------------------|
| `/`                        | Redirect → Login  |                                 |
| `/login`                   | `Login`           | Email/password login            |
| `/signup`                  | `SignUp`          | User registration               |
| `/dashboard`               | `Dashboard`       | Fleet overview, KPIs, charts    |
| `/equipment/:assetId`      | `EquipmentDetail` | Single equipment detail view    |
| `/check-in-out`            | `CheckInOut`      | Rental check-in/out flow        |
| `/alerts`                  | `Alerts`          | Anomaly alerts panel            |
| `/leaderboard`             | `Leaderboard`     | Operator performance ranking    |
| `/forecasting`             | `Forecasting`     | Demand forecasting dashboard    |
| `/weather`                 | `Weather`         | Weather impact on operations    |
| `/settings`                | `Settings`        | User and app settings           |

---

### ML API Integration — TypeScript Boilerplate

Create `frontend/src/services/mlApi.ts`:

```typescript
// ============================================================
// ML API Service — Smart Rental Track
// ============================================================
// Connects the React frontend to the Flask ML microservice.
// All endpoints return JSON. CORS is enabled on the Flask side.
// ============================================================

const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────

export interface ForecastRequest {
  site_id: string;           // "S001" – "S010"
  equipment_type: string;    // "Excavator" | "Bulldozer" | "Crane" | "Loader" | "Grader" | "Compactor"
  date: string;              // "YYYY-MM-DD"
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
  engine_hours_day: number;  // >= 0
  idle_hours_day: number;    // >= 0
  rental_days: number;       // >= 1
  site_id?: string | null;
  operator_id?: string | null;
}

export interface AnomalyResponse {
  is_anomaly: boolean;
  anomaly_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  flags: string[];
}

export interface HealthResponse {
  status: string;
  models_loaded: boolean;
  version: string;
}

export interface DemandSummaryItem {
  Site_ID: string;
  Type: string;
  month: number;
  total_rentals: number;
  avg_rental_days: number;
  avg_engine_hours: number;
}

// ── API Functions ──────────────────────────────────────────────

/**
 * Health check — verify the ML service is running.
 *
 * Usage:
 *   const health = await checkHealth();
 *   if (health.models_loaded) { ... }
 */
export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${ML_API_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * Demand Forecast — predict rental demand for a site + equipment type + date.
 *
 * Usage:
 *   const forecast = await getDemandForecast({
 *     site_id: "S001",
 *     equipment_type: "Excavator",
 *     date: "2025-03-15"
 *   });
 *   console.log(forecast.predicted_demand); // e.g. 4.23
 *   console.log(forecast.season);           // e.g. "peak"
 */
export async function getDemandForecast(
  request: ForecastRequest
): Promise<ForecastResponse> {
  const res = await fetch(`${ML_API_URL}/api/v1/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Forecast failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Anomaly Detection — score a rental event for anomalies.
 *
 * Usage:
 *   const result = await detectAnomaly({
 *     equipment_type: "Bulldozer",
 *     engine_hours_day: 0.5,
 *     idle_hours_day: 22.0,
 *     rental_days: 14,
 *     site_id: "S003",
 *     operator_id: "OP105"
 *   });
 *   if (result.is_anomaly) {
 *     console.log(`Risk: ${result.risk_level}`);
 *     console.log(`Flags: ${result.flags.join(", ")}`);
 *   }
 */
export async function detectAnomaly(
  request: AnomalyRequest
): Promise<AnomalyResponse> {
  const res = await fetch(`${ML_API_URL}/api/v1/detect-anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Anomaly detection failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Anomalies — fetch pre-scored anomalies from the dataset.
 *
 * Usage:
 *   const anomalies = await getAnomalies(20);
 *   anomalies.forEach(a => console.log(a.Equipment_ID, a.anomaly_score));
 */
export async function getAnomalies(limit: number = 50): Promise<any[]> {
  const res = await fetch(`${ML_API_URL}/api/v1/anomalies?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch anomalies: ${res.status}`);
  return res.json();
}

/**
 * Demand Summary — aggregated demand stats by site × type × month.
 *
 * Usage:
 *   const summary = await getDemandSummary();
 *   // Group by site for chart rendering
 *   const s001 = summary.filter(s => s.Site_ID === "S001");
 */
export async function getDemandSummary(): Promise<DemandSummaryItem[]> {
  const res = await fetch(`${ML_API_URL}/api/v1/demand-summary`);
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);
  return res.json();
}
```

### Supabase Client Boilerplate

Create `frontend/src/services/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ───────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  return supabase.auth.getUser();
}

// ── Equipment CRUD ─────────────────────────────────────────────

export async function getEquipment() {
  return supabase.from("equipment").select("*").order("equipment_id");
}

export async function getEquipmentById(equipmentId: string) {
  return supabase
    .from("equipment")
    .select("*")
    .eq("equipment_id", equipmentId)
    .single();
}

// ── Rentals ────────────────────────────────────────────────────

export async function getRentals(siteId?: string) {
  let query = supabase.from("rentals").select("*").order("check_in_date", { ascending: false });
  if (siteId) query = query.eq("site_id", siteId);
  return query;
}

export async function createRental(rental: {
  equipment_id: string;
  site_id: string;
  operator_id?: string;
  check_in_date: string;
  check_out_date?: string;
  engine_hours_day?: number;
  idle_hours_day?: number;
}) {
  return supabase.from("rentals").insert(rental).select().single();
}

// ── Alerts ─────────────────────────────────────────────────────

export async function getAlerts(unresolvedOnly: boolean = true) {
  let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
  if (unresolvedOnly) query = query.eq("is_resolved", false);
  return query;
}

export async function resolveAlert(alertId: string, userId: string) {
  return supabase
    .from("alerts")
    .update({ is_resolved: true, resolved_by: userId })
    .eq("id", alertId);
}
```

### Example: Using ML API in a React Component

```tsx
// frontend/src/pages/Forecasting.tsx (example usage)
import { useState } from "react";
import { getDemandForecast, ForecastRequest, ForecastResponse } from "../services/mlApi";

export default function Forecasting() {
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleForecast() {
    setLoading(true);
    try {
      const forecast = await getDemandForecast({
        site_id: "S001",
        equipment_type: "Excavator",
        date: "2025-03-15",
      });
      setResult(forecast);
    } catch (err) {
      console.error("Forecast error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleForecast} disabled={loading}>
        {loading ? "Predicting..." : "Get Forecast"}
      </button>
      {result && (
        <div>
          <p>Predicted Demand: {result.predicted_demand}</p>
          <p>Season: {result.season}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Deployment

### ML Service → Render

1. Push the `ml-model/` folder to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your repo, set **Root Directory** to `ml-model`
4. Render auto-detects the `Dockerfile` and `render.yaml`
5. After deploy, copy the URL (e.g. `https://smart-rental-ml-api.onrender.com`)
6. Add to your frontend `.env`: `VITE_ML_API_URL=https://smart-rental-ml-api.onrender.com`

### Frontend → Vercel / Netlify

1. Push the `frontend/` folder to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ML_API_URL`

---

## Project Structure

```
MSD-caterpillar/
│
├── app/                               # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── contexts/                  # React Context Providers
│   │   │   ├── AuthContext.jsx        # Auth & Role state
│   │   │   └── ToastContext.jsx       # Action Toast Notification system
│   │   ├── hooks/                     # Custom React Hooks
│   │   │   ├── useAuth.js             # Supabase Auth hook
│   │   │   └── useToast.js            # Action Reporting Toast hook
│   │   ├── pages/                     # Route-level page components
│   │   │   ├── Login.jsx              # Authenticated login
│   │   │   ├── SignUp.jsx             # Role-based signup
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EquipmentDetail.jsx
│   │   │   ├── CheckInOut.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Forecasting.jsx
│   │   │   ├── Weather.jsx
│   │   │   └── Settings.jsx
│   │   ├── utils/                     # Utility services
│   │   │   └── supabase.js            # Supabase JS client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env                           # Environment variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── ml-model/                          # Flask ML microservice
│   ├── app.py                         # Flask REST API server
│   ├── generate_dataset.py            # Synthetic data generator
│   ├── train_models.py                # Model training pipeline
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Docker build for Render
│   ├── render.yaml                    # Render deployment config
│   ├── data/
│   │   ├── rental_dataset.csv         # 2,000 synthetic rental events
│   │   └── anomaly_scored_output.csv  # All rows scored by anomaly model
│   └── models/
│       ├── demand_model.joblib        # Trained LightGBM model
│       ├── anomaly_model.joblib       # Trained Isolation Forest model
│       ├── le_site.joblib             # Site label encoder
│       ├── le_type.joblib             # Equipment type encoder
│       ├── le_type_anomaly.joblib     # Type encoder (anomaly model)
│       ├── demand_features.joblib     # Feature list (demand)
│       └── anomaly_features.joblib    # Feature list (anomaly)
│
├── .gitignore
├── backend.md                         # Detailed backend integration guide
└── README.md                          # Main project documentation
```
