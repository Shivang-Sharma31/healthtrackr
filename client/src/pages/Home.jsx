import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Recharts from "../components/Recharts";

const Home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/current-user",
        {
          withCredentials: true,
        }
      );
      setUser(res.data.data);
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
              HealthTrackr
            </h1>
          </Link>

          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-5">
              <span className=" font-bold text-slate-600 hidden sm:block text-xl">
                Welcome ,  {user.username}
              </span>
              <Link to="/profile">
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-blue-500 transition-colors shadow-sm"
                />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-full text-blue-700 font-medium hover:bg-blue-50 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-linear-to-br from-slate-900 via-blue-900 to-blue-800 text-white pt-24 pb-36 px-6 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-cyan-500 opacity-10 blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Health is all we are <br className="hidden md:block" /> concerned about.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 opacity-90">
            {user 
              ? "Access your dashboard to log vitals, track trends, and run AI health predictions." 
              : "Track your daily vitals, monitor your statistics, and predict possible health anomalies using advanced Machine Learning."}
          </p>
          
          {!user && (
            <Link to="/register" className="inline-block px-8 py-4 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-1">
              Discover More
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area (Overlapping the Hero) */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-20">
        
        {user ? (
          <>
          {/* LOGGED IN DASHBOARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Add Record */}
            <Link to="/create-record" className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Add Record</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Log your daily vitals to keep your health data up to date.</p>
            </Link>

            {/* Card 2: Records */}
            <Link to="/records" className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition group">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">History</h2>
              <p className="text-slate-500 text-sm leading-relaxed">View and analyze your health records from the past 30 days.</p>
            </Link>

            {/* Card 3: Statistics */}
            <Link to="/statistics" className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Statistics</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Visualize your health trends with detailed statistical breakdowns.</p>
            </Link>

            {/* Card 4: AI Prediction */}
            <Link to="/prediction" className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition group">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">AI Prediction</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Run anomaly detection to catch health issues before they escalate.</p>
            </Link>
            {/* recharts added here  */}
          </div>
          <div className="mt-12 w-full">
          <Recharts />
        </div>
        </>
        ) : (
          /* LOGGED OUT FEATURES (To mimic the image's service cards) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Daily Tracking</h3>
              <p className="text-slate-500 text-sm">Keep a close eye on your vitals with our easy-to-use daily logging system.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Insights</h3>
              <p className="text-slate-500 text-sm">Get real-time statistics and 30-day rolling averages of your health journey.</p>
            </div>

            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI Protection</h3>
              <p className="text-slate-500 text-sm">Our ML models watch your data continuously to alert you of anomalies.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;