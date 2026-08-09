import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
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
          <h2 style={{ marginBottom: 20 }}>Log in</h2>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--color-steel)" }}>
            New here? <Link to="/signup" style={{ color: "var(--color-amber-dark)", fontWeight: 600 }}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
