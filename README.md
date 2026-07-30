# HealthTrackr 🏥📈

Welcome to **HealthTrackr**, a full-stack health monitoring and analysis platform equipped with real-time, ML-powered anomaly detection. 

HealthTrackr helps users keep a close eye on their key vitals and daily habits, while a backend streaming ML engine continuously analyzes metrics to flags sudden changes, spikes, or anomalous patterns, triggering immediate notifications.

---

## 🌟 Key Features

- **User Authentication**: Secure user registration, login, and sessions using JWT and Cookies.
- **Detailed Vitals Logging**: Log core health metrics daily (Heart Rate, Systolic Blood Pressure, Blood Sugar, Steps, and Water Intake).
- **Interactive Dashboards**: Visualize health metrics, trends, and history using responsive, interactive Recharts graphs.
- **Real-time Anomaly Detection**:
  - **Robust Random Cut Forest (RRCF)**: Evaluates high-dimensional health data points for sudden anomalous spikes or context-shifts.
  - **Streaming Z-Score Engine**: Adapts thresholds dynamically over a running time-window to flag deviations in individual metrics.
- **Dynamic Email Alerts**: Immediate automated notification emails via Nodemailer & Mailgen when anomalous vital combinations or critical thresholds are breached.
- **Profile Management**: Customize profile details and upload profile pictures powered by Cloudinary and Multer.

---

## 🏗️ Architecture Overview

HealthTrackr is built as a modular application with three key services:

```
healthtrackr/
├── client/     # React frontend built with Vite and styled using Tailwind CSS
├── server/     # Node.js + Express backend connected to MongoDB (Mongoose ODM)
└── ml/         # FastAPI stateless anomaly detection microservice (Python)
```

1. **Frontend (`/client`)**:
   - Single Page Application (SPA) powered by **React 19**, **Vite**, and **React Router v7**.
   - Rich interactive charting utilizing **Recharts**.
   - Styled beautifully using **Tailwind CSS**.
2. **Backend (`/server`)**:
   - **Express.js** REST API handling business logic, database queries, and ML integration.
   - **Mongoose ODM** managing database models (`User`, `HealthRecord`, and `MLState`).
   - Image handling using **Multer** and **Cloudinary**.
   - Alert notifications using **Nodemailer** with styled html emails via **Mailgen**.
3. **ML Service (`/ml`)**:
   - **FastAPI** microservice serving stateless real-time predictions.
   - Updates models dynamically by reading and writing serialized mathematical states base64-encoded to and from the backend database (no heavy ML databases/caches needed!).

---

## 🚀 Setup & Running Locally

Ensure you have **Node.js (v18+)**, **MongoDB**, and **Python (3.9+)** installed.

### 1. Database & Environment Configuration

#### Backend Environment Variables
Create a `.env` file inside the `server/` directory and populate it with the following configuration:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_access_token_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_token_secret

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Alerts (SMTP Provider e.g. Mailtrap or Gmail)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@healthtrackr.com

# Machine Learning API URL
ML_API_URL=http://127.0.0.1:8000
```

---

### 2. Running the Server (Backend)

Navigate to the `server` directory, install packages, and boot the application:
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

---

### 3. Running the Client (Frontend)

Navigate to the `client` directory, install packages, and boot the Vite dev server:
```bash
cd ../client
npm install
npm run dev
```
The application interface will be accessible at `http://localhost:5173` (or the port specified by Vite).

---

### 4. Running the ML Microservice

Navigate to the `ml/final_model` directory, create a virtual environment, install Python dependencies, and boot the Uvicorn server:

```bash
cd ../ml/final_model
python -m venv venv

# Activate Virtual Environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

To test the ML service independently, you can run:
```bash
python test_api.py
```

---

## 📊 ML Stateless Pipeline Details

Rather than maintaining a heavy database/caching layer on the ML microservice, HealthTrackr utilizes a **stateless, stream-based architecture**:
1. When a user submits daily vitals, the Node.js backend retrieves the user's latest ML model states (`rrcf_state_b64` and `zscore_state`) from the **MongoDB** database.
2. The Node.js backend sends the vitals payload along with the base64-encoded model state directly to the FastAPI `/analyze/{userId}` endpoint.
3. The ML service decodes the state, inserts the new data point to calculate the updated anomaly scores, updates its internal mathematical representation, and returns the computed scores and the new serialized model state back to Node.js.
4. The Node.js backend saves the new states back to MongoDB and routes alerts if the scoring thresholds are exceeded.