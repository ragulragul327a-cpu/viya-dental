
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  UserRound,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  LockKeyhole,
  Stethoscope,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Appointment.css";

const CLINIC_NAME = "Viya Dental";
const CLINIC_LOCATION = "Perungudi, Chennai";

const CLINIC_MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Viya+Dental+Perungudi+Chennai";

const CLINIC_PHONE = "";

const FALLBACK_TREATMENTS = [
  "General Checkup",
  "Cleaning",
  "Tooth Pain / Emergency",
  "Root Canal",
  "Braces",
  "Implant",
  "Kids Dentistry",
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function timeToMinutes(value) {
  if (!value) return 0;

  const [hours, minutes] = String(value).split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");

  return `${hours}:${minutes}:00`;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function createGoogleCalendarUrl(booking) {
  const start = new Date(
    `${booking.date}T${minutesToTime(booking.start)}`
  );

  const end = new Date(
    `${booking.date}T${minutesToTime(booking.end)}`
  );

  const toGoogleDate = (date) =>
    date.toISOString().replace(/-|:|\.\d{3}/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Dental Appointment - ${CLINIC_NAME}`,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details: `Booking ID: ${booking.bookingId}\nDentist: ${booking.dentist}\nTreatment: ${booking.treatment}`,
    location: `${CLINIC_NAME}, ${CLINIC_LOCATION}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function Appointment() {
  const location = useLocation();
  const today = getLocalDateString();

  // Service passed from Services.jsx
  const requestedService = location.state?.service || "";

  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [treatment, setTreatment] = useState("");
  const [doctorId, setDoctorId] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  const [clinicHours, setClinicHours] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");

  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);

  const [patient, setPatient] = useState({
    fullName: "",
    phone: "",
    age: "",
    email: "",
    reason: "",
  });

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === doctorId
  );

  const selectedHoliday = holidays.find(
    (holiday) => holiday.holiday_date === date
  );

  const selectedDateObject = new Date(`${date}T00:00:00`);
  const dayOfWeek = selectedDateObject.getDay();

  const todayIsSelected = date === today;

  const currentMinutes =
    new Date().getHours() * 60 + new Date().getMinutes();

  const isClinicClosed =
    Boolean(selectedHoliday) ||
    (clinicHours !== null && clinicHours.is_open === false);

  const openingMinutes = clinicHours
    ? timeToMinutes(clinicHours.open_time)
    : dayOfWeek === 0
      ? 10 * 60
      : 9 * 60;

  const closingMinutes = clinicHours
    ? timeToMinutes(clinicHours.close_time)
    : dayOfWeek === 0
      ? 14 * 60
      : 20 * 60 + 30;

  // Load active doctors and services
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);

      const [doctorResult, serviceResult] = await Promise.all([
        supabase
          .from("doctors")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("services")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (!active) return;

      if (doctorResult.error) {
        console.error("Doctor list error:", doctorResult.error);
      } else {
        setDoctors(doctorResult.data || []);
      }

      if (serviceResult.error) {
        console.error("Service list error:", serviceResult.error);
      } else {
        setServices(serviceResult.data || []);
      }

      setLoadingOptions(false);
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // Automatically select the service received from Services.jsx
  useEffect(() => {
    if (!requestedService || services.length === 0) return;

    const matchingService = services.find(
      (service) =>
        service.name.trim().toLowerCase() ===
        requestedService.trim().toLowerCase()
    );

    if (matchingService) {
      setTreatment(matchingService.name);
      setEmergencyMode(false);
      setShowEmergencyForm(false);
      setError("");
    } else {
      console.warn(
        `Requested service "${requestedService}" was not found in active services.`
      );
    }
  }, [requestedService, services]);

  // Load availability for the selected date
  async function loadAvailability(selectedDate) {
    if (!selectedDate) return;

    setLoadingAvailability(true);
    setAvailabilityError("");

    try {
      const selectedDay = new Date(
        `${selectedDate}T00:00:00`
      ).getDay();

      const [
        hoursResult,
        breaksResult,
        holidaysResult,
        blockedResult,
        appointmentsResult,
      ] = await Promise.all([
        supabase
          .from("clinic_hours")
          .select("day_of_week, open_time, close_time, is_open")
          .eq("day_of_week", selectedDay)
          .maybeSingle(),

        supabase
          .from("clinic_breaks")
          .select("id, day_of_week, break_name, start_time, end_time")
          .eq("day_of_week", selectedDay),

        supabase
          .from("clinic_holidays")
          .select("id, holiday_date, holiday_name")
          .eq("holiday_date", selectedDate),

        supabase
          .from("blocked_slots")
          .select(
            "id, blocked_date, start_time, end_time, reason, doctor_id"
          )
          .eq("blocked_date", selectedDate),

        supabase
          .from("appointments")
          .select("id, doctor_id, start_time, end_time, status")
          .eq("appointment_date", selectedDate)
          .in("status", ["pending", "confirmed"]),
      ]);

      const results = [
        hoursResult,
        breaksResult,
        holidaysResult,
        blockedResult,
        appointmentsResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      setClinicHours(hoursResult.data || null);
      setBreaks(breaksResult.data || []);
      setHolidays(holidaysResult.data || []);
      setBlockedSlots(blockedResult.data || []);
      setAppointments(appointmentsResult.data || []);
    } catch (loadError) {
      console.error("Availability loading error:", loadError);

      setAvailabilityError(
        loadError.message ||
          "Unable to load appointment availability. Please refresh and try again."
      );

      setClinicHours(null);
      setBreaks([]);
      setHolidays([]);
      setBlockedSlots([]);
      setAppointments([]);
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    setSelectedSlot(null);
    loadAvailability(date);

    // Reload availability whenever the selected date changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function updatePatient(event) {
    const { name, value } = event.target;

    setPatient((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleDateChange(event) {
    setDate(event.target.value);
    setSelectedSlot(null);
    setBooking(null);
    setError("");
  }

  // Determine whether a time slot is available
  function getSlotStatus(slot) {
    if (isClinicClosed) return "Closed";

    if (
      breaks.some((item) =>
        overlaps(
          slot.start,
          slot.end,
          timeToMinutes(item.start_time),
          timeToMinutes(item.end_time)
        )
      )
    ) {
      return "Break";
    }

    if (
      blockedSlots.some((item) => {
        const appliesToDoctor =
          !item.doctor_id ||
          !doctorId ||
          item.doctor_id === doctorId;

        return (
          appliesToDoctor &&
          overlaps(
            slot.start,
            slot.end,
            timeToMinutes(item.start_time),
            timeToMinutes(item.end_time)
          )
        );
      })
    ) {
      return "Blocked";
    }

    if (
      appointments.some((item) => {
        const appliesToDoctor =
          !doctorId ||
          !item.doctor_id ||
          item.doctor_id === doctorId;

        return (
          appliesToDoctor &&
          overlaps(
            slot.start,
            slot.end,
            timeToMinutes(item.start_time),
            timeToMinutes(item.end_time)
          )
        );
      })
    ) {
      return "Booked";
    }

    if (todayIsSelected && slot.start <= currentMinutes) {
      return "Passed";
    }

    return "Available";
  }

  // Generate 15-minute slots within clinic working hours
  const availableSlots = useMemo(() => {
    if (!date || closingMinutes <= openingMinutes) return [];

    const slots = [];

    for (
      let start = openingMinutes;
      start + 15 <= closingMinutes;
      start += 15
    ) {
      slots.push({
        start,
        end: start + 15,
        label: formatTimeRange(start, start + 15),
      });
    }

    return slots;
  }, [date, openingMinutes, closingMinutes]);

  function selectSlot(slot) {
    const status = getSlotStatus(slot);

    if (
      status !== "Available" ||
      saving ||
      loadingAvailability
    ) {
      return;
    }

    setSelectedSlot(slot);
    setError("");
  }

  // Refresh and validate availability immediately before booking
  async function refreshAndValidateSelectedSlot() {
    const selectedDay = new Date(`${date}T00:00:00`).getDay();

    const [
      hoursResult,
      breaksResult,
      holidaysResult,
      blockedResult,
      appointmentsResult,
    ] = await Promise.all([
      supabase
        .from("clinic_hours")
        .select("day_of_week, open_time, close_time, is_open")
        .eq("day_of_week", selectedDay)
        .maybeSingle(),

      supabase
        .from("clinic_breaks")
        .select("id, day_of_week, break_name, start_time, end_time")
        .eq("day_of_week", selectedDay),

      supabase
        .from("clinic_holidays")
        .select("id, holiday_date, holiday_name")
        .eq("holiday_date", date),

      supabase
        .from("blocked_slots")
        .select(
          "id, blocked_date, start_time, end_time, reason, doctor_id"
        )
        .eq("blocked_date", date),

      supabase
        .from("appointments")
        .select("id, doctor_id, start_time, end_time, status")
        .eq("appointment_date", date)
        .in("status", ["pending", "confirmed"]),
    ]);

    const results = [
      hoursResult,
      breaksResult,
      holidaysResult,
      blockedResult,
      appointmentsResult,
    ];

    const failedResult = results.find((result) => result.error);

    if (failedResult) throw failedResult.error;

    const freshData = {
      hours: hoursResult.data,
      breaks: breaksResult.data || [],
      holidays: holidaysResult.data || [],
      blockedSlots: blockedResult.data || [],
      appointments: appointmentsResult.data || [],
    };

    setClinicHours(freshData.hours || null);
    setBreaks(freshData.breaks);
    setHolidays(freshData.holidays);
    setBlockedSlots(freshData.blockedSlots);
    setAppointments(freshData.appointments);

    const holiday = freshData.holidays.find(
      (item) => item.holiday_date === date
    );

    if (holiday || freshData.hours?.is_open === false) {
      throw new Error(
        holiday
          ? `The clinic is closed for ${holiday.holiday_name || "a holiday"} on this date. Please choose another date.`
          : "The clinic is closed on the selected date. Please choose another date."
      );
    }

    const slot = selectedSlot;

    if (!slot) {
      throw new Error("Please select an appointment time.");
    }

    const actualOpening = freshData.hours
      ? timeToMinutes(freshData.hours.open_time)
      : selectedDay === 0
        ? 10 * 60
        : 9 * 60;

    const actualClosing = freshData.hours
      ? timeToMinutes(freshData.hours.close_time)
      : selectedDay === 0
        ? 14 * 60
        : 20 * 60 + 30;

    if (
      slot.start < actualOpening ||
      slot.end > actualClosing
    ) {
      throw new Error(
        "The selected time is outside clinic working hours. Please choose another slot."
      );
    }

    const breakConflict = freshData.breaks.some((item) =>
      overlaps(
        slot.start,
        slot.end,
        timeToMinutes(item.start_time),
        timeToMinutes(item.end_time)
      )
    );

    const blockedConflict = freshData.blockedSlots.some((item) => {
      const appliesToDoctor =
        !item.doctor_id ||
        !doctorId ||
        item.doctor_id === doctorId;

      return (
        appliesToDoctor &&
        overlaps(
          slot.start,
          slot.end,
          timeToMinutes(item.start_time),
          timeToMinutes(item.end_time)
        )
      );
    });

    const appointmentConflict = freshData.appointments.some((item) => {
      const appliesToDoctor =
        !doctorId ||
        !item.doctor_id ||
        item.doctor_id === doctorId;

      return (
        appliesToDoctor &&
        overlaps(
          slot.start,
          slot.end,
          timeToMinutes(item.start_time),
          timeToMinutes(item.end_time)
        )
      );
    });

    const isPast =
      date === getLocalDateString() &&
      slot.start <=
        new Date().getHours() * 60 + new Date().getMinutes();

    if (
      breakConflict ||
      blockedConflict ||
      appointmentConflict ||
      isPast
    ) {
      throw new Error(
        "This time slot is no longer available. Please select another slot."
      );
    }

    return freshData;
  }

  // Submit appointment
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (saving) return;

    if (!treatment) {
      setError("Please select a treatment.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select an available appointment time.");
      return;
    }

    if (!patient.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(patient.phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (
      !patient.age ||
      Number(patient.age) < 1 ||
      Number(patient.age) > 120
    ) {
      setError("Please enter a valid age.");
      return;
    }

    const email = patient.email.trim();

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError("Please enter a valid email address or leave it empty.");
      return;
    }

    if (date < getLocalDateString()) {
      setError("Please select today or a future date.");
      return;
    }

    setSaving(true);

    try {
      // Recheck availability before creating the booking.
      await refreshAndValidateSelectedSlot();

      const selectedService = services.find(
        (service) => service.name === treatment
      );

      if (!selectedService) {
        throw new Error(
          "The selected service is no longer available. Please select another service."
        );
      }

      // Create patient record
      const { data: patientRecord, error: patientError } =
        await supabase
          .from("patients")
          .insert({
            full_name: patient.fullName.trim(),
            email: email || null,
            phone: patient.phone.trim(),
          })
          .select("id")
          .single();

      if (patientError) throw patientError;

      const appointmentNotes = [
        `Age: ${patient.age}`,
        `Treatment: ${treatment}`,
        `Preferred Dentist: ${selectedDoctor?.name || "Any Available Dentist"}`,
        `Emergency Request: ${emergencyMode ? "Yes" : "No"}`,
        patient.reason.trim()
          ? `Patient Concern: ${patient.reason.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Create appointment record
      const {
        data: appointmentRecord,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientRecord.id,
          doctor_id: doctorId || null,
          service_id: selectedService.id,
          appointment_date: date,
          start_time: minutesToTime(selectedSlot.start),
          end_time: minutesToTime(selectedSlot.end),
          status: "pending",
          notes: appointmentNotes,
        })
        .select("id")
        .single();

      if (appointmentError) throw appointmentError;

      const newBooking = {
        bookingId: appointmentRecord.id,
        token: appointmentRecord.id.slice(0, 8).toUpperCase(),
        date,
        start: selectedSlot.start,
        end: selectedSlot.end,
        treatment,
        dentist: selectedDoctor?.name || "Any Available Dentist",
        patient: { ...patient, email },
        emergency: emergencyMode,
      };

      setBooking(newBooking);
      setSelectedSlot(null);

      await loadAvailability(date);
    } catch (err) {
      console.error("Appointment booking error:", err);

      setError(
        err.message ||
          "Unable to submit your appointment. Please try again."
      );

      await loadAvailability(date);
    } finally {
      setSaving(false);
    }
  }

  function resetBooking() {
    setBooking(null);
    setSelectedSlot(null);

    setPatient({
      fullName: "",
      phone: "",
      age: "",
      email: "",
      reason: "",
    });

    // Keep the service selected when arriving from the Services page.
    setTreatment(requestedService);
    setDoctorId("");
    setEmergencyMode(false);
    setShowEmergencyForm(false);
    setError("");

    loadAvailability(date);
  }

  return (
    <div className="appointment-page">

      <div className="appointment-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <span>Appointment Booking</span>
      </div>

      {booking ? (

        <section className="booking-success">

          <div className="success-icon">
            <CheckCircle2 size={35} />
          </div>

          <span className="success-eyebrow">
            APPOINTMENT DETAILS
          </span>

          <h1>Your Appointment Request Has Been Submitted</h1>

          <p className="success-description">
            Your appointment request has been saved successfully.
            Our clinic team will review and confirm your visit.
          </p>

          <div className="booking-ticket">

            <div className="ticket-token">
              <span>BOOKING REFERENCE</span>
              <strong>{booking.token}</strong>
            </div>

            <div className="ticket-details">

              <div>
                <span>Booking ID</span>
                <strong>{booking.bookingId}</strong>
              </div>

              <div>
                <span>Appointment Date</span>
                <strong>{formatDate(booking.date)}</strong>
              </div>

              <div>
                <span>Appointment Time</span>
                <strong>
                  {formatTimeRange(booking.start, booking.end)}
                </strong>
              </div>

              <div>
                <span>Dentist</span>
                <strong>{booking.dentist}</strong>
              </div>

              <div>
                <span>Treatment</span>
                <strong>{booking.treatment}</strong>
              </div>

              <div>
                <span>Patient</span>
                <strong>{booking.patient.fullName}</strong>
              </div>

            </div>
          </div>

          <div className="arrival-note">
            <Clock3 size={17} />
            Please arrive 10 minutes before your appointment time.
          </div>

          <div className="success-address">
            <MapPin size={17} />
            <div>
              <strong>{CLINIC_NAME}</strong>
              <span>{CLINIC_LOCATION}</span>
            </div>
          </div>

          <div className="success-actions">

            <a
              href={createGoogleCalendarUrl(booking)}
              target="_blank"
              rel="noreferrer"
              className="calendar-action"
            >
              <CalendarDays size={17} />
              Add to Google Calendar
            </a>

            <a
              href={CLINIC_MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="map-action"
            >
              <MapPin size={17} />
              View Clinic Location
            </a>

          </div>

          <button
            type="button"
            className="new-booking-button"
            onClick={resetBooking}
          >
            Book Another Appointment
          </button>

          <p className="demo-disclaimer">
            Your appointment request has been submitted successfully.
            Our clinic team will review and confirm your appointment.
          </p>

        </section>

      ) : (

        <div className="appointment-layout">

          {/* LEFT INFORMATION SECTION */}
          <section className="appointment-information">

            <div className="appointment-eyebrow">
              <span></span>
              INSTANT ONLINE SCHEDULING • PERUNGUDI, CHENNAI
            </div>

            <h1>
              Book Your Dental
              <span>Appointment</span>
            </h1>

            <p className="appointment-intro-text">
              Choose your preferred specialist, treatment, and
              consultation time slot. Our clinic reception will
              confirm your visit.
            </p>

            <div className="appointment-benefits">

              <article className="benefit-card">
                <div className="benefit-icon">
                  <Clock3 size={21} />
                </div>

                <div>
                  <h3>Zero Waiting Time Policy</h3>
                  <p>
                    Pre-scheduled slots reserved for you. Your appointment
                    is planned around your selected time.
                  </p>
                </div>
              </article>

              <article className="benefit-card">
                <div className="benefit-icon">
                  <Stethoscope size={21} />
                </div>

                <div>
                  <h3>Consult with Dental Specialists</h3>
                  <p>
                    Choose your preferred dentist or let our reception
                    team find an available specialist.
                  </p>
                </div>
              </article>

              <article className="benefit-card">
                <div className="benefit-icon">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h3>Patient-First Clinical Care</h3>
                  <p>
                    Clear treatment discussions and a focus on patient
                    comfort throughout your visit.
                  </p>
                </div>
              </article>

              <article className="benefit-card">
                <div className="benefit-icon">
                  <ClipboardList size={21} />
                </div>

                <div>
                  <h3>Transparent Treatment Information</h3>
                  <p>
                    Understand your treatment options and expected costs
                    before proceeding.
                  </p>
                </div>
              </article>

            </div>

            {/* EMERGENCY PANEL */}
            <div className="emergency-panel">

              <div className="emergency-heading">
                <AlertTriangle size={18} />
                <h3>Need Immediate Dental Assistance?</h3>
              </div>

              <p>
                For severe pain, swelling, bleeding, or a broken tooth,
                contact the clinic immediately.
              </p>

              <div className="emergency-actions">

                {CLINIC_PHONE ? (
                  <a
                    href={`tel:${CLINIC_PHONE}`}
                    className="emergency-call"
                  >
                    <Phone size={16} />
                    Call Clinic Now
                  </a>
                ) : (
                  <span className="emergency-contact-note">
                    Clinic phone number to be confirmed
                  </span>
                )}

                <button
                  type="button"
                  className="emergency-request"
                  onClick={() => {
                    setEmergencyMode(true);
                    setShowEmergencyForm(true);

                    setTreatment(
                      services.some(
                        (item) => item.name === "Tooth Pain / Emergency"
                      )
                        ? "Tooth Pain / Emergency"
                        : ""
                    );

                    setSelectedSlot(null);

                    document
                      .querySelector(".appointment-form-card")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Request Emergency Token
                  <ArrowRight size={15} />
                </button>

              </div>

              <div className="emergency-warning">
                Emergency token availability is subject to clinic
                confirmation. Severe symptoms require immediate
                contact with the clinic.
              </div>

            </div>

            <div className="specialist-highlight">

              <div className="specialist-avatar">
                <Stethoscope size={24} />
              </div>

              <div>
                <span>PERSONALISED DENTAL CONSULTATION</span>
                <strong>Find the Right Specialist</strong>
                <p>
                  Choose a dentist based on your treatment needs.
                </p>
              </div>

            </div>

          </section>

          {/* APPOINTMENT FORM */}
          <section className="appointment-form-card">

            <div className="form-card-heading">

              <div>
                <h2>Patient Appointment Details</h2>
                <p>
                  Fill out the information below to schedule your consultation.
                </p>
              </div>

              <div className="form-heading-icon">
                <CalendarDays size={21} />
              </div>

            </div>

            {emergencyMode && showEmergencyForm && (
              <div className="emergency-mode-banner">

                <AlertTriangle size={17} />

                <div>
                  <strong>Emergency request selected</strong>
                  <span>
                    Your request will need confirmation from clinic staff.
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Close emergency mode"
                  onClick={() => {
                    setEmergencyMode(false);
                    setShowEmergencyForm(false);
                    setTreatment("");
                  }}
                >
                  <X size={17} />
                </button>

              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* PATIENT NAME */}
              <div className="form-field full-width">

                <label htmlFor="fullName">
                  Full Name <span>*</span>
                </label>

                <div className="input-with-icon">
                  <UserRound size={17} />

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={patient.fullName}
                    onChange={updatePatient}
                    required
                    disabled={saving}
                  />
                </div>

              </div>

              {/* PHONE AND AGE */}
              <div className="form-row">

                <div className="form-field">

                  <label htmlFor="phone">
                    Mobile Number <span>*</span>
                  </label>

                  <div className="phone-input">
                    <span>+91</span>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={patient.phone}
                      onChange={updatePatient}
                      required
                      disabled={saving}
                    />
                  </div>

                  <small>Enter your 10-digit mobile number.</small>

                </div>

                <div className="form-field">

                  <label htmlFor="age">
                    Age <span>*</span>
                  </label>

                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Your age"
                    value={patient.age}
                    onChange={updatePatient}
                    required
                    disabled={saving}
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div className="form-field full-width">

                <label htmlFor="email">
                  Email Address (Optional)
                </label>

                <div className="input-with-icon">
                  <Mail size={17} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={patient.email}
                    onChange={updatePatient}
                    disabled={saving}
                    autoComplete="email"
                  />
                </div>

                <small>
                  You can leave this field empty and continue booking.
                </small>

              </div>

              {/* SERVICE AND DENTIST */}
              <div className="form-row">

                <div className="form-field">

                  <label htmlFor="treatment">
                    Select Service <span>*</span>
                  </label>

                  <select
                    id="treatment"
                    value={treatment}
                    onChange={(event) => setTreatment(event.target.value)}
                    required
                    disabled={saving || loadingOptions}
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading services..."
                        : "Choose a dental service"}
                    </option>

                    {(services.length > 0
                      ? services.map((item) => item.name)
                      : FALLBACK_TREATMENTS
                    ).map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}

                  </select>

                </div>

                <div className="form-field">

                  <label htmlFor="dentist">
                    Select Dentist <span>*</span>
                  </label>

                  <select
                    id="dentist"
                    value={doctorId}
                    onChange={(event) => {
                      setDoctorId(event.target.value);
                      setSelectedSlot(null);
                    }}
                    disabled={saving || loadingOptions}
                  >
                    <option value="">Any Available Dentist</option>

                    {doctors.map((doctor) => (
                      <option value={doctor.id} key={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

              {/* APPOINTMENT DATE */}
              <div className="form-field full-width">

                <label htmlFor="appointmentDate">
                  Preferred Consultation Date <span>*</span>
                </label>

                <div className="input-with-icon">
                  <CalendarDays size={17} />

                  <input
                    id="appointmentDate"
                    type="date"
                    min={today}
                    value={date}
                    onChange={handleDateChange}
                    required
                    disabled={saving}
                  />
                </div>

              </div>

              {/* TIME SLOT SELECTION */}
              <div className="slot-heading">

                <label>
                  Preferred Time Slot <span>*</span>
                </label>

                <span>15-minute appointments</span>

              </div>

              <div className="clinic-hours-note">
                <Clock3 size={15} />

                <span>
                  {clinicHours
                    ? clinicHours.is_open
                      ? `${formatTime(openingMinutes)} – ${formatTime(closingMinutes)}`
                      : "Clinic closed on this day"
                    : dayOfWeek === 0
                      ? "Sunday: 10:00 AM – 2:00 PM"
                      : "Monday – Saturday: 9:00 AM – 8:30 PM"}
                </span>
              </div>

              <div className="slot-break-note">
                Breaks are based on the clinic's saved weekly schedule.
              </div>

              <div className="slot-legend">

                <span>
                  <i className="legend-dot available-dot"></i>
                  Available
                </span>

                <span>
                  <i className="legend-dot selected-dot"></i>
                  Selected
                </span>

                <span>
                  <i className="legend-dot unavailable-dot"></i>
                  Unavailable
                </span>

              </div>

              {loadingAvailability ? (

                <div className="slot-selection-note">
                  <Clock3 size={15} />
                  Loading appointment availability...
                </div>

              ) : availabilityError ? (

                <div className="appointment-error" role="alert">
                  <AlertTriangle size={16} />
                  {availabilityError}
                </div>

              ) : selectedHoliday ? (

                <div className="appointment-error" role="alert">
                  <AlertTriangle size={16} />
                  Clinic closed: {selectedHoliday.holiday_name || "Holiday"}.
                  Please choose another date.
                </div>

              ) : isClinicClosed ? (

                <div className="appointment-error" role="alert">
                  <AlertTriangle size={16} />
                  The clinic is closed on the selected day. Please choose another date.
                </div>

              ) : (

                <div className="appointment-slots">

                  {availableSlots.map((slot) => {
                    const status = getSlotStatus(slot);
                    const isUnavailable = status !== "Available";
                    const isSelected =
                      selectedSlot?.start === slot.start;

                    return (
                      <button
                        type="button"
                        key={slot.start}
                        disabled={
                          isUnavailable ||
                          saving ||
                          loadingAvailability
                        }
                        className={[
                          "appointment-slot",
                          isSelected ? "selected" : "",
                          isUnavailable ? "unavailable" : "",
                          status === "Break" ? "break-slot" : "",
                          status === "Booked" || status === "Blocked"
                            ? "booked-slot"
                            : "",
                          status === "Passed" ? "past-slot" : "",
                        ].join(" ")}
                        onClick={() => selectSlot(slot)}
                        aria-label={`${formatTimeRange(slot.start, slot.end)} ${status}`}
                      >
                        <span>{formatTime(slot.start)}</span>

                        <small>
                          {isSelected
                            ? "Selected"
                            : status === "Available"
                              ? formatTime(slot.end)
                              : status}
                        </small>
                      </button>
                    );
                  })}

                </div>

              )}

              <div className="slot-selection-note">

                {selectedSlot ? (
                  <>
                    <CheckCircle2 size={15} />
                    Selected:{" "}
                    {formatTimeRange(
                      selectedSlot.start,
                      selectedSlot.end
                    )}
                  </>
                ) : (
                  <>
                    <Clock3 size={15} />
                    Select any available slot to continue.
                  </>
                )}

              </div>

              {/* PATIENT CONCERNS */}
              <div className="form-field full-width reason-field">

                <div className="reason-label">
                  <label htmlFor="reason">
                    Dental Concerns & Symptoms
                  </label>

                  <span>Optional</span>
                </div>

                <textarea
                  id="reason"
                  name="reason"
                  rows="3"
                  placeholder="Describe any specific symptoms, tooth pain, duration of ache, or questions for our specialists..."
                  value={patient.reason}
                  onChange={updatePatient}
                  disabled={saving}
                />

              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="appointment-error" role="alert">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="confirm-appointment-button"
                disabled={
                  saving ||
                  loadingAvailability ||
                  Boolean(availabilityError)
                }
              >
                <CalendarCheck size={18} />

                {saving
                  ? "Submitting Request..."
                  : emergencyMode
                    ? "Submit Emergency Request"
                    : "Confirm Appointment"}
              </button>

              <div className="privacy-note">
                <LockKeyhole size={13} />
                Your information is used for appointment coordination.
              </div>

              <p className="form-demo-note">
                Your appointment request will be sent to the clinic
                for review and confirmation.
              </p>

            </form>

          </section>

        </div>

      )}

    </div>
  );
}

export default Appointment;
