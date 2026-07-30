# Smart Rental ML Service

REST API for **demand forecasting** and **anomaly detection** in industrial fleet management.  
Built with FastAPI + LightGBM + Isolation Forest. Deployable to Render.

## Project Structure

```
ml-model/
├── app.py                  ← FastAPI server (deploy this)
├── generate_dataset.py     ← Synthetic data generator (~500 rows)
├── train_models.py         ← Trains both models, saves to models/
├── requirements.txt        ← Python dependencies
├── Dockerfile              ← Docker build for Render
├── render.yaml             ← Render deployment config
├── data/
│   ├── rental_dataset.csv          ← Generated dataset
│   └── anomaly_scored_output.csv   ← Every row scored by anomaly model
└── models/
    ├── demand_model.joblib         ← LightGBM demand forecaster
    ├── anomaly_model.joblib        ← Isolation Forest anomaly detector
    ├── le_site.joblib              ← Site label encoder
    ├── le_type.joblib              ← Equipment type encoder
    ├── le_type_anomaly.joblib      ← Type encoder for anomaly model
    ├── demand_features.joblib      ← Feature list (demand)
    └── anomaly_features.joblib     ← Feature list (anomaly)
```

## Quick Start (Local)

```bash
cd ml-model

# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate dataset
python generate_dataset.py

# 3. Train models
python train_models.py

# 4. Start API server
python app.py
# → http://localhost:8000/docs (Swagger UI)
```

## API Endpoints

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/health`                  | Health check                         |
| POST   | `/api/v1/forecast`         | Predict demand for site+type+date    |
| POST   | `/api/v1/detect-anomaly`   | Score a rental event for anomalies   |
| GET    | `/api/v1/anomalies`        | List detected anomalies from dataset |
| GET    | `/api/v1/demand-summary`   | Aggregated demand statistics         |

### Example: Forecast Request

```bash
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{"site_id": "S001", "equipment_type": "Excavator", "date": "2025-03-15"}'
```

### Example: Anomaly Detection

```bash
curl -X POST http://localhost:8000/api/v1/detect-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_type": "Bulldozer",
    "engine_hours_day": 0.5,
    "idle_hours_day": 22.0,
    "rental_days": 14,
    "site_id": "S003",
    "operator_id": "OP105"
  }'
```

## Connecting from React/TS Frontend

```typescript
// Example: src/services/mlApi.ts
const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

export async function getForecast(siteId: string, type: string, date: string) {
  const res = await fetch(`${ML_API_URL}/api/v1/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_id: siteId, equipment_type: type, date }),
  });
  return res.json();
}

export async function detectAnomaly(event: AnomalyInput) {
  const res = await fetch(`${ML_API_URL}/api/v1/detect-anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return res.json();
}
```

## Deploy to Render

1. Push `ml-model/` to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo, set **Root Directory** to `ml-model`
4. Render auto-detects the Dockerfile
5. After deploy, copy the URL (e.g. `https://smart-rental-ml-api.onrender.com`)
6. Set `VITE_ML_API_URL` in your React app's `.env`

## Algorithm Rationale

### Demand Forecasting → LightGBM
- **Why not Linear Regression?** High bias — can't capture site×type×season interactions
- **Why not LSTM/Deep Net?** High variance on ~500 rows — needs far more data
- **Why LightGBM?** Shallow boosted trees balance bias/variance perfectly for tabular data at this scale

### Anomaly Detection → Isolation Forest
- **Why not threshold rules?** Too rigid, misses multivariate anomalies
- **Why not Autoencoders?** Overkill for 9 features, risk of memorization
- **Why Isolation Forest?** Naturally isolates rare events in fewer splits; ensemble of randomized trees keeps variance low

### Anti-Memorization Controls
- LightGBM: `max_depth=4`, `subsample=0.7`, `colsample=0.7`, L1/L2 reg, early stopping
- Isolation Forest: `max_samples=0.8`, `max_features=0.8`, 200 estimators
