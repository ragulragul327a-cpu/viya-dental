
import { supabase } from "../lib/supabase";

// Convert the local date to YYYY-MM-DD
function getTodayDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Check database errors
function checkError(error) {
  if (error) {
    throw new Error(error.message);
  }
}

// =====================================
// DASHBOARD OVERVIEW
// =====================================

export async function getDashboardData() {
  const today = getTodayDate();

  const [
    appointmentsResult,
    todayResult,
    pendingResult,
    patientsResult,
    doctorsResult,
    servicesResult
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", today)
      .in("status", ["pending", "confirmed"]),

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("patients")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("doctors")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
  ]);

  checkError(appointmentsResult.error);
  checkError(todayResult.error);
  checkError(pendingResult.error);
  checkError(patientsResult.error);
  checkError(doctorsResult.error);
  checkError(servicesResult.error);

  const { data: recentAppointments, error: recentError } =
    await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        patients (
          full_name,
          phone
        ),
        doctors (
          name
        ),
        services (
          name
        )
      `)
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(8);

  checkError(recentError);

  return {
    totalAppointments: appointmentsResult.count ?? 0,
    todayAppointments: todayResult.count ?? 0,
    pendingAppointments: pendingResult.count ?? 0,
    totalPatients: patientsResult.count ?? 0,
    activeDoctors: doctorsResult.count ?? 0,
    activeServices: servicesResult.count ?? 0,
    recentAppointments: recentAppointments ?? []
  };
}

// =====================================
// APPOINTMENT MANAGEMENT
// =====================================

export async function getAppointments({
  date = "",
  status = "",
  search = ""
} = {}) {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        full_name,
        email,
        phone
      ),
      doctors (
        id,
        name
      ),
      services (
        id,
        name
      )
    `)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: true });

  if (date) {
    query = query.eq("appointment_date", date);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  checkError(error);

  let results = data ?? [];

  if (search.trim()) {
    const keyword = search.toLowerCase();

    results = results.filter((item) =>
      [
        item.patients?.full_name,
        item.patients?.phone,
        item.patients?.email,
        item.services?.name,
        item.doctors?.name
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }

  return results;
}

export async function updateAppointmentStatus(id, status) {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show"
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid appointment status.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  checkError(error);

  return data;
}

export async function rescheduleAppointment(
  id,
  appointmentDate,
  startTime,
  endTime
) {
  if (!appointmentDate || !startTime || !endTime) {
    throw new Error("Please provide a date and appointment time.");
  }

  if (endTime <= startTime) {
    throw new Error("End time must be after start time.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime
    })
    .eq("id", id)
    .in("status", ["pending", "confirmed"])
    .select()
    .single();

  checkError(error);

  return data;
}

// =====================================
// PATIENT MANAGEMENT
// =====================================

export async function getPatients(search = "") {
  let query = supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (search.trim()) {
    const keyword = `%${search.trim()}%`;

    query = query.or(
      `full_name.ilike.${keyword},email.ilike.${keyword},phone.ilike.${keyword}`
    );
  }

  const { data, error } = await query;

  checkError(error);

  return data ?? [];
}

// =====================================
// DOCTOR MANAGEMENT
// =====================================

export async function getDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("created_at", { ascending: false });

  checkError(error);

  return data ?? [];
}

export async function saveDoctor(doctor) {
  const { id, ...details } = doctor;

  const query = id
    ? supabase.from("doctors").update(details).eq("id", id)
    : supabase.from("doctors").insert(details);

  const { data, error } = await query.select().single();

  checkError(error);

  return data;
}

export async function deleteDoctor(id) {
  const { error } = await supabase
    .from("doctors")
    .update({ is_active: false })
    .eq("id", id);

  checkError(error);
}

// =====================================
// SERVICE MANAGEMENT
// =====================================

export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  checkError(error);

  return data ?? [];
}

export async function saveService(service) {
  const { id, ...details } = service;

  const query = id
    ? supabase.from("services").update(details).eq("id", id)
    : supabase.from("services").insert(details);

  const { data, error } = await query.select().single();

  checkError(error);

  return data;
}

export async function deleteService(id) {
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id);

  checkError(error);
}

// =====================================
// CLINIC SETTINGS
// =====================================

export async function getClinicHours() {
  const { data, error } = await supabase
    .from("clinic_hours")
    .select("*")
    .order("day_of_week");

  checkError(error);

  return data ?? [];
}

export async function saveClinicHours(id, details) {
  const { data, error } = await supabase
    .from("clinic_hours")
    .update(details)
    .eq("id", id)
    .select()
    .single();

  checkError(error);

  return data;
}

export async function getClinicBreaks() {
  const { data, error } = await supabase
    .from("clinic_breaks")
    .select("*")
    .order("day_of_week")
    .order("start_time");

  checkError(error);

  return data ?? [];
}

export async function saveClinicBreak(details) {
  const { id, ...values } = details;

  const query = id
    ? supabase.from("clinic_breaks").update(values).eq("id", id)
    : supabase.from("clinic_breaks").insert(values);

  const { data, error } = await query.select().single();

  checkError(error);

  return data;
}

export async function deleteClinicBreak(id) {
  const { error } = await supabase
    .from("clinic_breaks")
    .delete()
    .eq("id", id);

  checkError(error);
}

// =====================================
// HOLIDAY MANAGEMENT
// =====================================

export async function getHolidays() {
  const { data, error } = await supabase
    .from("clinic_holidays")
    .select("*")
    .order("holiday_date");

  checkError(error);

  return data ?? [];
}

export async function saveHoliday(details) {
  const { id, ...values } = details;

  const query = id
    ? supabase.from("clinic_holidays").update(values).eq("id", id)
    : supabase.from("clinic_holidays").insert(values);

  const { data, error } = await query.select().single();

  checkError(error);

  return data;
}

export async function deleteHoliday(id) {
  const { error } = await supabase
    .from("clinic_holidays")
    .delete()
    .eq("id", id);

  checkError(error);
}

// =====================================
// BLOCKED SLOTS
// =====================================

export async function getBlockedSlots() {
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .order("blocked_date")
    .order("start_time");

  checkError(error);

  return data ?? [];
}

export async function saveBlockedSlot(details) {
  const { id, ...values } = details;

  const query = id
    ? supabase.from("blocked_slots").update(values).eq("id", id)
    : supabase.from("blocked_slots").insert(values);

  const { data, error } = await query.select().single();

  checkError(error);

  return data;
}

export async function deleteBlockedSlot(id) {
  const { error } = await supabase
    .from("blocked_slots")
    .delete()
    .eq("id", id);

  checkError(error);
}

// =====================================
// CONTACT ENQUIRIES
// =====================================

export async function getEnquiries() {
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  checkError(error);

  return data ?? [];
}

export async function updateEnquiryStatus(id, status) {
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  checkError(error);

  return data;
}
