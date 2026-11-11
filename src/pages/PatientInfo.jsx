import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Clock3,
  CalendarCheck,
  ClipboardList,
  Heart,
  CheckCircle2,
  MessageSquareText,
  Info,
  ChevronDown,
  MapPin,
  Phone,
  CalendarDays,
  Stethoscope,
  FileText,
  Sparkles,
} from "lucide-react";

import "./PatientInfo.css";

const patientSteps = [
  {
    number: "STEP 01",
    icon: CalendarCheck,
    title: "Before Your Visit",
    description:
      "Smooth pre-appointment routine to ensure a seamless check-in.",
    points: [
      "Book ahead online or via phone",
      "Arrive 10 minutes early for check-in",
      "Bring previous dental records or X-rays if available",
    ],
  },
  {
    number: "STEP 02",
    icon: ClipboardList,
    title: "Your First Visit",
    description:
      "A relaxed, attentive first appointment with zero surprises.",
    points: [
      "Simple and rapid digital registration",
      "One-on-one dedicated dentist consultation",
      "Comprehensive examination with digital intraoral imaging",
      "Clear, personalized treatment plan and quote",
    ],
  },
  {
    number: "STEP 03",
    icon: Heart,
    title: "Aftercare",
    description:
      "Post-procedure support to protect your restorative oral health.",
    points: [
      "Follow post-treatment guidance carefully",
      "Take prescribed medications exactly as directed",
      "Attend recommended follow-up visits for longevity",
    ],
  },
];

const testimonials = [
  {
    name: "Priya R.",
    treatment: "General Consultation · Perungudi",
    quote:
      "The staff and doctors made me feel completely relaxed during my consultation. Everything was explained clearly beforehand.",
  },
  {
    name: "Karthik S.",
    treatment: "Preventive Care · OMR",
    quote:
      "Very professional and gentle care. Zero waiting time and modern equipment made the whole visit seamless.",
  },
];

const faqs = [
  {
    question: "How do I book an appointment?",
    answer:
      "You can book an appointment using our online booking form. Select your treatment, preferred dentist, date and available time slot to submit your request.",
  },
  {
    question: "What should I bring to my first visit?",
    answer:
      "Please bring any previous dental records, X-rays, a list of current medications and relevant medical information. Arriving 10 minutes early will help with registration.",
  },
  {
    question: "Do you treat children?",
    answer:
      "Yes. We welcome children and encourage regular dental check-ups from an early age. Our team aims to make every visit comfortable and reassuring for young patients.",
  },
  {
    question: "Will I know the treatment cost beforehand?",
    answer:
      "Your dentist will explain the recommended treatment options and discuss the estimated cost with you before proceeding with treatment.",
  },
];

function PatientInfo() {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <div className="patient-info-page">
      {/* HERO */}
      <section className="patient-hero">
        <div className="patient-hero-content">
          <div className="patient-eyebrow">
            <MapPin size={13} />
            PATIENT GUIDE · PERUNGUDI, CHENNAI
          </div>

          <h1>Your Smile, Our Priority</h1>

          <p className="patient-hero-description">
            Helpful information and answers for a comfortable dental visit.
          </p>

          <div className="patient-trust-points">
            <span>
              <Clock3 size={14} />
              Zero Wait-Time Protocol
            </span>

            <span className="trust-dot">•</span>

            <span>
              <ShieldCheck size={14} />
              Class-B Sterilization
            </span>
          </div>
        </div>

        <div className="patient-hero-image">
          <img
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=85"
            alt="Dentist providing patient care in a modern dental clinic"
          />

          <div className="patient-image-label">
            <span className="patient-image-icon">
              <ShieldCheck size={19} />
            </span>
            <span>
              <strong>Patient-First Care</strong>
              <small>PERUNGUDI CLINIC · OMR</small>
            </span>
          </div>
        </div>
      </section>

      {/* PATIENT GUIDE */}
      <section className="patient-section patient-guide-section">
        <div className="patient-section-heading">
          <span className="patient-section-label">
            <ClipboardList size={13} />
            STEP-BY-STEP PATHWAY
          </span>

          <h2>Patient Guide</h2>

          <p>Everything you need to know from preparation to recovery.</p>
        </div>

        <div className="patient-guide-grid">
          {patientSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article className="patient-guide-card" key={step.number}>
                <div className="patient-card-top">
                  <div className="patient-card-icon">
                    <Icon size={21} />
                  </div>

                  <span className="patient-step-number">
                    {step.number}
                  </span>
                </div>

                <h3>{step.title}</h3>

                <p className="patient-card-description">
                  {step.description}
                </p>

                <ul>
                  {step.points.map((point) => (
                    <li key={point}>
                      <CheckCircle2 size={14} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="patient-section patient-testimonials-section">
        <div className="patient-section-heading">
          <span className="patient-section-label">
            <MessageSquareText size={13} />
            REAL EXPERIENCES
          </span>

          <div className="patient-testimonial-heading-row">
            <div>
              <h2>What Our Patients Say</h2>
              <p>
                Sample patient experiences — to be replaced with verified
                reviews.
              </p>
            </div>

            <span className="patient-sample-note">
              <Info size={13} />
              Sample reviews for editorial preview
            </span>
          </div>
        </div>

        <div className="patient-testimonial-grid">
          {testimonials.map((review) => (
            <article className="patient-testimonial-card" key={review.name}>
              <div className="patient-stars" aria-label="Sample five-star rating">
                ★★★★★
              </div>

              <blockquote>“{review.quote}”</blockquote>

              <div className="patient-review-bottom">
                <div>
                  <h3>{review.name}</h3>
                  <p>{review.treatment}</p>
                </div>

                <span className="patient-verified-label">
                  SAMPLE REVIEW
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="patient-section patient-faq-section">
        <div className="patient-section-heading">
          <span className="patient-section-label">
            <Info size={13} />
            CLEAR GUIDANCE
          </span>

          <h2>Frequently Asked Questions</h2>

          <p>Quick answers to common questions about your appointment.</p>
        </div>

        <div className="patient-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;

            return (
              <article
                className={`patient-faq-item ${isOpen ? "is-open" : ""}`}
                key={faq.question}
              >
                <button
                  type="button"
                  className="patient-faq-question"
                  onClick={() => setActiveFaq(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={17} />
                </button>

                {isOpen && (
                  <div className="patient-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="patient-contact-cta">
        <div>
          <h2>Have More Questions?</h2>
          <p>
            Our team is here to assist you with appointments, treatment
            details, and insurance inquiries.
          </p>
        </div>

        <div className="patient-cta-buttons">
          <Link to="/contact" className="patient-btn patient-btn-light">
            Contact Us
          </Link>

          <Link
            to="/appointment"
            className="patient-btn patient-btn-dark"
          >
            Book Appointment
          </Link>
        </div>
      </section>

      {/* CLINIC INFORMATION */}
      <section className="patient-clinic-info">
        <div className="patient-info-column">
          <h3>
            <MapPin size={17} />
            Clinic Location
          </h3>
          <p>
            Viya Dental, Perungudi,
            <br />
            Chennai, Tamil Nadu.
          </p>
        </div>

        <div className="patient-info-column">
          <h3>
            <Clock3 size={17} />
            Working Hours
          </h3>
          <p>
            Monday – Saturday: 9:00 AM – 8:30 PM
            <br />
            Sunday: 10:00 AM – 2:00 PM
          </p>
        </div>

        <div className="patient-info-column">
          <h3>
            <Phone size={17} />
            Emergency Support
          </h3>
          <p>
            Contact our clinic for urgent dental assistance.
            <br />
            For severe emergencies, seek immediate medical care.
          </p>
        </div>
      </section>
    </div>
  );
}

export default PatientInfo;