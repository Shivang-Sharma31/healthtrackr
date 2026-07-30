import { useState } from "react";
import axios from "axios";

const HealthPrediction = () => {
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setMessage("");

    try {
      const res = await axios.get(
        "http://localhost:5000/api/healthrecord/predict-health",
        {
          withCredentials: true,
        }
      );

      setResult(res.data.data);
      setMessage(res.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to predict health."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Action Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            AI Health <span className="text-blue-600">Prediction</span>
          </h1>
          <p className="text-slate-500 mt-2 mb-8 max-w-xl mx-auto">
            Run our Machine Learning model against your latest vitals to detect anomalies using Random Cut Forests and Z-Score analysis.
          </p>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full sm:w-auto px-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl text-lg font-semibold shadow-lg transition-all"
          >
            {loading ? "Analyzing Vitals..." : "Run Prediction Model"}
          </button>

          {message && !result && (
            <p className="mt-6 text-sm font-medium text-red-500 bg-red-50 py-2 rounded-lg max-w-md mx-auto">
              {message}
            </p>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            
            {/* Primary Alert Banner */}
            <div
              className={`rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border ${
                result.prediction
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className={`p-4 rounded-full mb-4 ${result.prediction ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {result.prediction ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <h2
                className={`text-3xl font-bold ${
                  result.prediction ? "text-red-700" : "text-green-700"
                }`}
              >
                {result.prediction
                  ? "Anomaly Detected"
                  : "Vitals Look Normal"}
              </h2>
              <p className={`mt-2 max-w-lg ${result.prediction ? "text-red-600" : "text-green-600"}`}>
                {result.prediction
                  ? "The model detected abnormal patterns in your recent health metrics. Consider consulting a healthcare professional."
                  : "No significant anomalies found in your recent data stream. Keep up the healthy habits!"}
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Stream Index" value={result.stream_index} color="text-slate-800" />
              <MetricCard title="RRCF Score" value={Number(result.rrcf_anomaly_score).toFixed(3)} color="text-blue-600" />
              <MetricCard title="Max Z-Score" value={Number(result.zscore_metrics.max_z).toFixed(3)} color="text-purple-600" />
              <MetricCard title="Threshold" value={Number(result.zscore_metrics.dynamic_threshold).toFixed(3)} color="text-cyan-600" />
            </div>

            {/* Detailed Z-Score Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                  Z-Score Analysis Breakdown
                </h3>
              </div>
              <div className="px-8 py-2">
                <div className="flex justify-between items-center py-4 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Maximum Z-Score</span>
                  <span className="font-bold text-slate-800">{Number(result.zscore_metrics.max_z).toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Dynamic Threshold</span>
                  <span className="font-bold text-slate-800">{Number(result.zscore_metrics.dynamic_threshold).toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="font-medium text-slate-500">Sub-Model Verdict</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-sm ${
                      result.zscore_metrics.is_anomaly
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {result.zscore_metrics.is_anomaly ? "Anomaly Flagged" : "Within Range"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// Reusable micro-component for the stats grid
const MetricCard = ({ title, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center transition hover:shadow-md">
    <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default HealthPrediction;