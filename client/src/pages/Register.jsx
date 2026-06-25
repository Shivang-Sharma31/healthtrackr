import { useState } from "react";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("avatar", avatar);

      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        data,
        {
          withCredentials: true,
        }
      );

      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-red">
          Register
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setAvatar(e.target.files[0])
            }
            className="w-full border p-2 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Register
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-red-500">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;