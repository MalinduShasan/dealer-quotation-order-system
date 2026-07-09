import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useContext(AuthContext);

  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await loginUser({ email, password });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-layout">
      <div className="login-art">
        <div className="hero-panel">
          <p className="eyebrow">Prestige Workspace</p>
          <h2 className="hero-title">Trade faster. Quote smarter. Deliver with confidence.</h2>
          <p className="hero-text">
            A premium workspace for dealers, customers, and administrators to manage quotations,
            orders, and commercial decisions with elegance.
          </p>
          <div className="meta-grid">
            <div className="info-card">
              <p className="mini-label">Focus</p>
              <p className="supporting-text">Responsive quoting, approval, and order handling for daily operations.</p>
            </div>
            <div className="info-card">
              <p className="mini-label">Palette</p>
              <p className="supporting-text">Midnight, champagne, and emerald accents for a luxury control room feel.</p>
            </div>
            <div className="info-card">
              <p className="mini-label">Ready</p>
              <p className="supporting-text">Shared theme variables support dark mode and light mode across pages.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-card">
        <div className="form-header">
          <p className="eyebrow">Secure Access</p>
          <h2>Welcome Back</h2>
          <p className="supporting-text">Sign in to continue into the dealer quotation and order workspace.</p>
        </div>

        {error && <div className="status-banner status-banner--error">{error}</div>}

        <form className="page-grid" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              Business Email
            </label>
            <input
              id="email"
              className="field-input"
              type="email"
              placeholder="dealer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="button-row">
            <button className="lux-button" type="submit" disabled={loading}>
              {loading ? "Opening Workspace..." : "Enter Workspace"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Login;
