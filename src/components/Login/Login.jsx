
// src/components/Login/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import Akra from "../../assets/AKRA Logo.jpg";
import { ShieldCheck, Bolt, ClockCheck, Eye, EyeOff } from "lucide-react";
import "./Login.css";

function pickFirst(obj, keys = []) {
  if (!obj) return undefined;
  for (const k of keys) {
    const parts = k.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) {
        cur = undefined;
        break;
      }
      cur = cur[p];
    }
    if (cur !== undefined) return cur;
  }
  return undefined;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://api-acgfund-dev.azurewebsites.net/v1/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Email: email, Password: password }),
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      // ❌ LOGIN FAILED
      if (!res.ok) {
        const apiMessage =
          pickFirst(data, ["detail", "message", "error"]) || "";

        if (
          apiMessage.toLowerCase().includes("invalid") ||
          res.status === 401 ||
          res.status === 500
        ) {
          setError("Invalid email or password");
        } else {
          setError("Login failed. Please try again.");
        }

        setLoading(false);
        return;
      }

      // ✅ LOGIN SUCCESS
      const token =
        pickFirst(data, [
          "token",
          "accessToken",
          "authToken",
          "data.token",
        ]) || null;

      const id =
        pickFirst(data, ["id", "userId", "UserID", "data.id"]) || null;

      const role = pickFirst(data, ["role", "data.role"]) || "";
      const firstName = pickFirst(data, ["firstName", "data.firstName"]) || "";
      const lastName = pickFirst(data, ["lastName", "data.lastName"]) || "";

      const userObj = {
        ...data,
        token,
        id,
        role,
        firstName,
        lastName,
      };

      if (token) localStorage.setItem("authToken", token);

      login(userObj);
      navigate("/customreports");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-wrapper">
      {/* LEFT PANEL */}
      <div className="login-left-panel">
        <a className="back-link" href="#">
          ← Back to Home
        </a>
        <h1>Welcome Back</h1>
        <p>Sign in to your ACGFund account and continue your journey</p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <strong>Secure Access</strong>
              <div>Bank-level security</div>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">
              <Bolt size={20} />
            </span>
            <div>
              <strong>Quick & Easy</strong>
              <div>Fast sign-in</div>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">
              <ClockCheck size={20} />
            </span>
            <div>
              <strong>24/7 Access</strong>
              <div>Anytime, anywhere</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right-panel">
        <img src={Akra} alt="AKRA Logo" className="login-logo" />
        <h2>Sign In</h2>

        <div className="input-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={email}
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* PASSWORD WITH EYE ICON */}
        <div className="input-group password-group">
          <label>Password *</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        <div className="login-actions">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <a className="forgot-link" href="#">
            Forgot Password?
          </a>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Processing..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}
