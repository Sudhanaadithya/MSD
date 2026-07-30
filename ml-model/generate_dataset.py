"""
Synthetic Data Generator — Smart Rental Tracking System
========================================================
Generates ~500 equipment-rental events with realistic seasonal demand
patterns and ~5.5% injected anomalies matching the problem statement.

Schema:
  Equipment_ID | Type | Site_ID | Check_In_Date | Check_Out_Date |
  Engine_Hours_Day | Idle_Hours_Day | Rental_Days | Last_Operator_ID

Run:  python generate_dataset.py
Output: data/rental_dataset.csv
"""

import os
import numpy as np
import pandas as pd
from datetime import timedelta

RNG = np.random.default_rng(42)

# ── Reference Data ──────────────────────────────────────────────────
EQUIPMENT_TYPES = ["Excavator", "Bulldozer", "Crane", "Grader", "Compactor", "Loader"]

SITES = {
    "S001": "construction", "S002": "construction", "S003": "mining",
    "S004": "construction", "S005": "mining", "S006": "roadwork",
    "S007": "roadwork", "S008": "mining", "S009": "construction",
    "S010": "roadwork", "S011": "mining", "S012": "construction",
}

SITE_TYPE_PREFERENCE = {
    "construction": {"Excavator": 0.30, "Loader": 0.20, "Crane": 0.20,
                     "Compactor": 0.15, "Bulldozer": 0.10, "Grader": 0.05},
    "mining":       {"Excavator": 0.35, "Bulldozer": 0.30, "Loader": 0.20,
                     "Crane": 0.05, "Compactor": 0.05, "Grader": 0.05},
    "roadwork":     {"Grader": 0.35, "Compactor": 0.30, "Bulldozer": 0.15,
                     "Excavator": 0.10, "Loader": 0.05, "Crane": 0.05},
}

OPERATORS = [f"OP{n}" for n in range(101, 140)]

N_EQUIPMENT_UNITS = 220
START_DATE = pd.Timestamp("2024-01-01")
END_DATE = pd.Timestamp("2025-12-31")

# ── Fleet ───────────────────────────────────────────────────────────
type_probs = [0.22, 0.18, 0.15, 0.15, 0.15, 0.15]
fleet = []
for i in range(N_EQUIPMENT_UNITS):
    eq_type = RNG.choice(EQUIPMENT_TYPES, p=type_probs)
    fleet.append({"Equipment_ID": f"EQX{1001+i}", "Type": eq_type})
fleet_df = pd.DataFrame(fleet)

# ── Seasonal demand ─────────────────────────────────────────────────
def seasonal_multiplier(month):
    monsoon = {6: 0.5, 7: 0.4, 8: 0.45, 9: 0.6}
    peak = {3: 1.3, 4: 1.4, 10: 1.3, 11: 1.35}
    return monsoon.get(month, peak.get(month, 1.0))

# ── Generate rental events ──────────────────────────────────────────
records = []
site_ids = list(SITES.keys())

for _, row in fleet_df.iterrows():
    eq_id, eq_type = row["Equipment_ID"], row["Type"]
    current_date = START_DATE + timedelta(days=int(RNG.integers(0, 30)))

    while current_date < END_DATE:
        month = current_date.month
        season_mult = seasonal_multiplier(month)

        if RNG.random() > season_mult * 0.9:
            current_date += timedelta(days=int(RNG.integers(3, 15)))
            continue

        site_weights = np.array([
            SITE_TYPE_PREFERENCE[SITES[s]].get(eq_type, 0.05) for s in site_ids
        ])
        site_weights /= site_weights.sum()
        site_id = RNG.choice(site_ids, p=site_weights)

        base_days = {"Crane": 7, "Excavator": 14, "Bulldozer": 20,
                     "Grader": 10, "Compactor": 8, "Loader": 12}[eq_type]
        rental_days = max(1, int(RNG.normal(base_days, base_days * 0.35)))

        check_in = current_date
        check_out = check_in + timedelta(days=rental_days)
        if check_out > END_DATE:
            break

        engine_hours = np.clip(RNG.normal(6.5, 2.2), 0, 16)
        idle_hours = np.clip(RNG.normal(3.5, 2.5), 0, 20)
        operator_id = RNG.choice(OPERATORS)

        records.append({
            "Equipment_ID": eq_id, "Type": eq_type, "Site_ID": site_id,
            "Check_In_Date": check_in.date().isoformat(),
            "Check_Out_Date": check_out.date().isoformat(),
            "Engine_Hours_Day": round(float(engine_hours), 1),
            "Idle_Hours_Day": round(float(idle_hours), 1),
            "Rental_Days": rental_days,
            "Last_Operator_ID": operator_id,
            "is_anomaly": 0, "anomaly_type": "none",
        })

        gap = int(RNG.integers(1, 10))
        current_date = check_out + timedelta(days=gap)

df = pd.DataFrame(records)
print(f"Base events generated: {len(df)}")

# ── Inject anomalies (~5.5%) ────────────────────────────────────────
n_anomalies = int(len(df) * 0.055)
anomaly_idx = RNG.choice(df.index, size=n_anomalies, replace=False)
anomaly_types = RNG.choice(
    ["excessive_idle", "unassigned_site", "no_operator",
     "impossible_hours", "extended_rental"],
    size=n_anomalies, p=[0.30, 0.20, 0.20, 0.15, 0.15]
)

for idx, a_type in zip(anomaly_idx, anomaly_types):
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "anomaly_type"] = a_type

    if a_type == "excessive_idle":
        df.loc[idx, "Idle_Hours_Day"] = round(float(RNG.uniform(18, 23)), 1)
        df.loc[idx, "Engine_Hours_Day"] = round(float(RNG.uniform(0, 1.5)), 1)
    elif a_type == "unassigned_site":
        df.loc[idx, "Site_ID"] = None
    elif a_type == "no_operator":
        df.loc[idx, "Last_Operator_ID"] = None
    elif a_type == "impossible_hours":
        df.loc[idx, "Engine_Hours_Day"] = round(float(RNG.uniform(14, 20)), 1)
        df.loc[idx, "Idle_Hours_Day"] = round(float(RNG.uniform(10, 18)), 1)
    elif a_type == "extended_rental":
        extra = int(RNG.uniform(45, 90))
        df.loc[idx, "Rental_Days"] += extra
        ci = pd.Timestamp(df.loc[idx, "Check_In_Date"])
        df.loc[idx, "Check_Out_Date"] = (
            ci + timedelta(days=int(df.loc[idx, "Rental_Days"]))
        ).date().isoformat()

df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

# ── Downsample to ~500 rows (stratified) ────────────────────────────
TARGET = 2000
if len(df) > TARGET:
    # Use straightforward sampling to avoid Pandas apply edge cases
    anomalies = df[df['is_anomaly'] == 1]
    normals = df[df['is_anomaly'] == 0]
    
    n_anom = int(TARGET * (len(anomalies) / len(df)))
    n_norm = TARGET - n_anom
    
    anomalies_sampled = anomalies.sample(n=min(n_anom, len(anomalies)), random_state=42)
    normals_sampled = normals.sample(n=min(n_norm, len(normals)), random_state=42)
    
    df = pd.concat([anomalies_sampled, normals_sampled])
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

os.makedirs("data", exist_ok=True)
out_path = "data/rental_dataset.csv"
df.to_csv(out_path, index=False)
print(f"Final shape: {df.shape}")
print(f"Anomaly rate: {df['is_anomaly'].mean():.3%}")
print(df["anomaly_type"].value_counts())
print(f"\nSaved to {out_path}")
