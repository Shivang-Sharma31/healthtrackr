import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/current-user",
        {
          withCredentials: true,
        }
      );
      setUser(res.data.data);
    } catch (err) {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/users/logout",
        {},
        {
          withCredentials: true,
        }
      );
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-xl font-medium text-slate-600 animate-pulse">Loading Profile...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Dynamic Header/Banner */}
      <div className="relative h-64 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-5%] w-80 h-80 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>
        
        {/* Safe Area for Mobile */}
        <div className="absolute top-6 left-6">
           <Link to="/" className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors inline-block">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Status10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
           </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Card */}
        <div className="relative -mt-32 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-8 border border-slate-100">
          {/* Avatar Section */}
          <div className="flex flex-col items-center -mt-24">
            <div className="relative p-2 bg-white rounded-full shadow-xl">
              <img
                src={user.avatar}
                alt="avatar"
                className="w-36 h-36 rounded-full object-cover ring-4 ring-blue-50"
              />
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="text-center mt-6">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {user.username}
              </h1>
              <p className="text-slate-500 font-medium flex items-center justify-center gap-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                @{user.username.toLowerCase().replace(/\s+/g, '')}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 mt-10">
            {/* Main Metric */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Activity Impact</p>
                  <h3 className="text-slate-500 text-sm font-medium mt-1">Health Records Logged</h3>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{user.counter + 1}</span>
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Entries</span>
              </div>
            </div>

            {/* Info Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Email Address</p>
                 <p className="text-slate-800 font-semibold mt-2 break-all">{user.email}</p>
               </div>
               
               <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex justify-between items-center">
                 <div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verification</p>
                   <p className={`font-bold mt-2 flex items-center gap-1.5 ${user.isEmailVerified ? "text-emerald-600" : "text-rose-500"}`}>
                     {user.isEmailVerified ? (
                       <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                         </svg>
                         Verified
                       </>
                     ) : "Unverified"}
                   </p>
                 </div>
                 {!user.isEmailVerified && (
                   <button className="text-xs font-bold text-blue-600 hover:underline">Verify Now</button>
                 )}
               </div>

               <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl sm:col-span-2">
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Journey Started</p>
                 <div className="flex items-center gap-3 mt-2 text-slate-800 font-semibold">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                   {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                 </div>
               </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col gap-4">
            <Link
              to="/"
              className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-slate-400 hover:text-rose-500 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
};

export default Profile;