"""
train.py
Trains Linear Regression and Random Forest on the SYNTHETIC queue data,
compares them with the mathematical baseline, and saves the better ML model.

Synthetic demonstration data - not real government-office data.
Results here do NOT represent real-world QueueLess accuracy.
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "queue_data.csv"
MODEL_PATH = BASE_DIR / "model" / "wait_time_model.pkl"

# The ONLY features the ML models may use (baseline_wait is NOT included)
FEATURES = ["people_ahead", "average_service_time", "active_counters"]
TARGET = "actual_wait_time"


def calculate_baseline(people_ahead, average_service_time, active_counters):
    """Mathematical baseline: (people x service time) / counters"""
    return people_ahead * average_service_time / active_counters


def get_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return {"mae": mae, "rmse": rmse, "r2": r2}


def main():
    # ---------- 1. Load and validate data ----------
    if not DATA_PATH.exists():
        raise SystemExit(f"Data file not found: {DATA_PATH}\nRun: python generate_data.py")

    df = pd.read_csv(DATA_PATH)

    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise SystemExit(f"CSV is missing columns: {missing}")
    if df[FEATURES + [TARGET]].isnull().any().any():
        raise SystemExit("CSV contains missing values.")
    if (df["people_ahead"] < 0).any() or (df["average_service_time"] <= 0).any() \
            or (df["active_counters"] < 1).any() or (df[TARGET] < 0).any():
        raise SystemExit("CSV contains invalid values.")

    print("Synthetic demonstration data - not real government-office data.")
    print(f"Loaded {len(df)} rows from {DATA_PATH}\n")

    # ---------- 2. Train/test split ----------
    X = df[FEATURES]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Train rows: {len(X_train)} | Test rows: {len(X_test)}\n")

    # ---------- 3. Mathematical baseline on the test set ----------
    baseline_pred = calculate_baseline(
        X_test["people_ahead"], X_test["average_service_time"], X_test["active_counters"]
    )
    baseline_metrics = get_metrics(y_test, baseline_pred)

    # ---------- 4. Train the two ML models ----------
    linear = LinearRegression()
    linear.fit(X_train, y_train)

    forest = RandomForestRegressor(n_estimators=200, min_samples_leaf=2, random_state=42)
    forest.fit(X_train, y_train)

    # ---------- 5. Evaluate on the SAME test set ----------
    linear_metrics = get_metrics(y_test, np.clip(linear.predict(X_test), 0, None))
    forest_metrics = get_metrics(y_test, np.clip(forest.predict(X_test), 0, None))

    # ---------- 6. Comparison table ----------
    print("Test-set results (synthetic data)")
    print(f"{'Model':<24}{'MAE':>8}{'RMSE':>10}{'R2':>9}")
    print("-" * 51)
    for name, m in [
        ("Mathematical Baseline", baseline_metrics),
        ("Linear Regression", linear_metrics),
        ("Random Forest", forest_metrics),
    ]:
        print(f"{name:<24}{m['mae']:>8.2f}{m['rmse']:>10.2f}{m['r2']:>9.3f}")
    print("(MAE and RMSE are in minutes; lower is better. R2: higher is better.)\n")

    # ---------- 7. Select the better ML model (by test MAE) ----------
    if linear_metrics["mae"] <= forest_metrics["mae"]:
        chosen_name, chosen_model, chosen_metrics = "linear_regression", linear, linear_metrics
    else:
        chosen_name, chosen_model, chosen_metrics = "random_forest", forest, forest_metrics

    print(f">>> Selected ML model: {chosen_name} "
          f"(MAE {chosen_metrics['mae']:.2f} vs baseline MAE {baseline_metrics['mae']:.2f})")
    if chosen_metrics["mae"] < baseline_metrics["mae"]:
        print("    On this synthetic test set, the ML model has lower MAE than the baseline.")
    else:
        print("    On this synthetic test set, the ML model did NOT beat the baseline MAE.")
    print()

    # ---------- 8. Sanity checks ----------
    print("Sanity checks (predictions clipped at 0)")
    print(f"{'people':>7}{'svc_min':>9}{'counters':>10}{'baseline':>10}{'ML pred':>10}")
    cases = [
        (5, 5, 1),    # baseline 25
        (20, 7, 3),   # baseline 46.67
        (12, 5, 3),   # baseline 20
        (0, 5, 2),    # nobody ahead -> should be ~0, never negative
    ]
    for people, svc, counters in cases:
        row = pd.DataFrame([[people, svc, counters]], columns=FEATURES)
        pred = max(0.0, float(chosen_model.predict(row)[0]))
        base = calculate_baseline(people, svc, counters)
        print(f"{people:>7}{svc:>9}{counters:>10}{base:>10.2f}{pred:>10.2f}")
    print()

    # ---------- 9. Save model + metadata ----------
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(
        {
            "model": chosen_model,
            "model_name": chosen_name,
            "features": FEATURES,
            "test_metrics": chosen_metrics,
            "note": "Trained on synthetic demonstration data.",
        },
        MODEL_PATH,
    )
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
