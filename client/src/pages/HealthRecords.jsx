
import { useEffect, useState } from "react";
import axios from "axios";

const Stat = ({icon,label,value})=>(
<div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
 <span className="font-medium">{icon} {label}</span>
 <span className="font-bold text-blue-700">{value}</span>
</div>
);

const HealthRecords=()=>{
 const [records,setRecords]=useState([]);
 const [message,setMessage]=useState("");

 useEffect(()=>{fetchRecords();},[]);

 const fetchRecords=async()=>{
  try{
   const res=await axios.get("http://localhost:5000/api/healthrecord/user-records",{withCredentials:true});
   setRecords(res.data.data?.recentData||[]);
  }catch(err){
   setMessage(err.response?.data?.message||"Unable to fetch records.");
  }
 };

 return(
<div className="min-h-screen bg-slate-50">
<section className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white py-16">
<div className="max-w-6xl mx-auto px-6 text-center">
<h1 className="text-5xl font-extrabold">Health History</h1>
<p className="text-blue-100 mt-4">Review your last 30 days of health records.</p>
</div>
</section>

<div className="max-w-7xl mx-auto px-6 -mt-12 pb-16">

{message && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">{message}</div>}

{records.length===0?(
<div className="bg-white rounded-3xl shadow-xl p-16 text-center">
<h2 className="text-3xl font-bold text-slate-700">No Health Records</h2>
<p className="text-slate-500 mt-3">Create your first health record to start tracking.</p>
</div>
):(
<div className="grid lg:grid-cols-2 gap-8">
{records.map(record=>(
<div key={record._id} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition">
<div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6">
<h2 className="text-2xl font-bold">{new Date(record.recordedAt).toLocaleDateString()}</h2>
<p className="opacity-90 mt-1">{new Date(record.recordedAt).toLocaleTimeString()}</p>
</div>

<div className="p-6 space-y-3">
<Stat icon="❤️" label="Heart Rate" value={`${record.heart_rate} bpm`} />
<Stat icon="🩸" label="Systolic BP" value={`${record.systolic_bp} mmHg`} />
<Stat icon="🍬" label="Blood Sugar" value={`${record.blood_sugar} mg/dL`} />
<Stat icon="👣" label="Steps" value={record.steps} />
<Stat icon="💧" label="Water Intake" value={`${record.water_intake} L`} />
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
