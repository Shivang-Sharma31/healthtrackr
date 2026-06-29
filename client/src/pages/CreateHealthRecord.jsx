import { useState } from "react";
import axios from "axios";

const CreateHealthRecord = () => {
  const [formData, setFormData] = useState({
    heart_rate: "",
    systolic_bp: "",
    blood_sugar: "",
    steps: "",
    water_intake: "",
    recordedAt: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        heart_rate: Number(formData.heart_rate),
        systolic_bp: Number(formData.systolic_bp),
        blood_sugar: Number(formData.blood_sugar),
        steps: Number(formData.steps),
        water_intake: Number(formData.water_intake),
      };

      if (formData.recordedAt !== "") {
        payload.recordedAt = formData.recordedAt;
      }

      const res = await axios.post(
        "http://localhost:5000/api/healthrecord/create-health-record",
        payload,
        {
          withCredentials: true,
        }
      );

      setMessage(res.data.message);

      setFormData({
        heart_rate: "",
        systolic_bp: "",
        blood_sugar: "",
        steps: "",
        water_intake: "",
        recordedAt: "",
      });
    } catch (error) {
        console.log(error);
        console.log(error.response);
      
        setMessage(
          error.response?.data?.message ||
          error.message
        );
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center py-10">

      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-8">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
          Create Health Record
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-6"
        >

          <div>
            <label className="block mb-2 font-semibold">
              Heart Rate (bpm)
            </label>

            <input
              type="number"
              name="heart_rate"
              value={formData.heart_rate}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Systolic BP (mmHg)
            </label>

            <input
              type="number"
              name="systolic_bp"
              value={formData.systolic_bp}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Blood Sugar (mg/dL)
            </label>

            <input
              type="number"
              name="blood_sugar"
              value={formData.blood_sugar}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Steps
            </label>

            <input
              type="number"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Water Intake (Litres)
            </label>

            <input
              type="number"
              step="0.1"
              name="water_intake"
              value={formData.water_intake}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Date & Time (Optional)
            </label>

            <input
              type="datetime-local"
              name="recordedAt"
              value={formData.recordedAt}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="md:col-span-2">

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold cursor-pointer transition"
            >
              Save Health Record
            </button>

          </div>

        </form>

        {message && (
          <div className="mt-6 text-center text-lg font-medium text-green-600">
            {message}
          </div>
        )}

      </div>

    </div>
  );
};

export default CreateHealthRecord;