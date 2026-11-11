
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  BriefcaseMedical,
  Settings,
  Search,
  Clock3,
  CheckCircle2,
  CircleAlert,
  TrendingUp,
  Menu,
  X,
  Activity,
  ArrowUpRight,
  Plus,
  LogOut,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import AdminManagement from "./AdminManagement";
import "./AdminDashboard.css";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function formatTime(value) {
  if (!value) return "—";

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const navItems = [
  { label: "Dashboard", section: "dashboard", icon: LayoutDashboard },
  { label: "Appointments", section: "appointments", icon: CalendarDays },
  { label: "Patients", section: "patients", icon: Users },
  { label: "Doctors", section: "doctors", icon: Stethoscope },
  { label: "Services", section: "services", icon: BriefcaseMedical },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const [activeSection, setActiveSection] = useState("dashboard");

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    patients: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const date = today();

    try {
      const [
        appointmentsResult,
        totalResult,
        confirmedResult,
        pendingResult,
        patientsResult,
        doctorsResult,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            notes,
            patients!appointments_patient_id_fkey (
              full_name,
              email,
              phone
            ),
            doctors!appointments_doctor_id_fkey (
              name
            ),
            services!appointments_service_id_fkey (
              name
            )
          `)
          .order("appointment_date", { ascending: false })
          .order("start_time", { ascending: true })
          .limit(10),

        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("appointment_date", date),

        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("appointment_date", date)
          .eq("status", "confirmed"),

        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("appointment_date", date)
          .eq("status", "pending"),

        supabase
          .from("patients")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("doctors")
          .select("id, name, specialization")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (totalResult.error) throw totalResult.error;
      if (confirmedResult.error) throw confirmedResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (doctorsResult.error) throw doctorsResult.error;

      setAppointments(appointmentsResult.data || []);
      setDoctors(doctorsResult.data || []);

      setStats({
        total: totalResult.count || 0,
        confirmed: confirmedResult.count || 0,
        pending: pendingResult.count || 0,
        patients: patientsResult.count || 0,
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const patient = appointment.patients?.full_name || "";
      const service = appointment.services?.name || "";
      const doctor = appointment.doctors?.name || "";

      const matchesSearch = [
        patient,
        service,
        doctor,
        appointment.id,
      ].some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      );

      const matchesStatus =
        statusFilter === "all" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  async function updateStatus(id, newStatus) {
    setUpdatingId(id);
    setError("");

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await loadDashboard();
    }

    setUpdatingId(null);
  }

  async function handleLogout() {
    const result = await logout();

    if (!result.success) {
      setError(result.message || "Unable to sign out.");
      return;
    }

    navigate("/admin/login", { replace: true });
  }

  function handleSectionChange(section) {
    setActiveSection(section);
    setSidebarOpen(false);
    setError("");
  }

  const adminName = profile?.full_name || "Administrator";

  const sectionTitles = {
    dashboard: "Dashboard",
    appointments: "Appointments",
    patients: "Patients",
    doctors: "Doctors",
    services: "Services",
    settings: "Settings",
  };

  const isManagementSection = [
    "patients",
    "doctors",
    "services",
    "settings",
  ].includes(activeSection);

  return (
    <div className="admin-dashboard" id="dashboard">

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Activity size={21} />
          </div>

          <div>
            <strong>VIYA DENTAL</strong>
            <span>ADMINISTRATION</span>
          </div>

          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="admin-sidebar-label">MAIN MENU</div>

        <nav className="admin-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                className={`admin-nav-item ${
                  activeSection === item.section ? "active" : ""
                }`}
                key={item.section}
                onClick={() => handleSectionChange(item.section)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-label admin-settings-label">
          PREFERENCES
        </div>

        <button
          type="button"
          className={`admin-nav-item ${
            activeSection === "settings" ? "active" : ""
          }`}
          onClick={() => handleSectionChange("settings")}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="admin-sidebar-bottom">

          <div className="admin-help-card">
            <div className="admin-help-icon">
              <CircleAlert size={18} />
            </div>

            <strong>Clinic Management</strong>

            <p>
              Manage Viya Dental operations from one workspace.
            </p>
          </div>

          <Link to="/" className="admin-back-link">
            <ArrowUpRight size={15} />
            Back to Website
          </Link>

        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>
              <span className="admin-topbar-caption">
                WORKSPACE
              </span>

              <h1>{sectionTitles[activeSection]}</h1>
            </div>

          </div>

          <div className="admin-topbar-actions">

            <div className="admin-clinic-status">
              <span />
              Clinic Overview
            </div>

            <div className="admin-profile">

              <div className="admin-profile-avatar">
                {initials(adminName) || "A"}
              </div>

              <div className="admin-profile-details">
                <strong>{adminName}</strong>
                <span>Clinic Administrator</span>
              </div>

            </div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>

          </div>
        </header>

        <div className="admin-content">

          {/* MANAGEMENT MODULES */}
          {isManagementSection ? (

            <AdminManagement section={activeSection} />

          ) : (

            <>

              {/* WELCOME SECTION */}
              <section className="admin-welcome">

                <div>
                  <span className="admin-date-label">
                    CLINIC MANAGEMENT
                  </span>

                  <h2>
                    Welcome back, {adminName}
                  </h2>

                  <p>
                    Here's what's happening at Viya Dental today.
                  </p>
                </div>

                <Link
                  to="/appointment"
                  className="admin-primary-action"
                >
                  <Plus size={17} />
                  New Appointment
                </Link>

              </section>

              {error && (
                <div className="admin-error-message">
                  <CircleAlert size={17} />
                  <span>{error}</span>

                  <button
                    type="button"
                    onClick={loadDashboard}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* LIVE STATISTICS */}
              {activeSection === "dashboard" && (
                <section className="admin-stats-grid">

                  <article className="admin-stat-card">

                    <div className="admin-stat-top">
                      <span>Today's Appointments</span>

                      <div className="admin-stat-icon blue">
                        <CalendarDays size={19} />
                      </div>
                    </div>

                    <strong>
                      {loading ? "—" : stats.total}
                    </strong>

                    <div className="admin-stat-foot">
                      <TrendingUp size={14} />
                      <span>Appointments for today</span>
                    </div>

                  </article>

                  <article className="admin-stat-card">

                    <div className="admin-stat-top">
                      <span>Confirmed</span>

                      <div className="admin-stat-icon green">
                        <CheckCircle2 size={19} />
                      </div>
                    </div>

                    <strong>
                      {loading ? "—" : stats.confirmed}
                    </strong>

                    <div className="admin-stat-foot positive">
                      <span>Confirmed today</span>
                    </div>

                  </article>

                  <article className="admin-stat-card">

                    <div className="admin-stat-top">
                      <span>Pending Requests</span>

                      <div className="admin-stat-icon orange">
                        <Clock3 size={19} />
                      </div>
                    </div>

                    <strong>
                      {loading ? "—" : stats.pending}
                    </strong>

                    <div className="admin-stat-foot warning">
                      <span>Awaiting confirmation today</span>
                    </div>

                  </article>

                  <article className="admin-stat-card">

                    <div className="admin-stat-top">
                      <span>Total Patients</span>

                      <div className="admin-stat-icon purple">
                        <Users size={19} />
                      </div>
                    </div>

                    <strong>
                      {loading ? "—" : stats.patients}
                    </strong>

                    <div className="admin-stat-foot">
                      <span>Registered patient records</span>
                    </div>

                  </article>

                </section>
              )}

              {/* APPOINTMENTS */}
              <section
                className="admin-panel admin-appointments-panel"
                id="appointments"
              >

                <div className="admin-panel-heading">

                  <div>
                    <span className="admin-panel-eyebrow">
                      DAILY SCHEDULE
                    </span>

                    <h2>
                      {activeSection === "appointments"
                        ? "Manage Appointments"
                        : "Recent Appointments"}
                    </h2>

                    <p>
                      View and manage actual clinic bookings.
                    </p>
                  </div>

                  <button
                    className="admin-outline-action"
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                  >
                    <RefreshCw size={15} />
                    Refresh
                  </button>

                </div>

                <div className="admin-table-toolbar">

                  <div className="admin-search">
                    <Search size={17} />

                    <input
                      type="search"
                      placeholder="Search patient, ID, treatment..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>

                  <select
                    className="admin-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>

                </div>

                <div className="admin-table-wrapper">

                  <table className="admin-appointments-table">

                    <thead>
                      <tr>
                        <th>BOOKING ID</th>
                        <th>PATIENT</th>
                        <th>TREATMENT</th>
                        <th>DENTIST</th>
                        <th>DATE / TIME</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>

                      {loading ? (

                        <tr>
                          <td colSpan="7" className="admin-empty-state">
                            Loading appointments...
                          </td>
                        </tr>

                      ) : filteredAppointments.length === 0 ? (

                        <tr>
                          <td colSpan="7" className="admin-empty-state">
                            No appointment records found.
                          </td>
                        </tr>

                      ) : (

                        filteredAppointments.map((appointment) => {
                          const patient =
                            appointment.patients?.full_name ||
                            "Unknown patient";

                          const status =
                            appointment.status || "pending";

                          return (
                            <tr key={appointment.id}>

                              <td>
                                <span className="admin-appointment-id">
                                  {String(appointment.id)
                                    .slice(0, 8)
                                    .toUpperCase()}
                                </span>
                              </td>

                              <td>
                                <div className="admin-patient-cell">

                                  <div className="admin-patient-avatar">
                                    {initials(patient) || "P"}
                                  </div>

                                  <strong>{patient}</strong>

                                </div>
                              </td>

                              <td>
                                {appointment.services?.name ||
                                  "Not assigned"}
                              </td>

                              <td>
                                {appointment.doctors?.name ||
                                  "Not assigned"}
                              </td>

                              <td>
                                <span className="admin-time-cell">
                                  {formatDate(appointment.appointment_date)}
                                  {" · "}
                                  {formatTime(appointment.start_time)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`admin-status-badge ${status}`}
                                >
                                  {status.replace("_", " ")}
                                </span>
                              </td>

                              <td>
                                <select
                                  className="admin-status-select"
                                  value={status}
                                  disabled={updatingId === appointment.id}
                                  onChange={(event) =>
                                    updateStatus(
                                      appointment.id,
                                      event.target.value
                                    )
                                  }
                                  aria-label={`Update status for ${patient}`}
                                >
                                  <option value="pending">
                                    Pending
                                  </option>

                                  <option value="confirmed">
                                    Confirmed
                                  </option>

                                  <option value="completed">
                                    Completed
                                  </option>

                                  <option value="cancelled">
                                    Cancelled
                                  </option>

                                  <option value="no_show">
                                    No Show
                                  </option>

                                </select>
                              </td>

                            </tr>
                          );
                        })

                      )}

                    </tbody>

                  </table>

                </div>

                <div className="admin-table-footer">
                  Showing {filteredAppointments.length} of{" "}
                  {appointments.length} recent records

                  <button
                    type="button"
                    onClick={() => handleSectionChange("dashboard")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Back to overview
                  </button>
                </div>

              </section>

              {/* DASHBOARD-ONLY BOTTOM SECTIONS */}
              {activeSection === "dashboard" && (

                <section className="admin-bottom-grid">

                  {/* CLINIC HOURS */}
                  <article className="admin-panel admin-hours-panel">

                    <div className="admin-panel-heading compact">

                      <div>
                        <span className="admin-panel-eyebrow">
                          CLINIC SCHEDULE
                        </span>

                        <h2>Working Hours</h2>
                      </div>

                      <Clock3 size={19} />

                    </div>

                    <div className="admin-hours-list">

                      <div>
                        <span>Monday – Saturday</span>
                        <strong>9:00 AM – 8:30 PM</strong>
                      </div>

                      <div>
                        <span>Sunday</span>
                        <strong>10:00 AM – 2:00 PM</strong>
                      </div>

                    </div>

                    <div className="admin-hours-note">
                      <CheckCircle2 size={14} />
                      Regular clinic schedule
                    </div>

                  </article>

                  {/* REGISTERED DOCTORS */}
                  <article className="admin-panel admin-doctors-panel">

                    <div className="admin-panel-heading compact">

                      <div>
                        <span className="admin-panel-eyebrow">
                          TEAM OVERVIEW
                        </span>

                        <h2>Registered Doctors</h2>
                      </div>

                      <Stethoscope size={19} />

                    </div>

                    {loading ? (

                      <p>Loading doctors...</p>

                    ) : doctors.length === 0 ? (

                      <p>No active doctors have been added yet.</p>

                    ) : (

                      doctors.map((doctor) => (

                        <div
                          className="admin-doctor-row"
                          key={doctor.id}
                        >

                          <div className="admin-doctor-avatar">
                            {initials(doctor.name) || "D"}
                          </div>

                          <div className="admin-doctor-info">
                            <strong>{doctor.name}</strong>

                            <span>
                              {doctor.specialization ||
                                "Dental practitioner"}
                            </span>
                          </div>

                          <span className="admin-availability available">
                            Active
                          </span>

                        </div>

                      ))

                    )}

                  </article>

                </section>

              )}

              <footer className="admin-footer">
                <span>
                  © 2026 Viya Dental Clinic. Admin Dashboard.
                </span>

                <span>
                  Clinic Management Workspace
                </span>
              </footer>

            </>

          )}

        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
