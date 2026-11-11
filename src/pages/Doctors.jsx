
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Brain,
  ShieldCheck,
  BriefcaseMedical,
  ArrowRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Doctors.css";

import anjaliImage from "../assets/doctors/dr-anjali-sharma.png";
import rohanImage from "../assets/doctors/dr-rohan-sharma.png";
import priyaImage from "../assets/doctors/dr-priya-sharma.png";

const fallbackImages = [anjaliImage, rohanImage, priyaImage];

function formatExperience(value) {
  if (value === null || value === undefined || value === "") {
    return "Experienced Specialist";
  }

  const text = String(value);
  return /year|experience/i.test(text)
    ? text
    : `${text}+ Years Experience`;
}

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDoctors() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("doctors")
        .select(
          "id, name, qualification, specialization, experience, image_url, description"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Doctors loading error:", error);
        setError("Unable to load our doctors right now. Please try again later.");
        setDoctors([]);
      } else {
        setDoctors(data || []);
      }

      setLoading(false);
    }

    loadDoctors();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="doctors-page">
      <section className="doctors-intro">
        <div className="doctors-eyebrow">
          <span></span>
          EXPERT CLINICAL SPECIALISTS • PERUNGUDI, CHENNAI
        </div>

        <h1>Meet Our Dentists</h1>

        <p className="doctors-intro-description">
          Experienced, compassionate dental specialists dedicated
          to gentle precision and patient-first care.
        </p>

        <div className="doctors-trust-badges">
          <div className="trust-badge">
            <BadgeCheck size={15} />
            Qualified Dental Specialists
          </div>

          <div className="trust-badge">
            <Brain size={15} />
            Personalised Treatment
          </div>

          <div className="trust-badge">
            <ShieldCheck size={15} />
            Patient-First Care
          </div>
        </div>
      </section>

      <section className="doctors-list-section">
        {loading ? (
          <p className="doctors-status-message">Loading our doctors...</p>
        ) : error ? (
          <p className="doctors-status-message doctors-error">{error}</p>
        ) : doctors.length === 0 ? (
          <p className="doctors-status-message">
            Our doctor profiles will be available soon. Please contact the clinic
            for assistance.
          </p>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor, index) => (
              <article className="doctor-card" key={doctor.id}>
                <div className="doctor-image-wrapper">
                  <img
                    src={doctor.image_url || fallbackImages[index % fallbackImages.length]}
                    alt={doctor.name}
                    className="doctor-image"
                    onError={(event) => {
                      event.currentTarget.src =
                        fallbackImages[index % fallbackImages.length];
                    }}
                  />

                  <div className="doctor-availability">
                    <span></span>
                    By Prior Appointment
                  </div>
                </div>

                <div className="doctor-card-details">
                  <div className="doctor-meta">
                    <span className="doctor-experience">
                      <BriefcaseMedical size={13} />
                      {formatExperience(doctor.experience)}
                    </span>

                    <span className="doctor-specialty">
                      {doctor.specialization || "DENTAL CARE"}
                    </span>
                  </div>

                  <h2>{doctor.name}</h2>

                  <p className="doctor-qualification">
                    {doctor.qualification || "Dental Specialist"}
                  </p>

                  <p className="doctor-description">
                    {doctor.description ||
                      "Dedicated to providing comfortable, personalised dental care."}
                  </p>

                  <div className="clinical-focus">
                    <h3>
                      <CheckCircle2 size={14} />
                      SPECIALIST INFORMATION
                    </h3>

                    <ul>
                      <li>
                        <CheckCircle2 size={14} />
                        <span>{doctor.specialization || "General Dental Care"}</span>
                      </li>
                      <li>
                        <CheckCircle2 size={14} />
                        <span>{doctor.qualification || "Qualified Dentist"}</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/appointment"
                    className="doctor-book-button"
                  >
                    Book Consultation
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="doctor-guidance">
        <div className="guidance-content">
          <span className="guidance-eyebrow">
            <Clock3 size={13} />
            CLINIC TRIAGE & CARE CONCIERGE
          </span>

          <h2>Need Guidance on Choosing the Right Specialist?</h2>

          <p>
            Our Perungudi clinic reception helps match you with
            the right clinician for your needs.
          </p>
        </div>

        <div className="guidance-actions">
          <Link
            to="/appointment"
            className="guidance-book-button"
          >
            <CalendarDays size={15} />
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Doctors;
