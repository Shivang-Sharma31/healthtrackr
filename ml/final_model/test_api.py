import requests
import json

BASE_URL = "http://127.0.0.1:8000"
USER_ID = "test_user_999"

print("--- STARTING DAY 1 TEST (Initialization) ---")
day_1_payload = {
    "heart_rate": 72.0,
    "systolic_bp": 120.0,
    "blood_sugar": 95.0,
    "steps": 8500.0,
    "water_intake": 2.5,
    "stream_index": 0,
    "rrcf_state_b64": None,  # Null for Day 1
    "zscore_state": None     # Null for Day 1
}

# Send Day 1 Request
response_1 = requests.post(f"{BASE_URL}/analyze/{USER_ID}", json=day_1_payload)
data_1 = response_1.json()

if response_1.status_code == 200:
    print("✅ Day 1 successful! Models initialized.")
    # Extract the states your API just generated
    saved_rrcf = data_1["updated_rrcf_state_b64"]
    saved_zscore = data_1["updated_zscore_state"]
else:
    print("❌ Day 1 Failed:", data_1)
    exit()

print("\n--- STARTING DAY 2 TEST (Passing State Back) ---")
# Simulate Day 2, feeding the Day 1 outputs back in as inputs
day_2_payload = {
    "heart_rate": 75.0,
    "systolic_bp": 122.0,
    "blood_sugar": 98.0,
    "steps": 9000.0,
    "water_intake": 2.2,
    "stream_index": data_1["stream_index"],  # Passing index 1
    "rrcf_state_b64": saved_rrcf,            # Passing the giant Base64 string back
    "zscore_state": saved_zscore             # Passing the JSON dictionary back
}

# Send Day 2 Request
response_2 = requests.post(f"{BASE_URL}/analyze/{USER_ID}", json=day_2_payload)
data_2 = response_2.json()

if response_2.status_code == 200:
    print("✅ Day 2 successful! Stateless architecture is working perfectly.")
    print(f"New RRCF Score: {data_2['rrcf_anomaly_score']}")
    print(f"New Max Z-Score: {data_2['zscore_metrics']['max_z']}")
else:
    print("❌ Day 2 Failed:", data_2)