import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./AdminManagement.css";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const BUCKET = "clinic-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const emptyDoctor = {
  name: "",
  qualification: "",
  specialization: "",
  experience: "",
  image_url: "",
  description: "",
  is_active: true,
};

const emptyService = {
  name: "",
  description: "",
  image_url: "",
  duration_minutes: 30,
  is_active: true,
};

const emptyBreak = {
  day_of_week: "1",
  break_name: "Break",
  start_time: "11:00",
  end_time: "11:15",
};

const emptyHoliday = {
  holiday_date: "",
  holiday_name: "",
};

const emptyBlocked = {
  blocked_date: "",
  start_time: "09:00",
  end_time: "09:15",
  reason: "",
};

function timeToMinutes(value) {
  if (!value) return 0;
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function validateTimeRange(start, end) {
  return timeToMinutes(end) > timeToMinutes(start);
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AdminManagement({ section }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Patients
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorFile, setDoctorFile] = useState(null);
  const [doctorPreview, setDoctorPreview] = useState("");

  // Services
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingService, setEditingService] = useState(null);
  const [serviceFile, setServiceFile] = useState(null);
  const [servicePreview, setServicePreview] = useState("");

  // Settings
  const [clinicHours, setClinicHours] = useState([]);
  const [clinicBreaks, setClinicBreaks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const [breakForm, setBreakForm] = useState(emptyBreak);
  const [holidayForm, setHolidayForm] = useState(emptyHoliday);
  const [blockedForm, setBlockedForm] = useState(emptyBlocked);

  useEffect(() => {
    loadSection();
  }, [section]);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [section]);

  useEffect(() => {
    return () => {
      if (doctorPreview.startsWith("blob:")) {
        URL.revokeObjectURL(doctorPreview);
      }
    };
  }, [doctorPreview]);

  useEffect(() => {
    return () => {
      if (servicePreview.startsWith("blob:")) {
        URL.revokeObjectURL(servicePreview);
      }
    };
  }, [servicePreview]);

  function showError(message) {
    setError(message || "Something went wrong. Please try again.");
    setSuccess("");
  }

  function showSuccess(message) {
    setSuccess(message);
    setError("");
  }

  async function loadSection() {
    setLoading(true);
    setError("");

    try {
      if (section === "patients") await loadPatients();
      if (section === "doctors") await loadDoctors();
      if (section === "services") await loadServices();
      if (section === "settings") await loadSettings();
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- PATIENTS ----------------

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPatients(data || []);
  }

  async function openPatient(patient) {
    setSelectedPatient(patient);
    setPatientAppointments([]);
    setError("");

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        doctors ( name ),
        services ( name )
      `)
      .eq("patient_id", patient.id)
      .order("appointment_date", { ascending: false });

    if (error) {
      showError(error.message);
      return;
    }

    setPatientAppointments(data || []);
  }

  const filteredPatients = patients.filter((patient) => {
    const search = patientSearch.toLowerCase();

    return (
      (patient.full_name || "").toLowerCase().includes(search) ||
      (patient.email || "").toLowerCase().includes(search) ||
      (patient.phone || "").toLowerCase().includes(search)
    );
  });

  // ---------------- IMAGE UPLOAD ----------------

  function validateImage(file) {
    if (!file) return "Please select an image.";

    if (!file.type.startsWith("image/")) {
      return "Please select a valid image file.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Image size must be 5 MB or less.";
    }

    return "";
  }

  async function uploadImage(file, folder) {
    if (!file) return null;

    const validationError = validateImage(file);
    if (validationError) throw new Error(validationError);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Image uploaded, but its public URL could not be created.");
    }

    return data.publicUrl;
  }

  function handleDoctorFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      showError(validationError);
      event.target.value = "";
      return;
    }

    setDoctorFile(file);
    setDoctorPreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  }

  function handleServiceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      showError(validationError);
      event.target.value = "";
      return;
    }

    setServiceFile(file);
    setServicePreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  }

  // ---------------- DOCTORS ----------------

  async function loadDoctors() {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setDoctors(data || []);
  }

  function resetDoctorForm() {
    setDoctorForm(emptyDoctor);
    setEditingDoctor(null);
    setDoctorFile(null);
    setDoctorPreview("");
  }

  async function saveDoctor(event) {
    event.preventDefault();

    if (!doctorForm.name.trim()) {
      showError("Enter the doctor's name.");
      return;
    }

    if (!doctorForm.qualification.trim()) {
      showError("Enter the doctor's qualification.");
      return;
    }

    if (!doctorForm.specialization.trim()) {
      showError("Enter the doctor's specialization.");
      return;
    }

    if (
      doctorForm.experience !== "" &&
      Number(doctorForm.experience) < 0
    ) {
      showError("Experience cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = doctorForm.image_url || null;

      if (doctorFile) {
        imageUrl = await uploadImage(doctorFile, "doctors");
      }

      const payload = {
        name: doctorForm.name.trim(),
        qualification: doctorForm.qualification.trim(),
        specialization: doctorForm.specialization.trim(),
        experience: Number(doctorForm.experience) || 0,
        image_url: imageUrl,
        description: doctorForm.description.trim() || null,
        is_active: doctorForm.is_active,
      };

      let result;

      if (editingDoctor) {
        result = await supabase
          .from("doctors")
          .update(payload)
          .eq("id", editingDoctor)
          .select()
          .single();
      } else {
        result = await supabase
          .from("doctors")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error("Doctor was not saved. Check your admin permissions.");
      }

      resetDoctorForm();
      await loadDoctors();

      showSuccess(
        editingDoctor
          ? "Doctor updated successfully."
          : "Doctor added successfully."
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editDoctor(doctor) {
    setEditingDoctor(doctor.id);

    setDoctorForm({
      name: doctor.name || "",
      qualification: doctor.qualification || "",
      specialization: doctor.specialization || "",
      experience: doctor.experience ?? "",
      image_url: doctor.image_url || "",
      description: doctor.description || "",
      is_active: doctor.is_active ?? true,
    });

    setDoctorFile(null);
    setDoctorPreview(doctor.image_url || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleDoctor(doctor) {
    setSaving(true);

    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_active: !doctor.is_active })
        .eq("id", doctor.id);

      if (error) throw error;

      await loadDoctors();
      showSuccess(
        doctor.is_active ? "Doctor deactivated." : "Doctor activated."
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- SERVICES ----------------

  async function loadServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setServices(data || []);
  }

  function resetServiceForm() {
    setServiceForm(emptyService);
    setEditingService(null);
    setServiceFile(null);
    setServicePreview("");
  }

  async function saveService(event) {
    event.preventDefault();

    if (!serviceForm.name.trim()) {
      showError("Enter the service name.");
      return;
    }

    if (
      !serviceForm.duration_minutes ||
      Number(serviceForm.duration_minutes) < 5
    ) {
      showError("Service duration must be at least 5 minutes.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = serviceForm.image_url || null;

      if (serviceFile) {
        imageUrl = await uploadImage(serviceFile, "services");
      }

      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        image_url: imageUrl,
        duration_minutes: Number(serviceForm.duration_minutes),
        is_active: serviceForm.is_active,
      };

      let result;

      if (editingService) {
        result = await supabase
          .from("services")
          .update(payload)
          .eq("id", editingService)
          .select()
          .single();
      } else {
        result = await supabase
          .from("services")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error("Service was not saved. Check your admin permissions.");
      }

      resetServiceForm();
      await loadServices();

      showSuccess(
        editingService
          ? "Service updated successfully."
          : "Service added successfully."
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editService(service) {
    setEditingService(service.id);

    setServiceForm({
      name: service.name || "",
      description: service.description || "",
      image_url: service.image_url || "",
      duration_minutes: service.duration_minutes ?? 30,
      is_active: service.is_active ?? true,
    });

    setServiceFile(null);
    setServicePreview(service.image_url || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleService(service) {
    setSaving(true);

    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id);

      if (error) throw error;

      await loadServices();
      showSuccess(
        service.is_active ? "Service deactivated." : "Service activated."
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- CLINIC SETTINGS ----------------

  async function loadSettings() {
    const [
      hoursResult,
      breaksResult,
      holidaysResult,
      blockedResult,
    ] = await Promise.all([
      supabase.from("clinic_hours").select("*").order("day_of_week"),
      supabase.from("clinic_breaks").select("*").order("day_of_week"),
      supabase.from("clinic_holidays").select("*").order("holiday_date"),
      supabase.from("blocked_slots").select("*").order("blocked_date"),
    ]);

    const firstError = [
      hoursResult.error,
      breaksResult.error,
      holidaysResult.error,
      blockedResult.error,
    ].find(Boolean);

    if (firstError) throw firstError;

    const existingHours = hoursResult.data || [];

    const defaultHours = DAYS.map((_, day) => {
      const saved = existingHours.find(
        (item) => Number(item.day_of_week) === day
      );

      if (saved) {
        return {
          ...saved,
          day_of_week: day,
        };
      }

      return {
        day_of_week: day,
        open_time: day === 0 ? "10:00:00" : "09:00:00",
        close_time: day === 0 ? "14:00:00" : "20:30:00",
        is_open: day !== 0 || true,
      };
    });

    setClinicHours(defaultHours);
    setClinicBreaks(breaksResult.data || []);
    setHolidays(holidaysResult.data || []);
    setBlockedSlots(blockedResult.data || []);
  }

  function changeClinicHour(day, field, value) {
    setClinicHours((current) =>
      current.map((item) =>
        Number(item.day_of_week) === Number(day)
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  async function saveClinicHours() {
    for (const item of clinicHours) {
      if (
        item.is_open &&
        !validateTimeRange(item.open_time, item.close_time)
      ) {
        showError(`${DAYS[item.day_of_week]} closing time must be after opening time.`);
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = clinicHours.map((item) => ({
        day_of_week: Number(item.day_of_week),
        open_time: item.open_time,
        close_time: item.close_time,
        is_open: item.is_open,
      }));

      const { error } = await supabase
        .from("clinic_hours")
        .upsert(payload, { onConflict: "day_of_week" });

      if (error) throw error;

      await loadSettings();
      showSuccess("Clinic working hours saved.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- BREAKS ----------------

  async function addBreak(event) {
    event.preventDefault();

    if (!breakForm.break_name.trim()) {
      showError("Enter a break name.");
      return;
    }

    if (!validateTimeRange(breakForm.start_time, breakForm.end_time)) {
      showError("Break end time must be after its start time.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const day = Number(breakForm.day_of_week);

      const { data: existing, error: checkError } = await supabase
        .from("clinic_breaks")
        .select("id, break_name, start_time, end_time")
        .eq("day_of_week", day);

      if (checkError) throw checkError;

      const newStart = timeToMinutes(breakForm.start_time);
      const newEnd = timeToMinutes(breakForm.end_time);

      const overlap = (existing || []).some((item) => {
        const oldStart = timeToMinutes(item.start_time);
        const oldEnd = timeToMinutes(item.end_time);
        return newStart < oldEnd && newEnd > oldStart;
      });

      if (overlap) {
        throw new Error("This break overlaps with another break on the selected day.");
      }

      const { error } = await supabase.from("clinic_breaks").insert({
        day_of_week: day,
        break_name: breakForm.break_name.trim(),
        start_time: breakForm.start_time,
        end_time: breakForm.end_time,
      });

      if (error) throw error;

      setBreakForm(emptyBreak);
      await loadSettings();
      showSuccess("Break time added successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBreak(id) {
    if (!window.confirm("Remove this break time?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("clinic_breaks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadSettings();
      showSuccess("Break time removed.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- HOLIDAYS ----------------

  async function addHoliday(event) {
    event.preventDefault();

    if (!holidayForm.holiday_date || !holidayForm.holiday_name.trim()) {
      showError("Enter both the holiday date and name.");
      return;
    }

    if (holidayForm.holiday_date < getToday()) {
      showError("Please select today or a future date.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: existing, error: checkError } = await supabase
        .from("clinic_holidays")
        .select("id")
        .eq("holiday_date", holidayForm.holiday_date)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        throw new Error("A holiday is already registered for this date.");
      }

      const { error } = await supabase.from("clinic_holidays").insert({
        holiday_date: holidayForm.holiday_date,
        holiday_name: holidayForm.holiday_name.trim(),
      });

      if (error) throw error;

      setHolidayForm(emptyHoliday);
      await loadSettings();
      showSuccess("Clinic holiday added successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteHoliday(id) {
    if (!window.confirm("Remove this clinic holiday?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("clinic_holidays")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadSettings();
      showSuccess("Holiday removed.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- BLOCKED SLOTS ----------------

  async function addBlockedSlot(event) {
    event.preventDefault();

    if (!blockedForm.blocked_date) {
      showError("Select a date to block.");
      return;
    }

    if (blockedForm.blocked_date < getToday()) {
      showError("Please select today or a future date.");
      return;
    }

    if (!validateTimeRange(blockedForm.start_time, blockedForm.end_time)) {
      showError("Blocked slot end time must be after its start time.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("blocked_slots").insert({
        blocked_date: blockedForm.blocked_date,
        start_time: blockedForm.start_time,
        end_time: blockedForm.end_time,
        reason: blockedForm.reason.trim() || null,
      });

      if (error) throw error;

      setBlockedForm(emptyBlocked);
      await loadSettings();
      showSuccess("Appointment time blocked successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlockedSlot(id) {
    if (!window.confirm("Make this time available again?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("blocked_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadSettings();
      showSuccess("Blocked time removed.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- LOADING ----------------

  if (loading) {
    return <div className="am-loading">Loading {section}...</div>;
  }

  return (
    <section className="am-section">
      <div className="am-heading">
        <div>
          <p className="am-eyebrow">VIYA DENTAL ADMIN</p>
          <h2>
            {section === "patients" && "Patients"}
            {section === "doctors" && "Doctors"}
            {section === "services" && "Services"}
            {section === "settings" && "Clinic Settings"}
          </h2>
          <p>
            {section === "patients" && "View patient information and appointment history."}
            {section === "doctors" && "Manage your clinic's doctor profiles."}
            {section === "services" && "Manage treatments and service information."}
            {section === "settings" && "Manage working hours, breaks, holidays and blocked slots."}
          </p>
        </div>

        <button
          className="am-refresh"
          type="button"
          onClick={loadSection}
          disabled={saving}
        >
          Refresh
        </button>
      </div>

      {error && <div className="am-alert am-error">{error}</div>}
      {success && <div className="am-alert am-success">{success}</div>}

      {/* PATIENTS */}

      {section === "patients" && (
        <>
          <div className="am-toolbar">
            <div className="am-count">
              <strong>{patients.length}</strong>
              <span>Total patients</span>
            </div>

            <input
              className="am-search"
              placeholder="Search name, email or phone..."
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
            />
          </div>

          <div className="am-panel">
            <div className="am-table-wrap">
              <table className="am-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.full_name}</td>
                      <td>{patient.email || "Not provided"}</td>
                      <td>{patient.phone}</td>
                      <td>
                        {patient.created_at
                          ? new Date(patient.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="am-button am-secondary"
                          type="button"
                          onClick={() => openPatient(patient)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="am-empty">
                        No patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedPatient && (
            <div
              className="am-modal-backdrop"
              onClick={() => setSelectedPatient(null)}
            >
              <div
                className="am-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="am-modal-heading">
                  <div>
                    <p className="am-eyebrow">PATIENT PROFILE</p>
                    <h3>{selectedPatient.full_name}</h3>
                  </div>

                  <button
                    className="am-close"
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="am-patient-info">
                  <p><strong>Email:</strong> {selectedPatient.email || "Not provided"}</p>
                  <p><strong>Phone:</strong> {selectedPatient.phone || "Not provided"}</p>
                  <p>
                    <strong>Registered:</strong>{" "}
                    {selectedPatient.created_at
                      ? new Date(selectedPatient.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <h4>Appointment history ({patientAppointments.length})</h4>

                <div className="am-history">
                  {patientAppointments.map((appointment) => (
                    <div className="am-history-item" key={appointment.id}>
                      <div>
                        <strong>{appointment.services?.name || "General appointment"}</strong>
                        <p>{appointment.doctors?.name || "Doctor not assigned"}</p>
                        <small>{appointment.notes || "No additional notes"}</small>
                      </div>

                      <div className="am-history-date">
                        <strong>{appointment.appointment_date}</strong>
                        <span>
                          {appointment.start_time?.slice(0, 5)} –{" "}
                          {appointment.end_time?.slice(0, 5)}
                        </span>
                        <span className={`am-status ${appointment.status}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {patientAppointments.length === 0 && (
                    <p className="am-empty">
                      No appointments found for this patient.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* DOCTORS */}

      {section === "doctors" && (
        <>
          <form className="am-panel am-form" onSubmit={saveDoctor}>
            <h3>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</h3>

            <div className="am-form-grid">
              <label>
                Doctor name
                <input
                  required
                  value={doctorForm.name}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, name: e.target.value })
                  }
                />
              </label>

              <label>
                Qualification
                <input
                  required
                  value={doctorForm.qualification}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, qualification: e.target.value })
                  }
                />
              </label>

              <label>
                Specialization
                <input
                  required
                  value={doctorForm.specialization}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, specialization: e.target.value })
                  }
                />
              </label>

              <label>
                Experience (years)
                <input
                  type="number"
                  min="0"
                  value={doctorForm.experience}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, experience: e.target.value })
                  }
                />
              </label>

              <label className="am-full">
                Doctor photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleDoctorFile}
                />
                <small>Choose an image from your computer. Maximum 5 MB.</small>
              </label>

              {doctorPreview && (
                <div className="am-image-preview-wrap am-full">
                  <img
                    className="am-image-preview"
                    src={doctorPreview}
                    alt="Doctor preview"
                  />
                  <button
                    type="button"
                    className="am-button am-secondary"
                    onClick={() => {
                      setDoctorFile(null);
                      setDoctorPreview("");
                      setDoctorForm({ ...doctorForm, image_url: "" });
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              )}

              <label className="am-full">
                Description
                <textarea
                  rows="3"
                  value={doctorForm.description}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, description: e.target.value })
                  }
                />
              </label>

              <label className="am-checkbox">
                <input
                  type="checkbox"
                  checked={doctorForm.is_active}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, is_active: e.target.checked })
                  }
                />
                Active doctor
              </label>
            </div>

            <div className="am-form-actions">
              <button
                className="am-button am-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingDoctor
                    ? "Update Doctor"
                    : "Add Doctor"}
              </button>

              {editingDoctor && (
                <button
                  type="button"
                  className="am-button am-secondary"
                  onClick={resetDoctorForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="am-card-grid">
            {doctors.map((doctor) => (
              <article className="am-person-card" key={doctor.id}>
                {doctor.image_url ? (
                  <img src={doctor.image_url} alt={doctor.name} />
                ) : (
                  <div className="am-image-placeholder">Doctor</div>
                )}

                <div className="am-person-content">
                  <div className="am-card-title">
                    <h3>{doctor.name}</h3>
                    <span
                      className={`am-status ${
                        doctor.is_active ? "confirmed" : "cancelled"
                      }`}
                    >
                      {doctor.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p>{doctor.qualification}</p>
                  <p>{doctor.specialization}</p>
                  <p>{doctor.experience || 0} years experience</p>

                  <div className="am-card-actions">
                    <button
                      type="button"
                      className="am-button am-secondary"
                      onClick={() => editDoctor(doctor)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="am-button am-secondary"
                      disabled={saving}
                      onClick={() => toggleDoctor(doctor)}
                    >
                      {doctor.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {doctors.length === 0 && (
              <p className="am-empty">No doctors added yet.</p>
            )}
          </div>
        </>
      )}

      {/* SERVICES */}

      {section === "services" && (
        <>
          <form className="am-panel am-form" onSubmit={saveService}>
            <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>

            <div className="am-form-grid">
              <label>
                Service name
                <input
                  required
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                />
              </label>

              <label>
                Duration (minutes)
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={serviceForm.duration_minutes}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      duration_minutes: e.target.value,
                    })
                  }
                />
              </label>

              <label className="am-full">
                Service image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleServiceFile}
                />
                <small>Choose an image from your computer. Maximum 5 MB.</small>
              </label>

              {servicePreview && (
                <div className="am-image-preview-wrap am-full">
                  <img
                    className="am-image-preview"
                    src={servicePreview}
                    alt="Service preview"
                  />
                  <button
                    type="button"
                    className="am-button am-secondary"
                    onClick={() => {
                      setServiceFile(null);
                      setServicePreview("");
                      setServiceForm({ ...serviceForm, image_url: "" });
                    }}
                  >
                    Remove image
                  </button>
                </div>
              )}

              <label className="am-full">
                Description
                <textarea
                  rows="3"
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                />
              </label>

              <label className="am-checkbox">
                <input
                  type="checkbox"
                  checked={serviceForm.is_active}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      is_active: e.target.checked,
                    })
                  }
                />
                Active service
              </label>
            </div>

            <div className="am-form-actions">
              <button
                className="am-button am-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingService
                    ? "Update Service"
                    : "Add Service"}
              </button>

              {editingService && (
                <button
                  type="button"
                  className="am-button am-secondary"
                  onClick={resetServiceForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="am-card-grid">
            {services.map((service) => (
              <article className="am-person-card" key={service.id}>
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} />
                ) : (
                  <div className="am-image-placeholder">Service</div>
                )}

                <div className="am-person-content">
                  <div className="am-card-title">
                    <h3>{service.name}</h3>
                    <span
                      className={`am-status ${
                        service.is_active ? "confirmed" : "cancelled"
                      }`}
                    >
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p>{service.description || "No description added."}</p>
                  <p>{service.duration_minutes} minutes</p>

                  <div className="am-card-actions">
                    <button
                      type="button"
                      className="am-button am-secondary"
                      onClick={() => editService(service)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="am-button am-secondary"
                      disabled={saving}
                      onClick={() => toggleService(service)}
                    >
                      {service.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {services.length === 0 && (
              <p className="am-empty">No services added yet.</p>
            )}
          </div>
        </>
      )}

      {/* SETTINGS */}

      {section === "settings" && (
        <div className="am-settings-stack">
          {/* WORKING HOURS */}

          <div className="am-panel am-form">
            <div className="am-panel-heading">
              <div>
                <h3>Clinic working hours</h3>
                <p>Set the opening and closing time for each day.</p>
              </div>

              <button
                type="button"
                className="am-button am-primary"
                onClick={saveClinicHours}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save hours"}
              </button>
            </div>

            <div className="am-hours-list">
              {clinicHours.map((item) => (
                <div className="am-hour-row" key={item.day_of_week}>
                  <strong>{DAYS[Number(item.day_of_week)]}</strong>

                  <label className="am-checkbox">
                    <input
                      type="checkbox"
                      checked={item.is_open}
                      onChange={(e) =>
                        changeClinicHour(
                          item.day_of_week,
                          "is_open",
                          e.target.checked
                        )
                      }
                    />
                    Open
                  </label>

                  <label>
                    Opens
                    <input
                      type="time"
                      disabled={!item.is_open}
                      value={item.open_time?.slice(0, 5) || "09:00"}
                      onChange={(e) =>
                        changeClinicHour(
                          item.day_of_week,
                          "open_time",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Closes
                    <input
                      type="time"
                      disabled={!item.is_open}
                      value={item.close_time?.slice(0, 5) || "20:30"}
                      onChange={(e) =>
                        changeClinicHour(
                          item.day_of_week,
                          "close_time",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* BREAK TIMES */}

          <div className="am-panel am-form">
            <h3>Break times</h3>
            <p className="am-help">
              Add recurring breaks for a particular day of the week.
            </p>

            <form className="am-inline-form" onSubmit={addBreak}>
              <label>
                Day
                <select
                  value={breakForm.day_of_week}
                  onChange={(e) =>
                    setBreakForm({
                      ...breakForm,
                      day_of_week: e.target.value,
                    })
                  }
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </label>

              <label>
                Break name
                <input
                  required
                  value={breakForm.break_name}
                  onChange={(e) =>
                    setBreakForm({
                      ...breakForm,
                      break_name: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Start
                <input
                  type="time"
                  required
                  value={breakForm.start_time}
                  onChange={(e) =>
                    setBreakForm({
                      ...breakForm,
                      start_time: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                End
                <input
                  type="time"
                  required
                  value={breakForm.end_time}
                  onChange={(e) =>
                    setBreakForm({
                      ...breakForm,
                      end_time: e.target.value,
                    })
                  }
                />
              </label>

              <button
                type="submit"
                className="am-button am-primary"
                disabled={saving}
              >
                Add break
              </button>
            </form>

            <div className="am-simple-list">
              {clinicBreaks.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.break_name}</strong> ·{" "}
                    {DAYS[Number(item.day_of_week)]} ·{" "}
                    {item.start_time?.slice(0, 5)}–
                    {item.end_time?.slice(0, 5)}
                  </span>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteBreak(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {clinicBreaks.length === 0 && (
                <p className="am-empty">No break times configured.</p>
              )}
            </div>
          </div>

          {/* HOLIDAYS */}

          <div className="am-panel am-form">
            <h3>Clinic holidays</h3>
            <p className="am-help">
              The selected date should be unavailable for all appointment bookings.
            </p>

            <form className="am-inline-form" onSubmit={addHoliday}>
              <label>
                Date
                <input
                  type="date"
                  min={getToday()}
                  required
                  value={holidayForm.holiday_date}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      holiday_date: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Holiday name
                <input
                  required
                  value={holidayForm.holiday_name}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      holiday_name: e.target.value,
                    })
                  }
                />
              </label>

              <button
                type="submit"
                className="am-button am-primary"
                disabled={saving}
              >
                Add holiday
              </button>
            </form>

            <div className="am-simple-list">
              {holidays.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.holiday_name}</strong> ·{" "}
                    {item.holiday_date}
                  </span>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteHoliday(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {holidays.length === 0 && (
                <p className="am-empty">No holidays added.</p>
              )}
            </div>
          </div>

          {/* BLOCKED SLOTS */}

          <div className="am-panel am-form">
            <h3>Block appointment slots</h3>
            <p className="am-help">
              Use this for doctor leave, clinic events or temporary unavailable times.
            </p>

            <form className="am-inline-form" onSubmit={addBlockedSlot}>
              <label>
                Date
                <input
                  type="date"
                  min={getToday()}
                  required
                  value={blockedForm.blocked_date}
                  onChange={(e) =>
                    setBlockedForm({
                      ...blockedForm,
                      blocked_date: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Start
                <input
                  type="time"
                  required
                  value={blockedForm.start_time}
                  onChange={(e) =>
                    setBlockedForm({
                      ...blockedForm,
                      start_time: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                End
                <input
                  type="time"
                  required
                  value={blockedForm.end_time}
                  onChange={(e) =>
                    setBlockedForm({
                      ...blockedForm,
                      end_time: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Reason
                <input
                  value={blockedForm.reason}
                  onChange={(e) =>
                    setBlockedForm({
                      ...blockedForm,
                      reason: e.target.value,
                    })
                  }
                />
              </label>

              <button
                type="submit"
                className="am-button am-primary"
                disabled={saving}
              >
                Block time
              </button>
            </form>

            <div className="am-simple-list">
              {blockedSlots.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.blocked_date}</strong> ·{" "}
                    {item.start_time?.slice(0, 5)}–
                    {item.end_time?.slice(0, 5)} ·{" "}
                    {item.reason || "Unavailable"}
                  </span>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteBlockedSlot(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {blockedSlots.length === 0 && (
                <p className="am-empty">No blocked slots.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminManagement;