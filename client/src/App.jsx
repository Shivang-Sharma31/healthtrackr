import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import CreateHealthRecord from "./pages/CreateHealthRecord";
import HealthRecords from "./pages/HealthRecords";
import Statistics from "./pages/Statistics";
import HealthPrediction from "./pages/HealthPrediction";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/profile" element={<Profile />} />

      <Route
        path="/create-record"
        element={<CreateHealthRecord />}
      />

      <Route
        path="/records"
        element={<HealthRecords />}
      />

      <Route
        path="/statistics"
        element={<Statistics />}
      />

      <Route
        path="/prediction"
        element={<HealthPrediction />}
      />

    </Routes>
  );
}

export default App;