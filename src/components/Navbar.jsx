
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, UserRound } from "lucide-react";
import "./Navbar.css";

function ToothLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.5 5.5C10 3.5 13 5 16 6c3-1 6-2.5 8.5-.5 3 2.5 1.5 7.5.5 11-.8 3-2 8-4.5 9-2.5 1-3-5.5-4.5-7-1.5-1.5-2.5 6-4.5 7-2.5 1-4-6-4.8-9C5.5 13 4.5 8 7.5 5.5Z" />
    </svg>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    ["Home", "/"],
    ["Services", "/services"],
    ["Doctors", "/doctors"],
    ["Patient Info", "/patient-info"],
    ["Contact", "/contact"],
  ];

  return (
    <header className="site-header">
      <nav className="navbar">

        <Link
          to="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <div className="brand-icon">
            <ToothLogo />
          </div>

          <div className="brand-text">
            <strong>VIYA DENTAL</strong>
            <span>SPECIALITY CLINIC</span>
            <small>• PERUNGUDI</small>
          </div>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-content ${menuOpen ? "nav-open" : ""}`}>
          <div className="nav-links">
            {links.map(([name, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {name}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            <Link
              to="/appointment"
              className="nav-appointment"
              onClick={() => setMenuOpen(false)}
            >
              Book Appointment
            </Link>

            <Link
              to="/admin/login"
              className="nav-account"
              aria-label="Staff login"
              title="Staff login"
              onClick={() => setMenuOpen(false)}
            >
              <UserRound size={18} />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
