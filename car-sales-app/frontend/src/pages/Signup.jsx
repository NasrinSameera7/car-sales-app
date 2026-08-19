import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "", role: "CUSTOMER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div>
        <div className="plate-badge">PLATE<span style={{ color: "#d9901f" }}>SWAP</span><span className="plate-strip">IND</span></div>
        <form className="form-card" onSubmit={onSubmit}>
          <h2 style={{ marginBottom: 20 }}>Create your account</h2>
          {error && <div className="error-banner">{error}</div>}

          <div className="role-toggle">
            <button type="button" className={form.role === "CUSTOMER" ? "active" : ""} onClick={() => update("role", "CUSTOMER")}>I'm a customer</button>
            <button type="button" className={form.role === "DEALER" ? "active" : ""} onClick={() => update("role", "DEALER")}>I'm a dealer</button>
          </div>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required pattern="[^\s@]+@[^\s@]+\.[^\s@]+" title="Enter a valid email address" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Madurai" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? "Creating account..." : "Sign up"}</button>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--color-steel)" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--color-amber-dark)", fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}