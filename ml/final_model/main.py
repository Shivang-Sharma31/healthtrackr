import os
import pickle
import numpy as np
import rrcf
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

# ==========================================
# 1. CORE ENGINES (Your Custom Logic)
# ==========================================

class RRCFEngine:
    def __init__(self, num_trees=100, tree_size=256):
        self.num_trees = num_trees
        self.tree_size = tree_size

    def initialize_forest(self):
        forest = [rrcf.RCTree(random_state=i) for i in range(self.num_trees)]
        return pickle.dumps(forest)

    def predict_and_update(self, serialized_forest, feature_vector, current_index):
        if not serialized_forest:
            serialized_forest = self.initialize_forest()
            
        forest = pickle.loads(serialized_forest)
        point = np.array(feature_vector)
        anomaly_score = 0

        for tree in forest:
            if len(tree.leaves) >= self.tree_size:
                tree.forget_point(current_index - self.tree_size)
            
            # Insert new point and score
            tree.insert_point(point, index=current_index)
            anomaly_score += tree.codisp(current_index)

        avg_score = anomaly_score / self.num_trees
        
        return {
            "rrcf_score": float(avg_score),
            "updated_forest_bytes": pickle.dumps(forest)
        }


class StreamingZScoreEngine:
    def __init__(self, span=20, thresh_start=2.5, thresh_end=1.8, n_days=30):
        self.alpha = 2 / (span + 1)
        self.thresh_start = thresh_start
        self.thresh_end = thresh_end
        self.n_days = n_days

    def get_dynamic_threshold(self, day_count):
        capped_day = min(day_count, self.n_days)
        return self.thresh_start - ((self.thresh_start - self.thresh_end) * (capped_day - 1) / (self.n_days - 1))

    def predict_and_update(self, previous_state, current_features):
        if not previous_state:
            previous_state = {
                "day_count": 1,
                "means": {k: v for k, v in current_features.items()},
                "variances": {k: 0.1 for k, v in current_features.items()}
            }
            return {"max_z_score": 0.0, "is_anomaly": False, "updated_state": previous_state}

        new_state = {
            "day_count": previous_state["day_count"] + 1,
            "means": {},
            "variances": {}
        }
        
        max_z = 0.0
        
        for feature, new_val in current_features.items():
            prev_mean = previous_state["means"].get(feature, new_val)
            prev_var = previous_state["variances"].get(feature, 0.1)

            new_mean = (self.alpha * new_val) + ((1 - self.alpha) * prev_mean)
            new_var = (1 - self.alpha) * (prev_var + self.alpha * (new_val - prev_mean)**2)
            std_dev = np.sqrt(new_var) if new_var > 0 else 0.1
            
            z_score = abs(new_val - new_mean) / std_dev
            max_z = max(max_z, z_score)

            new_state["means"][feature] = new_mean
            new_state["variances"][feature] = new_var

        current_thresh = self.get_dynamic_threshold(new_state["day_count"])
        is_anomaly = max_z > current_thresh

        return {
            "max_z_score": float(max_z),
            "threshold_used": float(current_thresh),
            "is_anomaly": bool(is_anomaly),
            "updated_state": new_state
        }

# ==========================================
# 2. FASTAPI CONFIGURATION & DATA INSTANCE
# ==========================================

app = FastAPI(
    title="HealthTrackr Streaming API",
    description="Real-time multi-tenant health anomaly detection using RRCF and Streaming Z-Score.",
    version="1.1.0"
)

# Core engine workers
rrcf_worker = RRCFEngine()
zscore_worker = StreamingZScoreEngine()

# In-Memory Cache to store user states across sequential requests
# Key: user_id (str) -> Value: dict containing serialized trees, moving metrics, and timeframe steps
STATE_CACHE: Dict[str, Dict[str, Any]] = {}

# Pydantic Schemas for Payload Validation
class HealthMetricsInput(BaseModel):
    heart_rate: float = Field(..., description="Average heart rate for the day", example=72.0)
    systolic_bp: float = Field(..., description="Systolic blood pressure", example=120.0)
    blood_sugar: float = Field(..., description="Fasting or average blood sugar level", example=95.0)
    steps: float = Field(..., description="Total count of physical steps logged", example=8500.0)
    water_intake: float = Field(..., description="Total water intake in liters or ml", example=2.5)

class ZScoreOutput(BaseModel):
    max_z: float
    dynamic_threshold: float
    is_anomaly: bool

class AnalysisResponse(BaseModel):
    user_id: str
    stream_index: int
    rrcf_anomaly_score: float
    zscore_metrics: ZScoreOutput
    trigger_alert: bool

# ==========================================
# 3. CONTROLLERS / ENDPOINTS
# ==========================================

@app.post(
    "/analyze/{user_id}", 
    response_model=AnalysisResponse, 
    status_code=status.HTTP_200_OK,
    summary="Process streaming metrics for a specific user profile"
)
async def analyze_metrics(user_id: str, payload: HealthMetricsInput):
    """
    Ingests daily metrics, evaluates them against the user's specific mathematical state history,
    updates their model configurations, and flags structural anomalies in streaming behaviors.
    """
    # 1. Fetch historical state tracking from cache
    user_profile = STATE_CACHE.get(user_id, {"rrcf": None, "zscore": None, "index": 0})
    next_index = user_profile["index"] + 1

    # 2. Structure payloads for dedicated algorithms using the 5 new metrics
    rrcf_vector = [
        payload.heart_rate, 
        payload.systolic_bp, 
        payload.blood_sugar, 
        payload.steps, 
        payload.water_intake
    ]
    
    zscore_map = {
        "heart_rate": payload.heart_rate,
        "systolic_bp": payload.systolic_bp,
        "blood_sugar": payload.blood_sugar,
        "steps": payload.steps,
        "water_intake": payload.water_intake
    }

    try:
        # 3. Execute isolated model evaluations and update state variables
        rrcf_output = rrcf_worker.predict_and_update(
            serialized_forest=user_profile["rrcf"],
            feature_vector=rrcf_vector,
            current_index=next_index
        )

        zscore_output = zscore_worker.predict_and_update(
            previous_state=user_profile["zscore"],
            current_features=zscore_map
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mathematical engine execution failed: {str(err)}"
        )

    # 4. Save modifications seamlessly back to the state cache
    STATE_CACHE[user_id] = {
        "rrcf": rrcf_output["updated_forest_bytes"],
        "zscore": zscore_output["updated_state"],
        "index": next_index
    }

    # 5. Evaluate dynamic thresholds to flag an immediate alert condition
    # Note: With 5 dimensions instead of 3, the baseline RRCF scores may shift slightly. 
    # You may need to tune this 45.0 threshold after observing real-world data.
    is_rrcf_anomalous = rrcf_output["rrcf_score"] > 45.0 
    is_zscore_anomalous = zscore_output["is_anomaly"]

    return {
        "user_id": user_id,
        "stream_index": next_index,
        "rrcf_anomaly_score": round(rrcf_output["rrcf_score"], 3),
        "zscore_metrics": {
            "max_z": round(zscore_output["max_z_score"], 3),
            "dynamic_threshold": round(zscore_output["threshold_used"], 3) if "threshold_used" in zscore_output else 0.0,
            "is_anomaly": is_zscore_anomalous
        },
        "trigger_alert": bool(is_rrcf_anomalous or is_zscore_anomalous)
    }

@app.delete("/reset/{user_id}", status_code=status.HTTP_200_OK)
async def reset_user_state(user_id: str):
    """Clears a user's tracking state to restart streaming calculations fresh."""
    if user_id in STATE_CACHE:
        del STATE_CACHE[user_id]
        return {"message": f"Successfully dropped streaming state cache for user: {user_id}"}
    raise HTTPException(status_code=404, detail="User target not found in active state cache.")