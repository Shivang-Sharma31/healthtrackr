import { useState } from "react";
import axios from "axios";

const HealthPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    setMessage("");

    try {
      const res = await axios.get(
        "http://localhost:5000/api/healthrecord/predict-health",
        {
          withCredentials: true,
        }
      );

      setPrediction(res.data.data.prediction);
      setMessage(res.data.message);
    } catch (error) {
      setPrediction(null);

      setMessage(
        error.response?.data?.message ||
          "Unable to predict health."
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center">

      <div className="bg-white shadow-xl rounded-2xl w-full max-w-xl p-8">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-3">
          AI Health Prediction
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Our AI will analyze your latest health record and predict
          whether any health anomaly is detected.
        </p>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl text-lg font-semibold cursor-pointer transition"
        >
          {loading ? "Predicting..." : "Predict My Health"}
        </button>

        {message && (
          <div className="mt-8 text-center">

            <p className="font-semibold text-lg">
              {message}
            </p>

            {prediction !== null && (

              prediction ? (

                <div className="mt-6 p-6 rounded-xl bg-red-100 border border-red-300">

                  <h2 className="text-2xl font-bold text-red-700">
                    ⚠ Health Anomaly Detected
                  </h2>

                  <p className="mt-2 text-red-600">
                    Your latest health record appears abnormal.
                    Please monitor your health and consult a doctor
                    if necessary.
                  </p>

                </div>

              ) : (

                <div className="mt-6 p-6 rounded-xl bg-green-100 border border-green-300">

                  <h2 className="text-2xl font-bold text-green-700">
                    ✅ Health Looks Normal
                  </h2>

                  <p className="mt-2 text-green-600">
                    Great! Your latest health record appears healthy.
                    Keep maintaining your healthy lifestyle.
                  </p>

                </div>

              )

            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default HealthPrediction;