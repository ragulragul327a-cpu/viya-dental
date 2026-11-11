import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock3,
  CalendarCheck,
  Zap,
  Navigation,
  ParkingSquare,
  Accessibility,
  ShieldCheck,
  Send,
  LockKeyhole,
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

import "./Contact.css";

const clinic = {
  phone: "+91 44 2496 0123",
  mobile: "+91 98400 12345",
  email: "care@viyadental.com",
  appointmentEmail: "appointments@viyadental.com",
  address:
    "Plot 14, 2nd Floor, Rajiv Gandhi Salai (OMR), Perungudi, Chennai - 600096",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Viya+Dental+Perungudi+Chennai",
};

function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    treatment: "Comprehensive Dental Consultation",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Frontend preview only. Connect this form to your backend
    // or email service before using it for real patient enquiries.
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      {/* PAGE INTRO */}
      <section className="contact-intro">
        <div className="contact-intro-badge">
          <span className="contact-badge-dot" />
          Perungudi Clinic · Dedicated Patient Desk
        </div>

        <h1>Get in Touch</h1>

        <p>
          We're here to help you take the next step towards a healthier smile.
          <br className="contact-desktop-break" />
          Connect with our clinic team for appointments, surgical
          <br className="contact-desktop-break" />
          consultations, and emergency dental support.
        </p>
      </section>

      {/* CONTACT DETAILS + FORM */}
      <section className="contact-main-grid">
        <div className="contact-left-column">
          {/* DETAIL CARDS */}
          <div className="contact-details-grid">
            <article className="contact-detail-card">
              <div className="contact-detail-icon">
                <Phone size={19} />
              </div>

              <span className="contact-detail-label">PHONE NUMBER</span>

              <a className="contact-detail-primary" href="tel:+914424960123">
                {clinic.phone}
              </a>

              <a className="contact-detail-secondary" href="tel:+919840012345">
                {clinic.mobile}
              </a>

              <div className="contact-detail-note">
                <Clock3 size={13} />
                Mon–Sat: 9:00 AM – 8:30 PM
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">
                <Mail size={19} />
              </div>

              <span className="contact-detail-label">EMAIL ADDRESS</span>

              <a
                className="contact-detail-primary"
                href={`mailto:${clinic.email}`}
              >
                {clinic.email}
              </a>

              <a
                className="contact-detail-secondary"
                href={`mailto:${clinic.appointmentEmail}`}
              >
                {clinic.appointmentEmail}
              </a>

              <div className="contact-detail-note">
                <Zap size={13} />
                Response within 2–4 hours
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">
                <MapPin size={19} />
              </div>

              <span className="contact-detail-label">CLINIC ADDRESS</span>

              <p className="contact-detail-address">
                Plot 14, 2nd Floor, Rajiv Gandhi Salai (OMR), Perungudi
              </p>

              <p className="contact-detail-muted">Chennai - 600096</p>

              <div className="contact-detail-note">
                <MapPin size={13} />
                Near Perungudi Toll Plaza
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">
                <CalendarCheck size={19} />
              </div>

              <span className="contact-detail-label">OPENING HOURS</span>

              <p className="contact-hours-main">
                Mon – Sat: 9:00 AM – 8:30 PM
              </p>

              <p className="contact-detail-muted">
                Sunday: 10:00 AM – 2:00 PM
              </p>

              <div className="contact-detail-note">
                <CalendarCheck size={13} />
                7 Days a Week
              </div>
            </article>
          </div>

          {/* LOCATION CARD */}
          <article className="contact-location-card">
            <div className="contact-location-heading">
              <div>
                <h2>Find Our Perungudi Facility</h2>
                <p>Elevator access to 2nd Floor · Dedicated valet spot</p>
              </div>

              <a
                href={clinic.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="contact-map-link"
              >
                <Navigation size={13} />
                Open in Google Maps
              </a>
            </div>

            <a
              href={clinic.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="contact-map-preview"
              aria-label="Open Viya Dental location in Google Maps"
            >
              <div className="contact-map-road contact-map-road-main" />
              <div className="contact-map-road contact-map-road-cross" />

              <div className="contact-map-location">
                <MapPin size={12} />
                Perungudi
              </div>

              <div className="contact-map-marker">
                <MapPin size={15} />
                VIYA DENTAL CLINIC
              </div>

              <div className="contact-map-bus">
                <Navigation size={12} />
                Kandanchavadi Bus Stop (180m)
              </div>
            </a>

            <div className="contact-location-features">
              <span>
                <ParkingSquare size={13} />
                Reserved Basement Parking
              </span>

              <span>
                <Accessibility size={13} />
                Wheelchair Friendly & Stretcher Lift
              </span>

              <span>
                <ShieldCheck size={13} />
                Infection-Control Practices
              </span>
            </div>
          </article>
        </div>

        {/* MESSAGE FORM */}
        <aside className="contact-form-card">
          <div className="contact-form-top-line" />

          <div className="contact-form-inner">
            <h2>Send a Message</h2>

            <p className="contact-form-description">
              Fill in your details below and our patient coordinator will
              reach out to you within 2–4 hours.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="contact-field">
                <div className="contact-field-label-row">
                  <label htmlFor="contact-fullname">Full Name</label>
                  <span>Required</span>
                </div>

                <input
                  id="contact-fullname"
                  type="text"
                  name="fullName"
                  placeholder="e.g. Ananda Krishnan"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-form-two-columns">
                <div className="contact-field">
                  <div className="contact-field-label-row">
                    <label htmlFor="contact-phone">Phone Number</label>
                    <span>Required</span>
                  </div>

                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[+]?[0-9\s-]{10,15}"
                    title="Enter a valid phone number"
                    required
                  />
                </div>

                <div className="contact-field">
                  <div className="contact-field-label-row">
                    <label htmlFor="contact-email">Email Address</label>
                  </div>

                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-treatment">
                  Inquiring About / Treatment
                </label>

                <select
                  id="contact-treatment"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                >
                  <option>Comprehensive Dental Consultation</option>
                  <option>General Dentistry</option>
                  <option>Root Canal Treatment</option>
                  <option>Teeth Whitening</option>
                  <option>Braces & Alignment</option>
                  <option>Dental Implants</option>
                  <option>Preventive Dental Care</option>
                  <option>Kids Dentistry</option>
                  <option>Emergency Dental Care</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="contact-field">
                <div className="contact-field-label-row">
                  <label htmlFor="contact-message">
                    Message or Symptoms
                  </label>
                  <span>Optional</span>
                </div>

                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Mention any pain, preferred doctor, or convenient time slot..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <button className="contact-submit-button" type="submit">
                Send Message
                <Send size={15} />
              </button>

              {submitted && (
                <div className="contact-success-message" role="status">
                  <CheckCircle2 size={17} />
                  Form preview submitted. Connect the backend to send this
                  enquiry to the clinic.
                </div>
              )}
            </form>

            <div className="contact-privacy-note">
              <LockKeyhole size={13} />
              <span>
                Your health information should be handled securely and
                confidentially.
              </span>
            </div>
          </div>
        </aside>
      </section>

      {/* EMERGENCY BANNER */}
      <section className="contact-emergency-banner">
        <div className="contact-emergency-icon">
          <AlertTriangle size={21} />
        </div>

        <div className="contact-emergency-content">
          <h2>Experiencing acute dental pain or injury?</h2>
          <p>
            Contact our clinic team for assistance with urgent dental
            concerns.
          </p>
        </div>

        <a href="tel:+914424960123" className="contact-emergency-button">
          <Phone size={14} />
          Call Dental Clinic
        </a>
      </section>
    </div>
  );
}

export default Contact;