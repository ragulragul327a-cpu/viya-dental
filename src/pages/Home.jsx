
import { Link } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Phone,
  ShieldCheck,
  Clock3,
  Heart,
  ScanLine,
  Flower2,
  ArrowRight,
} from "lucide-react";

import heroImage from "../assets/hero-clinic.png";
import "./Home.css";

function Home() {
  const features = [
    {
      icon: <Heart size={21} />,
      title: "Patient-Focused Care",
      description:
        "Gentle consultations, transparent treatment plans, and zero-pressure recommendations tailored to your goals.",
      link: "Thoughtful dentistry",
    },
    {
      icon: <ScanLine size={21} />,
      title: "Modern Dental Technology",
      description:
        "Precision digital 3D imaging, low-radiation scans, and minimally invasive, painless treatment protocols.",
      link: "High-accuracy diagnostics",
    },
    {
      icon: <Flower2 size={21} />,
      title: "Comfortable Environment",
      description:
        "Calming, sunlit operatory suites designed to completely eliminate dental anxiety for adults and children alike.",
      link: "Stress-free spaces",
    },
  ];

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-container">

          <div className="hero-content">
            <div className="hero-location">
              <MapPin size={13} />
              PERUNGUDI, OMR • CHENNAI
            </div>

            <h1>
              A Healthier Smile
              <span>Starts Here</span>
            </h1>

            <p className="hero-description">
              Experience gentle, patient-focused dentistry in
              Perungudi, Chennai. Modern technology and thoughtful
              care designed for your comfort, wellness, and
              lasting confidence.
            </p>

            <div className="hero-buttons">
              <Link to="/appointment" className="hero-primary-button">
                Book Appointment
                <CalendarDays size={16} />
              </Link>

              <a href="tel:+914424960123" className="hero-call-button">
                <Phone size={15} />
                Call +91 44 2496 0123
              </a>
            </div>

            <div className="hero-rating">
              <div className="avatar-stack">
                <span>P</span>
                <span>K</span>
                <span>S</span>
              </div>

              <div className="rating-details">
                <div className="rating-stars">★★★★★</div>
                <p>Trusted by over 4,800+ families on OMR</p>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-card">
              <div className="hero-image-wrap">
                <img
                  src={heroImage}
                  alt="Dentist speaking with a patient inside Viya Dental clinic"
                />

                <div className="image-assurance">
                  <span className="assurance-dot"></span>
                  <div>
                    <strong>Sterile & Relaxed Studio</strong>
                    <small>NABH Quality Protocol Assured</small>
                  </div>
                </div>
              </div>

              <div className="image-bottom-info">
                <span>
                  <ShieldCheck size={13} />
                  Gentle, 100% Painless Tech
                </span>

                <span>
                  <Clock3 size={13} />
                  Timely, Zero Wait Appointments
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* EXCELLENCE SECTION */}
      <section className="excellence-section">
        <div className="section-heading">
          <span>EXCELLENCE IN PRACTICE</span>
          <h2>Crafted for Your Comfort</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={index}>
              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <Link to="/services" className="feature-link">
                {feature.link}
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Home;
