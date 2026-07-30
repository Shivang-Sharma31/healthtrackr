import numpy as np
import rrcf
import pickle

class RRCFEngine:
    def __init__(self, num_trees=100, tree_size=256):
        self.num_trees = num_trees
        self.tree_size = tree_size

    def initialize_forest(self):
        """Returns a brand new empty forest for a new user, serialized."""
        # FIXED: Added random_state=i to allow safe pickling!
        forest = [rrcf.RCTree(random_state=i) for i in range(self.num_trees)]
        return pickle.dumps(forest)

    def predict_and_update(self, serialized_forest, feature_vector, current_index):
        """
        Takes the user's current forest and new 6D data point.
        Returns the anomaly score and the updated serialized forest.
        """
        if not serialized_forest:
            serialized_forest = self.initialize_forest()
            
        forest = pickle.loads(serialized_forest)
        point = np.array(feature_vector)
        anomaly_score = 0

        for tree in forest:
            # Enforce tree size limit (forget oldest point)
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
        """Calculates the decaying threshold exactly like your notebook."""
        # Cap day_count at n_days to prevent threshold from dropping infinitely
        capped_day = min(day_count, self.n_days)
        return self.thresh_start - ((self.thresh_start - self.thresh_end) * (capped_day - 1) / (self.n_days - 1))

    def predict_and_update(self, previous_state, current_features):
        """
        Calculates streaming Exponential Moving Average (EMA) and Variance.
        current_features: dict of current vitals e.g. {'heart_rate': 75.0, ...}
        previous_state: dict of user's last known EMA means and variances
        """
        # If new user, initialize state with their first readings
        if not previous_state:
            previous_state = {
                "day_count": 1,
                "means": {k: v for k, v in current_features.items()},
                "variances": {k: 0.1 for k, v in current_features.items()} # Initialize with small variance
            }
            return {"max_z_score": 0.0, "is_anomaly": False, "updated_state": previous_state}

        new_state = {
            "day_count": previous_state["day_count"] + 1,
            "means": {},
            "variances": {}
        }
        
        max_z = 0.0
        
        # Calculate streaming EMA and Z-score for each feature
        for feature, new_val in current_features.items():
            prev_mean = previous_state["means"].get(feature, new_val)
            prev_var = previous_state["variances"].get(feature, 0.1)

            # Streaming EMA Math
            new_mean = (self.alpha * new_val) + ((1 - self.alpha) * prev_mean)
            new_var = (1 - self.alpha) * (prev_var + self.alpha * (new_val - prev_mean)**2)
            std_dev = np.sqrt(new_var) if new_var > 0 else 0.1
            
            # Z-Score Math
            z_score = abs(new_val - new_mean) / std_dev
            max_z = max(max_z, z_score)

            new_state["means"][feature] = new_mean
            new_state["variances"][feature] = new_var

        # Evaluate against dynamic threshold
        current_thresh = self.get_dynamic_threshold(new_state["day_count"])
        is_anomaly = max_z > current_thresh

        return {
            "max_z_score": float(max_z),
            "threshold_used": float(current_thresh),
            "is_anomaly": bool(is_anomaly),
            "updated_state": new_state
        }