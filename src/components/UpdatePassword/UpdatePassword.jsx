
// src/components/UpdatePassword.jsx
import React, { useState } from "react";
import { useAuth } from "../../AuthContext/AuthContext";
import api from "../../AuthContext/Api.jsx";
import { Eye, EyeOff } from "lucide-react";
import "./UpdatePassword.scss";

const UpdatePassword = () => {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
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
    if (!email || !newPassword || !confirmNewPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Password & Confirm Password must match.");
      return;
    }

    // Password strength validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
      );
      return;
    }

    // Check token
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Email: email,
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
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.error ||
        err.message;

      if (serverMsg) {
        setError(serverMsg);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);
  const isFormValid =
    email &&
    newPassword === confirmNewPassword &&
    passwordValidation.isValid &&
    !loading;

  return (
    <div>
      <h2 className="upw-title">Update User Password</h2>

      {/* inline messages above card */}
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

      <div className="upw-container" role="main">
        <h4 className="upw-title">Update User Password</h4>

        <form
          className="upw-form"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={error ? "error-message" : undefined}
        >
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
              aria-required="true"
              aria-invalid={!!error && !email}
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
              <div
                className={`req ${
                  passwordValidation.minLength ? "valid" : ""
                }`}
              >
                At least 8 characters
              </div>
              <div
                className={`req ${
                  passwordValidation.hasUppercase ? "valid" : ""
                }`}
              >
                Uppercase letter (A-Z)
              </div>
              <div
                className={`req ${
                  passwordValidation.hasLowercase ? "valid" : ""
                }`}
              >
                Lowercase letter (a-z)
              </div>
              <div
                className={`req ${
                  passwordValidation.hasNumber ? "valid" : ""
                }`}
              >
                Number (0-9)
              </div>
              <div
                className={`req ${
                  passwordValidation.hasSpecialChar ? "valid" : ""
                }`}
              >
                Special character (!@#$%^&*)
              </div>
            </div>
          </div>

          {error && (
            <p
              id="error-message"
              className="upw-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
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
  );
};

export default UpdatePassword;
