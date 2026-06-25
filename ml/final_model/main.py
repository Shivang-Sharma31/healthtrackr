import os
import pickle
import numpy as np
import rrcf
import base64
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

# ==========================================
# 1. CORE ENGINES (Unchanged)
# ==========================================

class RRCFEngine:
    def __init__(self, num_trees=100, tree_size=256):
        self.num_trees = num_trees
        self.tree_size = tree_size

    def initialize_forest(self):
        forest = [rrcf.RCTree(random_state=i) for i in range(self.num_trees)]
        return pickle.dumps(forest)

    def predict_and_update(self, serialized_forest, feature_vector, current_index):
        # If no state is passed (Day 1), load the global pretrained model
        if not serialized_forest:
            try:
                with open("global_pretrained_rrcf.pkl", "rb") as f:
                    serialized_forest = f.read()
            except FileNotFoundError:
                # Safety fallback
                serialized_forest = self.initialize_forest()
            
        forest = pickle.loads(serialized_forest)
        point = np.array(feature_vector)
        anomaly_score = 0

        for tree in forest:
            # 1. Figure out the next unique ID for this specific tree
            if len(tree.leaves) > 0:
                new_index = max(tree.leaves.keys()) + 1
            else:
                new_index = 0

            # 2. If the tree is full, find the absolute oldest ID and drop it
            if len(tree.leaves) >= self.tree_size:
                oldest_index = min(tree.leaves.keys())
                tree.forget_point(oldest_index)
            
            # 3. Insert the new point and calculate the score
            tree.insert_point(point, index=new_index)
            anomaly_score += tree.codisp(new_index)

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
    title="HealthTrackr Stateless API",
    description="Stateless real-time health anomaly detection.",
    version="2.0.0"
)

# Core engine workers
rrcf_worker = RRCFEngine()
zscore_worker = StreamingZScoreEngine()

# STATE_CACHE IS REMOVED

# ==========================================
# 3. PYDANTIC SCHEMAS (UPDATED)
# ==========================================

class HealthMetricsInput(BaseModel):
    # Health Data
    heart_rate: float
    systolic_bp: float
    blood_sugar: float
    steps: float
    water_intake: float
    
    # State Data (Passed in from JS Backend)
    stream_index: int = Field(0, description="The current day count for this user")
    rrcf_state_b64: Optional[str] = Field(None, description="Base64 encoded PKL string of the model. Null if day 1.")
    zscore_state: Optional[Dict[str, Any]] = Field(None, description="JSON dictionary of moving averages. Null if day 1.")

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
    
    # State Data (Returned to JS Backend for saving)
    updated_rrcf_state_b64: str
    updated_zscore_state: Dict[str, Any]

# ==========================================
# 4. CONTROLLERS / ENDPOINTS (UPDATED)
# ==========================================

@app.post("/analyze/{user_id}", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_metrics(user_id: str, payload: HealthMetricsInput):
    
    # 1. Decode the RRCF state from Base64 string back into raw Python bytes
    # If it's day 1 (None), keep it as None so the engine initializes it.
    rrcf_bytes = None
    if payload.rrcf_state_b64:
        try:
            rrcf_bytes = base64.b64decode(payload.rrcf_state_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Base64 string for rrcf_state_b64")

    # 2. Advance the time index
    next_index = payload.stream_index + 1

    # 3. Structure payloads for dedicated algorithms
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
        # 4. Execute isolated model evaluations and update state variables
        rrcf_output = rrcf_worker.predict_and_update(
            serialized_forest=rrcf_bytes,
            feature_vector=rrcf_vector,
            current_index=next_index
        )

        zscore_output = zscore_worker.predict_and_update(
            previous_state=payload.zscore_state,
            current_features=zscore_map
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mathematical engine execution failed: {str(err)}"
        )

    # 5. Convert the newly updated raw bytes BACK to a Base64 string for the JSON response
    new_rrcf_b64 = base64.b64encode(rrcf_output["updated_forest_bytes"]).decode('utf-8')

    is_rrcf_anomalous = rrcf_output["rrcf_score"] > 45.0 
    is_zscore_anomalous = zscore_output["is_anomaly"]

    # 6. Return everything (including the updated states) back to your friend
    return {
        "user_id": user_id,
        "stream_index": next_index,
        "rrcf_anomaly_score": round(rrcf_output["rrcf_score"], 3),
        "zscore_metrics": {
            "max_z": round(zscore_output["max_z_score"], 3),
            "dynamic_threshold": round(zscore_output["threshold_used"], 3) if "threshold_used" in zscore_output else 0.0,
            "is_anomaly": is_zscore_anomalous
        },
        "trigger_alert": bool(is_rrcf_anomalous or is_zscore_anomalous),
        
        "updated_rrcf_state_b64": new_rrcf_b64,
        "updated_zscore_state": zscore_output["updated_state"]
    }
