
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Doctors from "./pages/Doctors";
import Appointment from "./pages/Appointment";
import PatientInfo from "./pages/PatientInfo";
import Contact from "./pages/Contact";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Admin login - separate from public layout */}
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* Protected admin dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

          {/* Public website */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/patient-info" element={<PatientInfo />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
