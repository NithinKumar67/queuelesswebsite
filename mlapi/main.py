"""
main.py
Simple FastAPI app that loads the already-trained model and serves /predict.

The model was trained on SYNTHETIC demonstration data.
"""

from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model" / "wait_time_model.pkl"

# Load the saved model once, when the API starts (no retraining here)
if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model file not found: {MODEL_PATH}\n"
        "Run these first:  python generate_data.py  then  python train.py"
    )

try:
    saved = joblib.load(MODEL_PATH)
    model = saved["model"]
    model_name = saved["model_name"]
    features = saved["features"]
except Exception as exc:  # corrupt file, missing keys, scikit-learn version mismatch
    raise RuntimeError(
        f"Could not load {MODEL_PATH}: {exc}\n"
        "Re-create it in THIS environment with:  python train.py"
    ) from exc

app = FastAPI(title="QueueLess Waiting Time Prediction API")


class PredictRequest(BaseModel):
    # Validation rules -> FastAPI returns HTTP 422 if they are broken
    people_ahead: int = Field(..., ge=0, description="People ahead in the queue (>= 0)")
    average_service_time: float = Field(..., gt=0, description="Average minutes per person (> 0)")
    active_counters: int = Field(..., ge=1, description="Active counters (>= 1)")


@app.get("/")
def root():
    return {"message": "QueueLess Waiting Time Prediction API"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    # Mathematical baseline
    baseline = req.people_ahead * req.average_service_time / req.active_counters

    # ML prediction (DataFrame keeps the same column names used in training)
    row = pd.DataFrame(
        [[req.people_ahead, req.average_service_time, req.active_counters]],
        columns=features,
    )
    predicted = max(0.0, float(model.predict(row)[0]))  # never negative

    return {
        "predicted_wait_time": round(predicted, 1),
        "baseline_wait_time": round(baseline, 1),
        "model_used": model_name,
    }
