import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

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
    <div className="min-h-screen bg-slate-100">

      {/* Navbar */}

      <nav className="bg-white shadow">

        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">

          <h1 className="text-3xl font-bold text-blue-600">
            HealthTrackr
          </h1>

          {user ? (
            <div className="flex items-center gap-4">

              <span className="text-xl font-semibold text-gray-700">
                {user.username}
              </span>

              <Link to="/profile">
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
              </Link>

            </div>
          ) : (
            <div className="flex gap-4">

              <Link
                to="/login"
                className="px-5 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Register
              </Link>

            </div>
          )}

        </div>

      </nav>

      {/* Hero */}

      <div className="text-center mt-14">

        <h1 className="text-5xl font-bold text-gray-800">
          Welcome to HealthTrackr
        </h1>

        <p className="text-gray-600 mt-4 text-lg">
          Track your daily health, monitor your statistics and
          predict possible health anomalies using AI.
        </p>

      </div>

      {/* Dashboard */}

      {user && (

        <div className="max-w-6xl mx-auto mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">

          <Link
            to="/create-record"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-2 transition"
          >

            <div className="text-5xl mb-5">
              ➕
            </div>

            <h2 className="text-2xl font-bold">
              Add Record
            </h2>

            <p className="mt-3 text-gray-600">
              Log today's health data.
            </p>

          </Link>

          <Link
            to="/records"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-2 transition"
          >

            <div className="text-5xl mb-5">
              📋
            </div>

            <h2 className="text-2xl font-bold">
              Records
            </h2>

            <p className="mt-3 text-gray-600">
              View your last 30 days records.
            </p>

          </Link>

          <Link
            to="/statistics"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-2 transition"
          >

            <div className="text-5xl mb-5">
              📊
            </div>

            <h2 className="text-2xl font-bold">
              Statistics
            </h2>

            <p className="mt-3 text-gray-600">
              Analyze your health trends.
            </p>

          </Link>

          <Link
            to="/prediction"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-2 transition"
          >

            <div className="text-5xl mb-5">
              🤖
            </div>

            <h2 className="text-2xl font-bold">
              AI Prediction
            </h2>

            <p className="mt-3 text-gray-600">
              Predict possible health anomalies.
            </p>

          </Link>

        </div>

      )}

      {!user && (

        <div className="text-center mt-24">

          <p className="text-2xl text-gray-600">
            Login or Register to start tracking your health.
          </p>

        </div>

      )}

    </div>
  );
};

export default Home;