
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Check,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">

        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2>VIYA DENTAL</h2>
              <span>CLINIC & IMPLANT CENTRE</span>
            </div>
          </div>

          <p className="footer-description">
            Gentle, precise, and world-class dental care designed
            for professionals and families along OMR, Perungudi, Chennai.
          </p>

          <div className="footer-certifications">
            <span><ShieldCheck size={11} /> NABH Accredited</span>
            <span><Check size={11} /> Class-B Sterilization</span>
          </div>

          <div className="footer-socials">
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="Facebook">f</a>
          </div>
        </div>

        <div className="footer-column">
          <h3><span></span> QUICK NAVIGATION</h3>
          <Link to="/">Home</Link>
          <Link to="/services">Services & Treatments</Link>
          <Link to="/doctors">Our Specialists</Link>
          <Link to="/patient-info">Patient Guidelines</Link>
          <Link to="/appointment" className="footer-highlight">
            Online Appointment
          </Link>
        </div>

        <div className="footer-column footer-hours">
          <h3><span></span> WORKING HOURS</h3>

          <p>
            <strong>Monday – Saturday</strong>
            <small>9:00 AM – 8:30 PM</small>
          </p>

          <p>
            <strong>Sunday</strong>
            <small>10:00 AM – 2:00 PM (By Appt)</small>
          </p>

          <div className="emergency-info">
            <span>EMERGENCY ON-CALL</span>
            <a href="tel:+914424960123">+91 44 2496 0123 (24h)</a>
          </div>

          <div className="priority-booking">
            <Clock size={11} />
            Zero Waiting with Priority Booking
          </div>
        </div>

        <div className="footer-column footer-location">
          <h3><span></span> CLINIC LOCATION</h3>

          <div className="footer-contact-item">
            <MapPin size={12} />
            <p>
              Plot 14, 2nd Floor, Rajiv Gandhi Salai (OMR),
              Perungudi, Chennai - 600096
              <small>(Opposite RMZ Millenia / Near Tora Plaza)</small>
            </p>
          </div>

          <div className="footer-contact-item">
            <Phone size={12} />
            <p>
              <a href="tel:+914424960123">+91 44 2496 0123</a>
              <small>+91 98400 12345</small>
            </p>
          </div>

          <div className="footer-contact-item">
            <Mail size={12} />
            <a href="mailto:care@viyadental.com">
              care@viyadental.com
            </a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © 2026 VIYA DENTAL CLINIC. All rights reserved.
          Registered under Clinical Establishments Act.
        </p>

        <div className="footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span>•</span>
          <Link to="/patient-info">Patient Rights</Link>
          <span>•</span>
          <Link to="/patient-info">Sterilization Protocol</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
