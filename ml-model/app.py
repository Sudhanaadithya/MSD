"""
Flask ML Service — Smart Rental Tracking System
===================================================
REST API endpoints for demand forecasting and anomaly detection.
Deploy to Render as a Web Service.
"""

import os
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Globals ─────────────────────────────────────────────────────────
MODEL_DIR = "models"
DATA_DIR = "data"

print("Loading models...")
demand_model = joblib.load(f"{MODEL_DIR}/demand_model.joblib")
anomaly_model = joblib.load(f"{MODEL_DIR}/anomaly_model.joblib")
le_site = joblib.load(f"{MODEL_DIR}/le_site.joblib")
le_type = joblib.load(f"{MODEL_DIR}/le_type.joblib")
le_type_anomaly = joblib.load(f"{MODEL_DIR}/le_type_anomaly.joblib")

scored_path = f"{DATA_DIR}/anomaly_scored_output.csv"
scored_df = pd.read_csv(scored_path) if os.path.exists(scored_path) else None
print("Models loaded ✅")

app = Flask(__name__)
CORS(app)  # allow React frontend

# ── Helpers ─────────────────────────────────────────────────────────
def get_season(month: int) -> str:
    if month in (6, 7, 8, 9):
        return "monsoon_low"
    elif month in (3, 4, 10, 11):
        return "peak"
    return "normal"

def safe_encode(encoder, value, fallback=0):
    try:
        return encoder.transform([value])[0]
    except ValueError:
        return fallback

# ── Endpoints ───────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Smart Rental Track ML API is Live 🚀",
        "endpoints": {
            "health": "/health",
            "demand_forecast": "POST /api/v1/forecast",
            "anomaly_detection": "POST /api/v1/detect-anomaly",
            "anomalies_list": "GET /api/v1/anomalies",
            "demand_summary": "GET /api/v1/demand-summary"
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "models_loaded": demand_model is not None,
        "version": "1.0.0"
    })

@app.route("/api/v1/forecast", methods=["POST"])
def forecast():
    data = request.json
    try:
        dt = pd.Timestamp(data["date"])
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    site_enc = safe_encode(le_site, data["site_id"])
    type_enc = safe_encode(le_type, data["equipment_type"])

    features = pd.DataFrame([{
        "site_enc": site_enc,
        "type_enc": type_enc,
        "month": dt.month,
        "day_of_week": dt.dayofweek,
        "day_of_year": dt.dayofyear,
        "quarter": dt.quarter,
        "is_weekend": int(dt.dayofweek >= 5),
    }])

    pred = float(demand_model.predict(features)[0])

    return jsonify({
        "site_id": data["site_id"],
        "equipment_type": data["equipment_type"],
        "date": data["date"],
        "predicted_demand": round(max(0, pred), 2),
        "season": get_season(dt.month),
    })

@app.route("/api/v1/detect-anomaly", methods=["POST"])
def detect_anomaly():
    data = request.json
    total_hours = data["engine_hours_day"] + data["idle_hours_day"]
    idle_ratio = data["idle_hours_day"] / (total_hours + 1e-6)
    
    site_id = data.get("site_id")
    is_missing_site = int(site_id is None or site_id == "")
    
    operator_id = data.get("operator_id")
    is_missing_operator = int(operator_id is None or operator_id == "")
    
    hours_over_24 = int(total_hours > 24)
    type_enc = safe_encode(le_type_anomaly, data["equipment_type"])

    X = np.array([[
        data["engine_hours_day"], data["idle_hours_day"], data["rental_days"],
        total_hours, idle_ratio, is_missing_site,
        is_missing_operator, hours_over_24, type_enc,
    ]])

    score = float(anomaly_model.decision_function(X)[0])
    prediction = int(anomaly_model.predict(X)[0])
    is_anomaly = prediction == -1

    if score < -0.15:
        risk = "critical"
    elif score < -0.05:
        risk = "high"
    elif score < 0.0:
        risk = "medium"
    else:
        risk = "low"

    flags = []
    if idle_ratio > 0.8: flags.append("excessive_idle")
    if hours_over_24: flags.append("impossible_hours")
    if is_missing_site: flags.append("unassigned_site")
    if is_missing_operator: flags.append("no_operator")
    if data["rental_days"] > 60: flags.append("extended_rental")

    return jsonify({
        "is_anomaly": is_anomaly,
        "anomaly_score": round(score, 4),
        "risk_level": risk,
        "flags": flags,
    })

@app.route("/api/v1/anomalies", methods=["GET"])
def get_anomalies():
    if scored_df is None:
        return jsonify({"error": "Scored dataset not found."}), 404
    
    limit = int(request.args.get("limit", 50))
    anomalies = scored_df[scored_df["predicted_anomaly"] == 1].head(limit)
    return jsonify(anomalies.to_dict(orient="records"))

@app.route("/api/v1/demand-summary", methods=["GET"])
def demand_summary():
    df = pd.read_csv(f"{DATA_DIR}/rental_dataset.csv")
    df["Check_In_Date"] = pd.to_datetime(df["Check_In_Date"])
    df["month"] = df["Check_In_Date"].dt.month

    summary = (
        df.groupby(["Site_ID", "Type", "month"])
        .agg(
            total_rentals=("Equipment_ID", "count"),
            avg_rental_days=("Rental_Days", "mean"),
            avg_engine_hours=("Engine_Hours_Day", "mean"),
        )
        .reset_index()
    )
    summary["avg_rental_days"] = summary["avg_rental_days"].round(1)
    summary["avg_engine_hours"] = summary["avg_engine_hours"].round(1)
    return jsonify(summary.to_dict(orient="records"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
