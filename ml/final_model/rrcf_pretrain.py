import numpy as np
import pandas as pd
import rrcf
import pickle

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
