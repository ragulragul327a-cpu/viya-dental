
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Lock, Mail } from "lucide-react";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (!result?.success) {
        setError(result?.message || "Invalid email or password.");
        return;
      }

      // Always navigate to the absolute admin dashboard route.
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-icon">
          <ShieldCheck size={32} />
        </div>

        <p className="admin-login-brand">VIYA DENTAL</p>

        <h1>Admin Login</h1>

        <p className="admin-login-subtitle">
          Sign in to manage your clinic
        </p>

        <form onSubmit={handleSubmit}>

          <div className="admin-login-field">
            <label htmlFor="admin-email">Email Address</label>

            <div className="admin-login-input">
              <Mail size={18} />

              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-login-input">
              <Lock size={18} />

              <input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <Link to="/" className="admin-back-link">
          ← Back to Website
        </Link>

      </div>
    </div>
  );
}

export default AdminLogin;
