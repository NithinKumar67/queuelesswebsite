"""
generate_data.py
Creates a SYNTHETIC queue dataset and saves it to data/queue_data.csv

Synthetic demonstration data - not real government-office data.
"""

from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "queue_data.csv"

N_ROWS = 2000
SEED = 42  # fixed seed -> same dataset every time


def generate():
    rng = np.random.default_rng(SEED)

    # ---- Inputs (the 3 features) ----
    people_ahead = rng.integers(0, 41, size=N_ROWS)                      # 0 to 40 people
    average_service_time = np.round(rng.uniform(3, 12, size=N_ROWS), 1)  # 3 to 12 min
    active_counters = rng.integers(1, 7, size=N_ROWS)                    # 1 to 6 counters

    # ---- Realistic deviations (kept simple) ----
    # 1) Real service takes a bit longer than the quoted average, and varies.
    actual_service_time = average_service_time * rng.normal(1.10, 0.12, size=N_ROWS)

    # 2) Extra counters are not perfectly efficient (shared queue, handovers, breaks).
    #    The first counter counts fully, each extra one counts as 85%.
    effective_counters = 1 + (active_counters - 1) * 0.85

    # 3) Small fixed overhead (calling next person, paperwork) + random noise.
    overhead = 2 + rng.normal(0, 1.5, size=N_ROWS)

    # ---- Final target ----
    actual_wait_time = people_ahead * actual_service_time / effective_counters + overhead

    # Nobody ahead of you -> no waiting
    actual_wait_time = np.where(people_ahead == 0, 0, actual_wait_time)
    # Waiting time can never be negative
    actual_wait_time = np.clip(actual_wait_time, 0, None)

    df = pd.DataFrame({
        "people_ahead": people_ahead,
        "average_service_time": average_service_time,
        "active_counters": active_counters,
        "actual_wait_time": np.round(actual_wait_time, 2),
    })
    return df


if __name__ == "__main__":
    df = generate()

    DATA_PATH.parent.mkdir(exist_ok=True)
    df.to_csv(DATA_PATH, index=False)

    print("Synthetic demonstration data - not real government-office data.\n")
    print(f"Saved {len(df)} rows to {DATA_PATH}\n")
    print("Preview (first 5 rows):")
    print(df.head().to_string(index=False))
    print("\nBasic statistics:")
    print(df.describe().round(2).to_string())
