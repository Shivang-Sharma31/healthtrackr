import { useEffect, useState } from "react";
import axios from "axios";

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/healthrecord/user-records",
        {
          withCredentials: true,
        }
      );

      setRecords(res.data.data.recentData || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to fetch records."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-10">
          Your Health Records
        </h1>

        {message && (
          <div className="text-center text-red-500 mb-6">
            {message}
          </div>
        )}

        {records.length === 0 ? (

          <div className="text-center text-xl text-gray-500">
            No health records found.
          </div>

        ) : (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {records.map((record) => (

              <div
                key={record._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >

                <h2 className="text-xl font-bold text-blue-600 mb-4">
                  {new Date(record.recordedAt).toLocaleDateString()}
                </h2>

                <div className="space-y-2">

                  <p>
                    ❤️ <strong>Heart Rate:</strong>{" "}
                    {record.heart_rate} bpm
                  </p>

                  <p>
                    🩸 <strong>Systolic BP:</strong>{" "}
                    {record.systolic_bp} mmHg
                  </p>

                  <p>
                    🍬 <strong>Blood Sugar:</strong>{" "}
                    {record.blood_sugar} mg/dL
                  </p>

                  <p>
                    👣 <strong>Steps:</strong>{" "}
                    {record.steps}
                  </p>

                  <p>
                    💧 <strong>Water Intake:</strong>{" "}
                    {record.water_intake} L
                  </p>

                  <p className="text-sm text-gray-500 mt-4">
                    Logged at{" "}
                    {new Date(record.recordedAt).toLocaleTimeString()}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default HealthRecords;