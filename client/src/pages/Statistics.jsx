import { useEffect, useState } from "react";
import axios from "axios";

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/healthrecord/user-stats",
        {
          withCredentials: true,
        }
      );

      setStats(res.data.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to fetch statistics."
      );
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        {message || "Loading..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-10">
          Health Statistics
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <StatCard
            title="Average Heart Rate"
            value={`${stats.avg_heart_rate?.toFixed(2)} bpm`}
          />

          <StatCard
            title="Minimum Heart Rate"
            value={`${stats.min_heart_rate} bpm`}
          />

          <StatCard
            title="Maximum Heart Rate"
            value={`${stats.max_heart_rate} bpm`}
          />

          <StatCard
            title="Average Blood Pressure"
            value={`${stats.avg_systolic_bp?.toFixed(2)} mmHg`}
          />

          <StatCard
            title="Minimum Blood Pressure"
            value={`${stats.min_systolic_bp} mmHg`}
          />

          <StatCard
            title="Maximum Blood Pressure"
            value={`${stats.max_systolic_bp} mmHg`}
          />

          <StatCard
            title="Average Blood Sugar"
            value={`${stats.avg_blood_sugar?.toFixed(2)} mg/dL`}
          />

          <StatCard
            title="Minimum Blood Sugar"
            value={`${stats.min_blood_sugar} mg/dL`}
          />

          <StatCard
            title="Maximum Blood Sugar"
            value={`${stats.max_blood_sugar} mg/dL`}
          />

          <StatCard
            title="Total Steps"
            value={stats.total_steps}
          />

          <StatCard
            title="Total Water Intake"
            value={`${stats.total_water_intake} L`}
          />

          <StatCard
            title="Records Logged"
            value={stats.record_count}
          />

        </div>

      </div>

    </div>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <h2 className="text-lg font-semibold text-gray-700">
        {title}
      </h2>

      <p className="text-3xl font-bold text-blue-600 mt-3">
        {value}
      </p>

    </div>
  );
};

export default Statistics;