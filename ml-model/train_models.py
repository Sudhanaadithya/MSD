"""
Train & Save Models — Smart Rental Tracking System
====================================================
1. Demand Forecasting  → LightGBM (daily demand per site×type)
2. Anomaly Detection   → Isolation Forest (unsupervised)

Saves trained models as .joblib files into models/ directory.

Anti-memorization controls:
  - LightGBM: max_depth=4, subsample=0.7, colsample=0.7, L1/L2 reg, early stopping
  - IsolationForest: max_samples=0.8, max_features=0.8, 200 estimators
"""

import os
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, classification_report
from sklearn.ensemble import IsolationForest
import lightgbm as lgb

warnings.filterwarnings("ignore")

DATA_PATH = "data/rental_dataset.csv"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)


def load_and_prepare():
    df = pd.read_csv(DATA_PATH)
    df["Check_In_Date"] = pd.to_datetime(df["Check_In_Date"])
    df["Check_Out_Date"] = pd.to_datetime(df["Check_Out_Date"])

    # Fill nulls for modeling
    df["Site_ID"] = df["Site_ID"].fillna("UNKNOWN")
    df["Last_Operator_ID"] = df["Last_Operator_ID"].fillna("UNKNOWN")
    return df


# =====================================================================
# 1. DEMAND FORECASTING — LightGBM
# =====================================================================
def train_demand_model(df):
    print("\n" + "=" * 60)
    print("DEMAND FORECASTING — LightGBM")
    print("=" * 60)

    # Build daily demand: count of active rentals per (site, type, date)
    rows = []
    for _, r in df.iterrows():
        for d in pd.date_range(r["Check_In_Date"], r["Check_Out_Date"]):
            rows.append({"date": d, "Site_ID": r["Site_ID"], "Type": r["Type"]})
    daily = pd.DataFrame(rows)
    demand = daily.groupby(["date", "Site_ID", "Type"]).size().reset_index(name="demand")

    # Time features
    demand["month"] = demand["date"].dt.month
    demand["day_of_week"] = demand["date"].dt.dayofweek
    demand["day_of_year"] = demand["date"].dt.dayofyear
    demand["quarter"] = demand["date"].dt.quarter
    demand["is_weekend"] = (demand["day_of_week"] >= 5).astype(int)

    # Encode categoricals
    le_site = LabelEncoder()
    le_type = LabelEncoder()
    demand["site_enc"] = le_site.fit_transform(demand["Site_ID"])
    demand["type_enc"] = le_type.fit_transform(demand["Type"])

    features = ["site_enc", "type_enc", "month", "day_of_week",
                "day_of_year", "quarter", "is_weekend"]
    X = demand[features]
    y = demand["demand"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # LightGBM with bias/variance controls
    params = {
        "objective": "regression",
        "metric": "mae",
        "learning_rate": 0.05,
        "max_depth": 4,           # shallow trees → lower variance
        "num_leaves": 15,         # constrained complexity
        "subsample": 0.7,         # row subsampling → anti-memorization
        "colsample_bytree": 0.7,  # feature subsampling
        "reg_alpha": 0.1,         # L1 regularization
        "reg_lambda": 0.5,        # L2 regularization
        "min_child_samples": 10,  # min data per leaf
        "n_estimators": 300,
        "verbose": -1,
        "random_state": 42,
    }

    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(30, verbose=False)],
    )

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"  MAE : {mae:.4f}")
    print(f"  R²  : {r2:.4f}")

    # Save model + encoders
    joblib.dump(model, f"{MODEL_DIR}/demand_model.joblib")
    joblib.dump(le_site, f"{MODEL_DIR}/le_site.joblib")
    joblib.dump(le_type, f"{MODEL_DIR}/le_type.joblib")
    joblib.dump(features, f"{MODEL_DIR}/demand_features.joblib")
    print(f"  Saved to {MODEL_DIR}/demand_model.joblib")
    return model


# =====================================================================
# 2. ANOMALY DETECTION — Isolation Forest
# =====================================================================
def train_anomaly_model(df):
    print("\n" + "=" * 60)
    print("ANOMALY DETECTION — Isolation Forest")
    print("=" * 60)

    # Engineered features for anomaly detection
    df_feat = df.copy()
    df_feat["total_hours"] = df_feat["Engine_Hours_Day"] + df_feat["Idle_Hours_Day"]
    df_feat["idle_ratio"] = df_feat["Idle_Hours_Day"] / (df_feat["total_hours"] + 1e-6)
    df_feat["is_missing_site"] = (df_feat["Site_ID"] == "UNKNOWN").astype(int)
    df_feat["is_missing_operator"] = (df_feat["Last_Operator_ID"] == "UNKNOWN").astype(int)
    df_feat["hours_over_24"] = (df_feat["total_hours"] > 24).astype(int)

    le_type_anom = LabelEncoder()
    df_feat["type_enc"] = le_type_anom.fit_transform(df_feat["Type"])

    anomaly_features = [
        "Engine_Hours_Day", "Idle_Hours_Day", "Rental_Days",
        "total_hours", "idle_ratio", "is_missing_site",
        "is_missing_operator", "hours_over_24", "type_enc",
    ]
    X_anom = df_feat[anomaly_features].values

    # Isolation Forest with anti-memorization controls
    iso = IsolationForest(
        n_estimators=200,
        max_samples=0.8,       # don't train on 100% → reduces memorization
        max_features=0.8,      # feature subsampling
        contamination=0.06,    # expected anomaly fraction
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(X_anom)

    # Evaluate against ground-truth labels (dev-only)
    scores = iso.decision_function(X_anom)
    preds = iso.predict(X_anom)  # 1=normal, -1=anomaly
    pred_labels = (preds == -1).astype(int)

    if "is_anomaly" in df_feat.columns:
        print(classification_report(
            df_feat["is_anomaly"], pred_labels,
            target_names=["Normal", "Anomaly"],
        ))

    # Save model + metadata
    joblib.dump(iso, f"{MODEL_DIR}/anomaly_model.joblib")
    joblib.dump(le_type_anom, f"{MODEL_DIR}/le_type_anomaly.joblib")
    joblib.dump(anomaly_features, f"{MODEL_DIR}/anomaly_features.joblib")
    print(f"  Saved to {MODEL_DIR}/anomaly_model.joblib")

    # Save scored output
    df_feat["anomaly_score"] = scores
    df_feat["predicted_anomaly"] = pred_labels
    df_feat.to_csv("data/anomaly_scored_output.csv", index=False)
    print("  Scored output → data/anomaly_scored_output.csv")
    return iso


if __name__ == "__main__":
    df = load_and_prepare()
    train_demand_model(df)
    train_anomaly_model(df)
    print("\n✅ All models trained and saved to models/")
