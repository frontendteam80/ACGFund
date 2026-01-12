
// src/components/UpdatePassword.jsx
import React, { useEffect, useState } from "react";
import Select, { components as RSComponents } from "react-select";
import { useAuth } from "../../AuthContext/AuthContext";
import api from "../../AuthContext/Api.jsx";

import { Eye, EyeOff } from "lucide-react";

// import { fetchUserParticipantDetails } from "../../AuthContext/Api.jsx";

import "./UpdatePassword.scss";

const UpdatePassword = () => {
  const { user, token } = useAuth();
  const resolvedUserId = user?.id;
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participantOptions, setParticipantOptions] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


const resolvedToken =
  token ??
  localStorage.getItem("acg_token") ??
  localStorage.getItem("token") ??
  localStorage.getItem("access_token");


  const resetForm = () => {
    setParticipantId("");
    setEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isValid:
        minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    };
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  // Basic validation
  if (!participantId || !email || !newPassword || !confirmNewPassword) {
    setError("All fields are required.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setError("Password & Confirm Password must match.");
    return;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    setError(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
    );
    return;
  }

  if (!token) {
    setError("Authentication required. Please login again.");
    return;
  }

 setLoading(true);

try {
  const payload = {
    ParticipantId: Number(participantId),
    Email: email.trim(),
    NewPassword: newPassword,
    ConfirmNewPassword: confirmNewPassword,
  };

  const response = await api.updateUserPassword(payload, token);

  if (response.status === 204) {
    setSuccessMessage("Password updated successfully.");
    resetForm();
  } else {
    setError(`Unexpected response: ${response.status}`);
  }

} catch (err) {
  const status = err?.response?.status;
  const data = err?.response?.data;

  // ✅ HANDLE 400 VALIDATION ERROR
  if (status === 400 && data?.detail) {
    setError(data.detail);
  } else if (data?.message || data?.Message || data?.error) {
    setError(data.message || data.Message || data.error);
  } else if (err?.message) {
    setError(err.message);
  } else {
    setError("Network error. Please try again.");
  }

} finally {
  setLoading(false);
}
};

useEffect(() => {
  if (!resolvedUserId || !token) return;

  let mounted = true;
  setLoadingParticipants(true);

  api.fetchUserParticipantDetails(resolvedUserId, token)
    .then((rows) => {
      const options = (rows || []).map((p) => ({
        value: String(p.ParticipantID),                 
        label: p.ParticipantName, 
      }));

      if (mounted) setParticipantOptions(options);
    })
    .catch(() => {
      if (mounted) setParticipantOptions([]);
    })
    .finally(() => {
      if (mounted) setLoadingParticipants(false);
    });

  return () => {
    mounted = false;
  };
}, [resolvedUserId, token]);



const passwordValidation = validatePassword(newPassword);
const isFormValid =
  participantId &&
  email &&
  newPassword &&
  confirmNewPassword &&
  !loading;



  return (
    <div className="MainContent-card updatePassword-card">
    <div>
      
      <div className="upw-container" role="main">
        <div className="title">
        <h4 className="upw-title">Update User Password</h4>
        <p className="upw-discription">Use a strong password to keep your account secure</p>
        </div>

        <form
          className="upw-form"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={error ? "error-message" : undefined}
        >
           <div className="ParticipantRow">
            <label className="upw-label">Participant</label>

            <Select
              options={participantOptions}
              isClearable
              isSearchable
              placeholder={
                loadingParticipants ? "Loading participants..." : "Select participant"
              }
              value={
                participantOptions.find(
                  (o) => String(o.value) === String(participantId)
                ) || null
              }
              onChange={(opt) => {
                setParticipantId(opt ? opt.value : "");
                setError("");
              }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: 26,
                  fontSize: "12px",
                  borderRadius:"8px",
                  boxShadow: "none",
                  borderColor:"#ddd",
                  width:595,
                  // padding:"2px 5px",
                }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                  fontSize: "12px",
                }),
                dropdownIndicator: (base) => ({ ...base, padding: 0 }),
                clearIndicator: (base) => ({ ...base, padding: 0 }),
                indicatorsContainer: (base) => ({ ...base, padding: 0 }),
              }}
            />
          </div>

          <div className="emailRow">
            <label htmlFor="email" className="upw-label">
              Email
            </label>
          <input
            id="email"
            className="upw-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
          </div>

          <div className="newpasswordrow">
            <label htmlFor="newPassword" className="upw-label">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                className={`upw-input ${
                  !passwordValidation.isValid ? "invalid" : ""
                }`}
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                aria-required="true"
                aria-invalid={!passwordValidation.isValid}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="Confirmpasswordrow">
              <label htmlFor="confirmPassword" className="upw-label">
                Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  className={`upw-input ${
                    newPassword !== confirmNewPassword ? "invalid" : ""
                  }`}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  aria-required="true"
                  aria-invalid={newPassword !== confirmNewPassword}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
          <div className="password-requirements">
            <div className={`req-item ${passwordValidation.minLength ? "req-valid" : ""}`}>
              <span className="req-circle" />
              <span className="req-text">At least 8 characters</span>
            </div>

            <div className={`req-item ${passwordValidation.hasUppercase ? "req-valid" : ""}`}>
              <span className="req-circle" />
              <span className="req-text">Uppercase letter (A-Z)</span>
            </div>

            <div className={`req-item ${passwordValidation.hasLowercase ? "req-valid" : ""}`}>
              <span className="req-circle" />
              <span className="req-text">Lowercase letter (a-z)</span>
            </div>

            <div className={`req-item ${passwordValidation.hasNumber ? "req-valid" : ""}`}>
              <span className="req-circle" />
              <span className="req-text">Number (0-9)</span>
            </div>

            <div className={`req-item ${passwordValidation.hasSpecialChar ? "req-valid" : ""}`}>
              <span className="req-circle" />
              <span className="req-text">Special character (!@#$%^&*)</span>
            </div>
          </div>

          </div>

           {error && (
        <div className="upw-alert upw-alert-error" role="alert">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="upw-alert upw-alert-success" role="status">
          {successMessage}
        </div>
      )}

          <div className="upw-button-row">
            

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="btn-primary"
              aria-busy={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetForm}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default UpdatePassword;

