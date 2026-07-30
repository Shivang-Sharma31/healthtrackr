
// NOTE: This is a styled template preserving your logic.
// Replace your existing CreateHealthRecord.jsx with this file.

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
    setFormData((p)=>({...p,[e.target.name]:e.target.value}));
  };

  const handleSubmit = async(e)=>{
    e.preventDefault();
    try{
      const payload={
        heart_rate:Number(formData.heart_rate),
        systolic_bp:Number(formData.systolic_bp),
        blood_sugar:Number(formData.blood_sugar),
        steps:Number(formData.steps),
        water_intake:Number(formData.water_intake),
      };
      if(formData.recordedAt) payload.recordedAt=formData.recordedAt;

      const res=await axios.post(
        "http://localhost:5000/api/healthrecord/create-health-record",
        payload,
        {withCredentials:true}
      );

      setMessage(res.data.message);
      setFormData({
        heart_rate:"",
        systolic_bp:"",
        blood_sugar:"",
        steps:"",
        water_intake:"",
        recordedAt:"",
      });
    }catch(error){
      setMessage(error.response?.data?.message || error.message);
    }
  };

  const Field = ({
  label,
  name,
  type = "number",
  step,
  value,
  onChange,
}) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
    </label>

    <input
      type={type}
      name={name}
      value={value}
      step={step}
      onChange={onChange}
      required={type !== "datetime-local"}
      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
    />
  </div>
);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Create Health Record</h1>
          <p className="text-blue-100 text-lg">
            Log today's vitals and build your 30‑day health insights.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto -mt-16 px-6 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <Field label="❤️ Heart Rate (bpm)" name="heart_rate"/>
            <Field label="🩸 Systolic BP (mmHg)" name="systolic_bp"/>
            <Field label="🍬 Blood Sugar (mg/dL)" name="blood_sugar"/>
            <Field label="👣 Steps" name="steps"/>
            <Field label="💧 Water Intake (L)" name="water_intake" step="0.1"/>
            <Field label="📅 Date & Time (Optional)" name="recordedAt" type="datetime-local"/>

            <div className="md:col-span-2 pt-2">
              <button
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 transition shadow-lg">
                Save Health Record
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4 text-center text-blue-700 font-semibold">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateHealthRecord;
