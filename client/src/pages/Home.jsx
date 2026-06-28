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

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between">

          <h1 className="text-2xl font-bold text-blue-600">
            HealthTrackr
          </h1>

          {user ? (
            <div className="flex items-center gap-4">

              <span className="font-bold text-2xl mr-1 text-amber-800 ">
                {user.username}
              </span>

              <Link to="/profile">
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-10 h-10 ml-50px rounded-full border object-cover cursor-pointer"
                />
              </Link>

            </div>
          ) : (
            <div className="flex gap-5">

              <Link to="/login">
                Login
              </Link>

              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Register
              </Link>

            </div>
          )}

        </div>
      </nav>

      <div className="text-center mt-24">
        <h1 className="text-5xl font-bold">
          Welcome to HealthTrackr
        </h1>
      </div>

    </div>
  );
};

export default Home;