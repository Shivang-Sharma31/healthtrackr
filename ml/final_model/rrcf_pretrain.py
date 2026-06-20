import numpy as np
import pandas as pd
import rrcf
import pickle

def generate_synthetic_vitals(seed=42):
    np.random.seed(seed)
    days = 30
    n_users = 50
    total_records = days * n_users

    heart_rate = np.random.normal(75, 10, total_records)
    systolic_bp = np.random.normal(120, 15, total_records)
    blood_sugar = np.random.normal(100, 20, total_records)
    steps = np.random.poisson(8000, total_records)
    water_intake = np.random.normal(2.5, 0.5, total_records)

    df = pd.DataFrame({
        'heart_rate': heart_rate,
        'systolic_bp': systolic_bp,
        'blood_sugar': blood_sugar,
        'steps': steps,
        'water_intake': water_intake
    })

    anomaly_indices = np.random.choice(total_records, size=int(total_records * 0.05), replace=False)
    for idx in anomaly_indices:
        df.loc[idx, 'heart_rate'] += np.random.uniform(40, 60)
        df.loc[idx, 'systolic_bp'] -= np.random.uniform(30, 50)
        df.loc[idx, 'water_intake'] -= np.random.uniform(1.0, 2.0)

    return df, anomaly_indices

def main():
    training_file = r"E:\health_trackr_ml\health_Vitals_dataset.csv"
    features = ['heart_rate', 'systolic_bp', 'blood_sugar', 'steps', 'water_intake']

    num_trees = 100
    tree_size = 256
    forest = []

    for i in range(num_trees):
        tree = rrcf.RCTree(random_state=i) 
        forest.append(tree)
        
    if training_file:
        print(f"Loading and training on: {training_file}")
        try:
            df_train = pd.read_csv(training_file)
            train_data = df_train[features].values

            for i, point in enumerate(train_data):
                for tree in forest:
                    if len(tree.leaves) > tree_size:
                        tree.forget_point(i - tree_size)
                    tree.insert_point(point, index=i)
            print("Global RCF training complete.")

            # ---> SAVING CODE GOES EXACTLY HERE <---
            with open("global_pretrained_rrcf.pkl", "wb") as f:
                pickle.dump(forest, f)
            print("Pre-trained model saved successfully!")
            # ---------------------------------------

        except FileNotFoundError:
            print(f"Error: Could not find {training_file}. Proceeding without pre-training.")
        except KeyError as e:
             print(f"Error: Your training file is missing a required feature column: {e}")
             return
    else:
        print("No training file provided. Initializing an empty RCF model.")

    print("\nGenerating synthetic clinical data (Seed: 42)...")
    df_test, true_anomalies = generate_synthetic_vitals(seed=42)

    test_data = df_test[features].values

    print("Scoring synthetic dataset...")
    anomaly_scores = np.zeros(len(test_data))

    idx_offset = 1000000

    for i, point in enumerate(test_data):
        score = 0
        current_idx = i + idx_offset

        for tree in forest:
            if len(tree.leaves) == 0:
                tree.insert_point(point, index=current_idx)
                continue

            tree.insert_point(point, index=current_idx)
            score += tree.codisp(current_idx)
            tree.forget_point(current_idx)

        anomaly_scores[i] = score / num_trees

    df_test['anomaly_score'] = anomaly_scores
    df_test['is_true_anomaly'] = df_test.index.isin(true_anomalies)

    print("\n--- Testing Complete ---")
    print("\nTop 10 Data Points with the Highest Anomaly Scores:")

    top_anomalies = df_test.sort_values('anomaly_score', ascending=False).head(10)
    print(top_anomalies.to_string())

if __name__ == "__main__":
    main()