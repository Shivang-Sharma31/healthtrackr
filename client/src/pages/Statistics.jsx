
import { useEffect,useState } from "react";
import axios from "axios";

const Card=({title,value,color})=>(
<div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 hover:-translate-y-1 transition">
<p className="text-slate-500 text-sm font-semibold">{title}</p>
<h2 className={`text-3xl font-extrabold mt-3 ${color}`}>{value}</h2>
</div>
);

const Statistics=()=>{
 const [stats,setStats]=useState(null);
 const [message,setMessage]=useState("");

 useEffect(()=>{fetchStatistics();},[]);

 const fetchStatistics=async()=>{
  try{
   const res=await axios.get("http://localhost:5000/api/healthrecord/user-stats",{withCredentials:true});
   setStats(res.data.data);
  }catch(err){
   setMessage(err.response?.data?.message||"Unable to fetch statistics.");
  }
 };

 if(!stats){
  return(
   <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xl">
    {message||"Loading statistics..."}
   </div>
  );
 }

 return(
 <div className="min-h-screen bg-slate-50">
  <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white py-16">
   <div className="max-w-6xl mx-auto px-6 text-center">
    <h1 className="text-5xl font-extrabold">Health Statistics</h1>
    <p className="mt-4 text-blue-100">Your health insights from the last 30 days.</p>
   </div>
  </section>

  <div className="max-w-7xl mx-auto px-6 -mt-12 pb-16">
   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

    <Card title="❤️ Average Heart Rate" value={`${stats.avg_heart_rate?.toFixed(2)} bpm`} color="text-red-500"/>
    <Card title="❤️ Minimum Heart Rate" value={`${stats.min_heart_rate} bpm`} color="text-red-400"/>
    <Card title="❤️ Maximum Heart Rate" value={`${stats.max_heart_rate} bpm`} color="text-red-600"/>

    <Card title="🩸 Average Blood Pressure" value={`${stats.avg_systolic_bp?.toFixed(2)} mmHg`} color="text-blue-600"/>
    <Card title="🩸 Minimum Blood Pressure" value={`${stats.min_systolic_bp} mmHg`} color="text-blue-500"/>
    <Card title="🩸 Maximum Blood Pressure" value={`${stats.max_systolic_bp} mmHg`} color="text-blue-700"/>

    <Card title="🍬 Average Blood Sugar" value={`${stats.avg_blood_sugar?.toFixed(2)} mg/dL`} color="text-amber-500"/>
    <Card title="🍬 Minimum Blood Sugar" value={`${stats.min_blood_sugar} mg/dL`} color="text-amber-400"/>
    <Card title="🍬 Maximum Blood Sugar" value={`${stats.max_blood_sugar} mg/dL`} color="text-amber-600"/>

    <Card title="👣 Total Steps" value={stats.total_steps} color="text-green-600"/>
    <Card title="💧 Total Water Intake" value={`${stats.total_water_intake} L`} color="text-cyan-600"/>
    <Card title="📋 Records Logged" value={stats.record_count} color="text-purple-600"/>

   </div>
  </div>
 </div>
 );
};

export default Statistics;
