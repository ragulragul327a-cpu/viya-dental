
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Microscope,
  Star,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Services.css";

// Existing service images
import generalDentistry from "../assets/services/general-dentistry.png";
import rootCanal from "../assets/services/root-canal-treatment.png";
import teethWhitening from "../assets/services/teeth-whitening.png";
import bracesAlignment from "../assets/services/braces-alignment.png";
import dentalImplants from "../assets/services/dental-implants.png";
import preventiveCare from "../assets/services/preventive-dental-care.png";
import servicesHero from "../assets/services/services-hero.png";

// Keep these existing services available as fallback content.
const fallbackServices = [
  {
    id: "general-dentistry",
    name: "General Dentistry",
    description:
      "Complete dental checkups and personalised treatments to maintain healthy teeth and gums.",
    image: generalDentistry,
  },
  {
    id: "root-canal-treatment",
    name: "Root Canal Treatment",
    description:
      "Comfort-focused treatment to relieve tooth pain and help preserve your natural teeth.",
    image: rootCanal,
  },
  {
    id: "teeth-whitening",
    name: "Teeth Whitening",
    description:
      "Professional teeth whitening treatments to help restore a brighter, more confident smile.",
    image: teethWhitening,
  },
  {
    id: "braces-alignment",
    name: "Braces & Alignment",
    description:
      "Personalised orthodontic care to improve tooth alignment and create a balanced smile.",
    image: bracesAlignment,
  },
  {
    id: "dental-implants",
    name: "Dental Implants",
    description:
      "Modern tooth replacement solutions designed to restore function and your natural-looking smile.",
    image: dentalImplants,
  },
  {
    id: "preventive-dental-care",
    name: "Preventive Dental Care",
    description:
      "Regular cleaning and preventive care to protect your oral health and avoid future problems.",
    image: preventiveCare,
  },
];

const fallbackImages = {
  "general dentistry": generalDentistry,
  "root canal treatment": rootCanal,
  "teeth whitening": teethWhitening,
  "braces & alignment": bracesAlignment,
  "braces and alignment": bracesAlignment,
  "dental implants": dentalImplants,
  "preventive dental care": preventiveCare,
};

function getFallbackImage(serviceName) {
  const normalizedName = serviceName?.trim().toLowerCase();
  return fallbackImages[normalizedName] || generalDentistry;
}

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("services")
        .select("id, name, description, image_url, duration_minutes")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Services loading error:", fetchError);
        setServices(fallbackServices);
        setError("");
        return;
      }

      // Use database services when available.
      // Otherwise, show the existing fallback services.
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(fallbackServices);
      }
    } catch (fetchError) {
      console.error("Unexpected services error:", fetchError);
      setServices(fallbackServices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="services-page">
      {/* HERO SECTION */}
      <section className="services-hero">
        <div className="services-hero-container">
          <div className="services-hero-content">
            <div className="services-eyebrow">
              <span className="eyebrow-dot"></span>
              SPECIALITY CARE • OMR PERUNGUDI
            </div>

            <h1>
              Complete Dental Care for
              <span>Every Smile</span>
            </h1>

            <p className="services-hero-description">
              Personalised dental treatments, modern technology,
              and thoughtful care to help you maintain a healthy
              and confident smile.
            </p>

            <div className="services-hero-actions">
              <Link to="/appointment" className="services-primary-button">
                Book Appointment
                <CalendarDays size={16} />
              </Link>
            </div>

            <div className="services-statistics">
              <div className="stat-item">
                <strong>Modern</strong>
                <span>Dental Technology</span>
              </div>

              <div className="stat-item">
                <strong>Personal</strong>
                <span>Patient-focused Care</span>
              </div>

              <div className="stat-item">
                <strong>
                  4.9 <Star size={15} fill="currentColor" />
                </strong>
                <span>Patient Rating</span>
              </div>
            </div>
          </div>

          <div className="services-hero-visual">
            <div className="services-hero-image">
              <img
                src={servicesHero}
                alt="Viya Dental clinic services"
              />

              <div className="services-image-overlay">
                <div className="overlay-icon">
                  <Microscope size={19} />
                </div>

                <div className="overlay-content">
                  <strong>Modern Dental Care</strong>
                  <span>
                    Thoughtful treatment for every smile
                  </span>
                </div>

                <span className="overlay-certified">
                  VIYA DENTAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENT SECTION */}
      <section className="treatments-section">
        <div className="treatments-heading">
          <span className="treatments-eyebrow">
            COMPREHENSIVE TREATMENTS
          </span>

          <h2>Our Specialised Dental Services</h2>

          <p>
            Explore our dental treatments, designed to support
            your oral health and give you a comfortable experience.
          </p>
        </div>

        <div className="treatments-grid">
          {loading ? (
            <div className="services-loading">
              <LoaderCircle
                size={28}
                className="services-loader-icon"
              />
              <p>Loading dental services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="services-message">
              <h3>Services Coming Soon</h3>
              <p>
                Our dental services are being updated.
                Please check back shortly.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <article className="treatment-card" key={service.id}>
                <div className="treatment-image">
                  <img
                    src={
                      service.image_url ||
                      service.image ||
                      getFallbackImage(service.name)
                    }
                    alt={service.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getFallbackImage(
                        service.name
                      );
                    }}
                  />
                </div>

                <div className="treatment-content">
                  <h3>{service.name}</h3>

                  <p>
                    {service.description ||
                      "Contact our clinic to learn more about this dental treatment."}
                  </p>

                  <Link
                    to="/appointment"
                    state={{ service: service.name }}
                    className="treatment-link"
                  >
                    Book Consultation
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="services-cta">
          <div className="services-cta-content">
            <h2>Ready to Care for Your Smile?</h2>

            <p>
              Take the first step towards better oral health.
              Schedule your dental consultation with Viya Dental.
            </p>
          </div>

          <div className="services-cta-actions">
            <Link
              to="/appointment"
              className="services-cta-primary"
            >
              Book Appointment
              <CalendarDays size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;
