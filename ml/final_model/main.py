import os
import pickle
import numpy as np
import rrcf
import base64
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

# ==========================================
# 1. CORE ENGINES
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
            try:
                with open("global_pretrained_rrcf.pkl", "rb") as f:
                    serialized_forest = f.read()
            except FileNotFoundError:
                serialized_forest = self.initialize_forest()
            
        forest = pickle.loads(serialized_forest)
        point = np.array(feature_vector)
        anomaly_score = 0

        for tree in forest:
            if len(tree.leaves) > 0:
                new_index = max(tree.leaves.keys()) + 1
            else:
                new_index = 0

            if len(tree.leaves) >= self.tree_size:
                oldest_index = min(tree.leaves.keys())
                tree.forget_point(oldest_index)
            
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
            # FIX #1: Scaled initial variance instead of hardcoded 0.1
            # We assume a normal variation is roughly 10% of the initial value.
            previous_state = {
                "day_count": 1,
                "means": {k: v for k, v in current_features.items()},
                "variances": {k: (v * 0.10)**2 if v > 0 else 1.0 for k, v in current_features.items()}
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
            # Fallback to scaled variance if missing
            fallback_var = (new_val * 0.10)**2 if new_val > 0 else 1.0
            prev_var = previous_state["variances"].get(feature, fallback_var)

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
# 2. FASTAPI CONFIGURATION & APP
# ==========================================

app = FastAPI(title="HealthTrackr Stateless API", version="2.1.0")
rrcf_worker = RRCFEngine()
zscore_worker = StreamingZScoreEngine()

class HealthMetricsInput(BaseModel):
    heart_rate: float
    systolic_bp: float
    blood_sugar: float
    steps: float
    water_intake: float
    stream_index: int = Field(0)
    rrcf_state_b64: Optional[str] = Field(None)
    zscore_state: Optional[Dict[str, Any]] = Field(None)

class ZScoreOutput(BaseModel):
    max_z: float
    dynamic_threshold: float
    is_anomaly: bool

class AnalysisResponse(BaseModel):
    user_id: str
    stream_index: int
    rrcf_anomaly_score: float
    zscore_metrics: ZScoreOutput
    
    # New combined metrics
    combined_risk_score: float 
    trigger_alert: bool
    
    updated_rrcf_state_b64: str
    updated_zscore_state: Dict[str, Any]

# ==========================================
# 3. ENDPOINT
# ==========================================

@app.post("/analyze/{user_id}", response_model=AnalysisResponse)
async def analyze_metrics(user_id: str, payload: HealthMetricsInput):
    
    rrcf_bytes = None
    if payload.rrcf_state_b64:
        try:
            rrcf_bytes = base64.b64decode(payload.rrcf_state_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Base64")

    next_index = payload.stream_index + 1

    rrcf_vector = [
        payload.heart_rate, payload.systolic_bp, payload.blood_sugar, 
        payload.steps, payload.water_intake
    ]
    zscore_map = {
        "heart_rate": payload.heart_rate, "systolic_bp": payload.systolic_bp, 
        "blood_sugar": payload.blood_sugar, "steps": payload.steps, "water_intake": payload.water_intake
    }

    try:
        rrcf_output = rrcf_worker.predict_and_update(rrcf_bytes, rrcf_vector, next_index)
        zscore_output = zscore_worker.predict_and_update(payload.zscore_state, zscore_map)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    # ==========================================
    # FIX #2: WEIGHTED RISK SCORING
    # ==========================================
    
    # 1. Define bounds (based on our knowledge of the algorithms)
    MAX_EXPECTED_RRCF = 100.0  # Caps out extreme forest isolation
    MAX_EXPECTED_Z = 4.0       # Caps out extreme standard deviations
    
    # 2. Normalize to a 0.0 - 1.0 scale (Risk Percentage)
    norm_rrcf = min(rrcf_output["rrcf_score"] / MAX_EXPECTED_RRCF, 1.0)
    norm_z = min(zscore_output["max_z_score"] / MAX_EXPECTED_Z, 1.0)
    
    # 3. Apply Weights 
    # Example: Z-score (univariate shifts) is 60% important, 
    # RRCF (multivariate patterns) is 40% important.
    WEIGHT_Z = 0.60
    WEIGHT_RRCF = 0.40
    
    combined_risk = (norm_z * WEIGHT_Z) + (norm_rrcf * WEIGHT_RRCF)
    
    # 4. Final Alert Threshold
    # If the combined weighted risk exceeds 60% (0.60), trigger the alert.
    COMBINED_ALERT_THRESHOLD = 0.60
    
    final_alert = combined_risk > COMBINED_ALERT_THRESHOLD

    # ==========================================

    new_rrcf_b64 = base64.b64encode(rrcf_output["updated_forest_bytes"]).decode('utf-8')

    return {
        "user_id": user_id,
        "stream_index": next_index,
        "rrcf_anomaly_score": round(rrcf_output["rrcf_score"], 3),
        "zscore_metrics": {
            "max_z": round(zscore_output["max_z_score"], 3),
            "dynamic_threshold": round(zscore_output.get("threshold_used", 0.0), 3),
            "is_anomaly": zscore_output["is_anomaly"]
        },
        "combined_risk_score": round(combined_risk, 3),  # e.g., 0.72 (72% risk)
        "trigger_alert": final_alert,
        "updated_rrcf_state_b64": new_rrcf_b64,
        "updated_zscore_state": zscore_output["updated_state"]
    }
