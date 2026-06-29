import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MetricChart = ({ title, dataKey, color, data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        {title}
      </h2>

      <div className="w-full h-[350px]">

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[6, 6, 0, 0]}
            />

          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
};

const Recharts = () => {
  const [records, setRecords] = useState([]);

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

      const recentData = res.data.data?.recentData || [];

      const chartData = recentData
        .sort(
          (a, b) =>
            new Date(a.recordedAt) -
            new Date(b.recordedAt)
        )
        .map((item) => ({
          day: new Date(item.recordedAt).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
            }
          ),

          heartRate: item.heart_rate,
          bloodPressure: item.systolic_bp,
          bloodSugar: item.blood_sugar,
          steps: item.steps,
          water: item.water_intake,
        }));

      setRecords(chartData);
    } catch (error) {
      console.log(error);
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mt-10">
        <h2 className="text-3xl font-bold mb-4">
          Health Statistics
        </h2>

        <p className="text-gray-500">
          No records found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mt-12">

      <h1 className="text-4xl font-bold text-center mb-12 text-blue-700">
        📈 Last 30 Days Health Analysis
      </h1>

      <MetricChart
        title="❤️ Heart Rate (BPM)"
        data={records}
        dataKey="heartRate"
        color="#ef4444"
      />

      <MetricChart
        title="🩸 Systolic Blood Pressure (mmHg)"
        data={records}
        dataKey="bloodPressure"
        color="#2563eb"
      />

      <MetricChart
        title="🍬 Blood Sugar (mg/dL)"
        data={records}
        dataKey="bloodSugar"
        color="#f59e0b"
      />

      <MetricChart
        title="👣 Daily Steps"
        data={records}
        dataKey="steps"
        color="#10b981"
      />

      <MetricChart
        title="💧 Water Intake (L)"
        data={records}
        dataKey="water"
        color="#06b6d4"
      />

    </div>
  );
};

export default Recharts;