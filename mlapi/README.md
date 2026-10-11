# QueueLess ML – Waiting Time Prediction

A small, standalone Python project that predicts queue waiting time
(`actual_wait_time`) from three features: `people_ahead`,
`average_service_time`, and `active_counters`. It compares the ML models
against QueueLess's mathematical baseline and serves the better ML model
through a FastAPI `/predict` endpoint.

> **The dataset is synthetic.** It is demonstration data, not real
> government-office data.

## Project structure

```
mlapi/
├── data/queue_data.csv            # synthetic dataset (generated)
├── model/wait_time_model.pkl      # selected trained model (generated)
├── generate_data.py               # creates the synthetic dataset
├── train.py                       # trains, evaluates, saves the model
├── main.py                        # FastAPI app
├── requirements.txt
└── README.md
```

## Installation

```
pip install -r requirements.txt
```

## Run

```
python generate_data.py      # 1. generate synthetic data
python train.py              # 2. train, compare, save model
uvicorn main:app --reload    # 3. start the API
```

Open http://127.0.0.1:8000/docs to try the API. Health check: `GET /health`.

The backend reads this service's URL from `ML_API_URL` (default
`http://127.0.0.1:8000`). If this service is down the backend automatically
falls back to the mathematical estimate, so it is optional at runtime.

### Configuration

This service reads **no environment variables**. Host and port are set on the
`uvicorn` command line (`--host 0.0.0.0 --port 8000` when deployed; do not use
`--reload` in production). `data/*.csv` and `model/*.pkl` are git-ignored, so
run `python generate_data.py` and `python train.py` on the deployment machine
(or as a build step). The `.pkl` must be created with the same scikit-learn
version that serves it; `main.py` exits with a clear message if it cannot load it.

## Test /predict

```
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"people_ahead": 12, "average_service_time": 5, "active_counters": 3}'
```

Example response (your numbers will differ):

```
{
  "predicted_wait_time": 23.4,
  "baseline_wait_time": 20.0,
  "model_used": "random_forest"
}
```

Invalid input (e.g. `active_counters: 0`) returns HTTP 422.

## Important limitation

The models are trained on synthetic data that we generated ourselves.
Their metrics only show how well each method fits that synthetic data.
They do **not** represent real-world QueueLess accuracy.

## Retraining with real QueueLess data later

Each Token stores `startedAt` and `completedAt`, so real service durations
can be calculated. Later, export real token history as a CSV with the same
four columns (`people_ahead`, `average_service_time`, `active_counters`,
`actual_wait_time`), replace `data/queue_data.csv`, and run `python train.py`
again. No code changes are needed.
