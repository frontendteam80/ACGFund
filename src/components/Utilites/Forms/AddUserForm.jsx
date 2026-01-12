
// src/Forms/AddUserForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select, { components as RSComponents } from "react-select";
import { Calendar } from "lucide-react";
import {
  fetchAgentNames,
  fetchUserParticipantDetails,
  signupUser,
  addUserDetails,
  fetchRoles,          
} from "../../../AuthContext/Api.jsx";
import "./Form.scss";

function DropdownIndicatorWithAdd(props) {
  return (
    <div className="dropdown-indicator-with-add">
      <RSComponents.DropdownIndicator {...props} />
    </div>
  );
}

function decodeJwt(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AddUserForm({
  open = false,
  onClose,
  onSave,
  token: tokenProp,
}) {
  const location = useLocation();

  // Core form fields
  const [participantName, setParticipantName] = useState("");
  const [participantID, setParticipantID] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");
  const [dateOfBirth, setDateOfBirth] = useState(null);

  // Role fields
  const [role, setRole] = useState("");
  const [roleId, setRoleId] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Advisor fields (used)
  const [agentNumber, setAgentNumber] = useState("");
  const [agentCompany, setAgentCompany] = useState("");
  const [agentRepCode, setAgentRepCode] = useState("");
  const [agentStartDate, setAgentStartDate] = useState(null);
  const [agentNotes, setAgentNotes] = useState("");
  const [americanFundsAccountNumber, setAmericanFundsAccountNumber] = useState("");
  const [btcaAccountNumber, setBtcaAccountNumber] = useState("");
  const [btcaAccountName, setBtcaAccountName] = useState("");
  const [accountNameShortform, setAccountNameShortform] = useState("");
  const [agentBranchNumber, setAgentBranchNumber] = useState("");
  const [agentOfficeManager, setAgentOfficeManager] = useState("");
  const [agentOfficeManagerEmail, setAgentOfficeManagerEmail] = useState("");
  const [agentOfficeManagerPhone, setAgentOfficeManagerPhone] = useState("");

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Token resolution
  const [resolvedToken, setResolvedToken] = useState(tokenProp || null);
  const [resolvedUserId, setResolvedUserId] = useState(null);

  // Select data
  const [participantOptions, setParticipantOptions] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const emailCheckAbortRef = useRef(null);
  const emailDebounceTimerRef = useRef(null);

  const passwordStrengthRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

  const suffixOptions = [
    { value: "", label: "None" },
    { value: "Jr", label: "Jr." },
    { value: "Sr", label: "Sr." },
    { value: "II", label: "II" },
    { value: "III", label: "III" },
    { value: "IV", label: "IV" },
    { value: "Esq", label: "Esq." },
    { value: "PhD", label: "PhD" },
    { value: "MD", label: "MD" },
    { value: "DDS", label: "DDS" },
    { value: "JD", label: "JD" },
  ];

  // Token resolution effect
  useEffect(() => {
    if (tokenProp) {
      setResolvedToken(tokenProp);
    } else {
      try {
        const t = localStorage.getItem("acg_token") ||
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
        setResolvedToken(t);
      } catch {
        setResolvedToken(null);
      }
    }

    try {
      const maybe = localStorage.getItem("UserID") ||
                   localStorage.getItem("userId") ||
                   localStorage.getItem("user_id") ||
                   localStorage.getItem("acg_userid") ||
                   localStorage.getItem("acg_user_id") ||
                   localStorage.getItem("User") || null;

      if (maybe) {
        try {
          const parsed = JSON.parse(maybe);
          const idFromParsed = parsed?.UserID || parsed?.userId || parsed?.id || parsed?.ID || parsed?.user_id;
          if (idFromParsed) {
            setResolvedUserId(String(idFromParsed));
            return;
          }
        } catch {}
        setResolvedUserId(String(maybe));
        return;
      }
    } catch {}

    const tokenToDecode = tokenProp || 
                         localStorage.getItem("acg_token") || 
                         localStorage.getItem("token") || 
                         localStorage.getItem("access_token");
    if (tokenToDecode) {
      const payload = decodeJwt(tokenToDecode);
      if (payload) {
        const claim = payload.sub || payload.user_id || payload.UserID || payload.uid || payload.id || payload.nameid;
        if (claim) setResolvedUserId(String(claim));
      }
    }
  }, [tokenProp]);

  // Load roles
  useEffect(() => {
    let mounted = true;
    async function loadRoles() {
      if (!resolvedToken) return;
      setLoadingRoles(true);
      try {
        const rows = await fetchRoles(resolvedToken);
        const opts = rows.map((r) => ({
          value: String(r.RoleID),
          label: r.Name,
          code: (r.Name || "").toLowerCase(),
        }));
        if (mounted) setRoleOptions(opts);
      } catch (err) {
        console.error("AddUserForm loadRoles error:", err);
        if (mounted) setRoleOptions([]);
      } finally {
        if (mounted) setLoadingRoles(false);
      }
    }
    loadRoles();
    return () => { mounted = false; };
  }, [resolvedToken]);

  // Load participants
  useEffect(() => {
    let mounted = true;
    async function loadParticipants() {
      if (!resolvedUserId) {
        if (mounted) setParticipantOptions([]);
        return;
      }
      setLoadingParticipants(true);
      try {
        const raw = await fetchUserParticipantDetails(resolvedUserId, resolvedToken);
        let rows = [];
        if (!raw) rows = [];
        else if (Array.isArray(raw)) rows = raw;
        else if (Array.isArray(raw.data)) rows = raw.data;
        else if (Array.isArray(raw.Results)) rows = raw.Results;
        else {
          const arrKey = Object.keys(raw).find((k) => Array.isArray(raw[k]));
          if (arrKey) rows = raw[arrKey];
        }

        const seen = new Set();
        const opts = (rows || []).reduce((acc, r) => {
          const id = r.ParticipantID ?? r.ParticipantId ?? r.ID ?? null;
          const number = r.ParticipantNumber ?? "";
          const name = (r.ParticipantName ?? r.Name ?? "").toString().trim();
          if (!name) return acc;
          const key = id !== null && id !== undefined ? String(id) : `${number}:${name}`;
          if (seen.has(key)) return acc;
          seen.add(key);
          acc.push({
            value: id !== null && id !== undefined ? String(id) : key,
             label: `${name}`,  
            participantID: id,
            participantNumber: number,
            participantName: name,
            raw: r,
          });
          return acc;
        }, []);

        if (mounted) {
          setParticipantOptions(opts);
        }
      } catch (err) {
        console.error("[AddUserForm] loadParticipants error", err);
        if (mounted) setParticipantOptions([]);
      } finally {
        if (mounted) setLoadingParticipants(false);
      }
    }

    if (resolvedUserId) loadParticipants();
    return () => { mounted = false; };
  }, [resolvedUserId, resolvedToken]);

  // Derive RoleID from role text
  useEffect(() => {
    if (!role || !roleOptions.length) return;
    const normalized = role.toLowerCase();
    const match = roleOptions.find((o) => o.code === normalized) ||
                  roleOptions.find((o) => o.label.toLowerCase() === normalized);
    if (match) setRoleId(match.value);
  }, [role, roleOptions]);

  // Handle incoming role from navigation
  useEffect(() => {
    const incomingRoleFromState = location?.state?.role;
    if (incomingRoleFromState) {
      setRole(String(incomingRoleFromState).toLowerCase());
      return;
    }

    try {
      const qs = new URLSearchParams(location.search || window.location.search || "");
      const fromQ = qs.get("role");
      if (fromQ) {
        setRole(String(fromQ).toLowerCase());
        return;
      }
    } catch {}

    try {
      const sessRole = sessionStorage.getItem("preselect_add_user_role");
      if (sessRole) {
        setRole(String(sessRole).toLowerCase());
        sessionStorage.removeItem("preselect_add_user_role");
        return;
      }
    } catch {}
  }, [location?.state, location?.search]);

  function formatDateForApi(date) {
    if (!date) return null;
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  const isDonorRole = (role || "").toLowerCase() === "donor";
  const isAdvisorRole = (role || "").toLowerCase() === "advisor";

  function validateBeforeConfirm() {
    if (emailExists) {
      setErrorMessage("Email already exists. Please use a different email.");
      return false;
    }

    if (!firstName || !lastName || !phoneNumber || !address1 || !city || !stateValue || !emailAddress) {
      setErrorMessage("Please fill all mandatory personal and contact fields correctly.");
      return false;
    }

    if (isAdvisorRole) {
      if (!agentNumber || agentNumber.trim() === "") {
        setErrorMessage("For role 'Advisor' please provide Agent Number.");
        return false;
      }
      if (!agentCompany || agentCompany.trim() === "") {
        setErrorMessage("For role 'Advisor' please provide Agent Company.");
        return false;
      }
    }

    if (!newPassword) {
      setErrorMessage("Please enter the password.");
      return false;
    }
    if (!confirmNewPassword) {
      setErrorMessage("Please confirm the password.");
      return false;
    }

    if (!passwordStrengthRe.test(newPassword)) {
      setErrorMessage("Password must be at least 8 characters, include an uppercase letter, a number and a special character.");
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return false;
    }

    if (country && country.toUpperCase() === "USA" && postalCode && postalCode.length !== 5) {
      setErrorMessage("For USA, Postal Code must be 5 digits.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(emailAddress)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function buildUserPayload() {
    return {
      Suffix: suffix || null,
      FirstName: firstName || null,
      MiddleName: middleName || null,
      LastName: lastName || null,
      EmailAddress: emailAddress || null,
      NewPassword: newPassword || null,
      PhoneNumber: phoneNumber || null,
      Address1: address1 || null,
      Address2: address2 || null,
      City: city || null,
      State: stateValue || null,
      PostalCode: postalCode || null,
      Country: country || null,
      DateOfBirth: formatDateForApi(dateOfBirth),
      Role: role || null,
      RoleID: roleId ? Number(roleId) : null,
      AgentNumber: agentNumber || null,
      AgentCompany: agentCompany || null,
      AgentRepCode: agentRepCode || null,
      AgentStartDate: formatDateForApi(agentStartDate),
      AgentNotes: agentNotes || null,
      AmericanFundsAccountNumber: americanFundsAccountNumber || null,
      BTCAAccountNumber: btcaAccountNumber || null,
      BTCAAccountName: btcaAccountName || null,
      AccountNameShortform: accountNameShortform || null,
      AgentBranchNumber: agentBranchNumber || null,
      AgentOfficeManager: agentOfficeManager || null,
      AgentOfficeManagerEmail: agentOfficeManagerEmail || null,
      AgentOfficeManagerPhone: agentOfficeManagerPhone || null,
      ParticipantID: participantID || null,
      ParticipantName: participantName || null,
      Meta_Mode: "user",
    };
  }

  async function handleAddClick() {
    setSaving(true);
    setApiError("");
    setErrorMessage("");

    let useToken = resolvedToken;
    if (!useToken) {
      useToken = localStorage.getItem("acg_token") || 
                 localStorage.getItem("token") || 
                 localStorage.getItem("access_token") || null;
      if (useToken) setResolvedToken(useToken);
    }

    try {
      await signupUser({
        Email: emailAddress,
        Password: newPassword,
        ConfirmPassword: confirmNewPassword,
      });
    } catch (err) {
      console.error("[AddUserForm] signup error", err);
      let msg = "Signup failed.";
      if (err?.payload?.body) {
        const b = err.payload.body;
        msg = b.message || JSON.stringify(b);
      } else if (err?.message) {
        msg = err.message;
      }
      setApiError(msg);
      setSaving(false);
      return;
    }

    if (!useToken) {
      setApiError("Missing admin token required to add role-specific user details. Please login as admin.");
      setSaving(false);
      return;
    }

    const payload = buildUserPayload();
    try {
      await addUserDetails(payload, useToken, role);
      setSaving(false);
      setShowConfirm(false);
      clearAll();
      setSuccessMessage("User added successfully.");
      if (onSave) onSave();
      setTimeout(() => { if (onClose) onClose(); }, 700);
    } catch (err) {
      console.error("[AddUserForm] addUserDetails error", err);
      let msg = "Failed to add user details.";
      if (err?.payload?.body) {
        const b = err.payload.body;
        msg = b.message || JSON.stringify(b);
      } else if (err?.message) {
        msg = err.message;
      }
      setApiError(msg);
      setSaving(false);
      setShowConfirm(false);
    }
  }

  function clearAll() {
    setParticipantName("");
    setParticipantID(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setEmailAddress("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPhoneNumber("");
    setHomePhone("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setStateValue("");
    setPostalCode("");
    setCountry("USA");
    setDateOfBirth(null);
    setRole("");
    setRoleId(null);
    setAgentNumber("");
    setAgentCompany("");
    setAgentRepCode("");
    setAgentStartDate(null);
    setAgentNotes("");
    setAmericanFundsAccountNumber("");
    setBtcaAccountNumber("");
    setBtcaAccountName("");
    setAccountNameShortform("");
    setAgentBranchNumber("");
    setAgentOfficeManager("");
    setAgentOfficeManagerEmail("");
    setAgentOfficeManagerPhone("");
    setErrorMessage("");
    setApiError("");
    setSuccessMessage("");
    setEmailExists(false);
    setPasswordError("");
    setConfirmPasswordError("");
  }

  function participantFilter(option, rawInput) {
    if (!rawInput) return true;
    const q = rawInput.trim().toLowerCase();
    const name = String(option.participantName || option.raw?.ParticipantName || option.label || "").toLowerCase();
    const id = String(option.participantID ?? option.value ?? "").toLowerCase();
    const number = String(option.participantNumber ?? option.raw?.ParticipantNumber ?? "").toLowerCase();
    return name.includes(q) || id.includes(q) || number.includes(q);
  }

  // Email existence check
  useEffect(() => {
    if (emailDebounceTimerRef.current) {
      clearTimeout(emailDebounceTimerRef.current);
      emailDebounceTimerRef.current = null;
    }
    if (emailCheckAbortRef.current) {
      try { emailCheckAbortRef.current.abort(); } catch {}
      emailCheckAbortRef.current = null;
    }

    const email = (emailAddress || "").trim();
    if (!email) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    const basicEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!basicEmailRe.test(email)) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    emailDebounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      emailCheckAbortRef.current = controller;
      try {
        const pageSize = 100;
        const url = `https://api-acgfund-dev.azurewebsites.net/v1/users?PageNumber=1&PageSize=${pageSize}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: resolvedToken ? `Bearer ${resolvedToken}` : "",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          setEmailExists(false);
          setCheckingEmail(false);
          return;
        }

        const data = await res.json();
        let rows = [];
        if (!data) rows = [];
        else if (Array.isArray(data)) rows = data;
        else if (Array.isArray(data.data)) rows = data.data;
        else if (Array.isArray(data.Results)) rows = data.Results;
        else {
          const arrKey = Object.keys(data).find((k) => Array.isArray(data[k]));
          if (arrKey) rows = data[arrKey];
        }

        const lower = email.toLowerCase();
        const found = (rows || []).some((r) => {
          const e = (r.EmailAddress ?? r.email ?? r.Email ?? "").toString().trim().toLowerCase();
          return e === lower;
        });
        setEmailExists(found);
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("[AddUserForm] email existence check error", err);
        }
      } finally {
        setCheckingEmail(false);
        emailCheckAbortRef.current = null;
      }
    }, 700);

    return () => {
      if (emailDebounceTimerRef.current) {
        clearTimeout(emailDebounceTimerRef.current);
      }
      if (emailCheckAbortRef.current) {
        try { emailCheckAbortRef.current.abort(); } catch {}
      }
    };
  }, [emailAddress, resolvedToken]);

  // Password validation
  useEffect(() => {
    if (!newPassword) {
      setPasswordError("");
    } else if (!passwordStrengthRe.test(newPassword)) {
      setPasswordError("Password must be at least 8 characters, include an uppercase letter, a number and a special character.");
    } else {
      setPasswordError("");
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match.");
    } else {
      setConfirmPasswordError("");
    }
  }, [newPassword, confirmNewPassword]);

  function isAnyFormFieldFilled() {
    const fields = { firstName, lastName, phoneNumber, address1, city, stateValue, emailAddress, newPassword, agentNumber, agentCompany };
    return Object.values(fields).some(val => val && val.trim());
  }

  return (
    <aside className={`details-sidebar${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="sidebar-header">
        <h2>Add New User</h2>
        <button 
          className="sidebar-close-btn" 
          type="button" 
          onClick={onClose} 
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {successMessage && <div className="notice success">{successMessage}</div>}
      {apiError && <div className="notice error">{apiError}</div>}

      {errorMessage ? (
        <div className="notice warn">{errorMessage}</div>
      ) : checkingEmail ? (
        <div className="notice info">Checking email availability...</div>
      ) : emailExists ? (
        <div className="notice warn">Email already exists.</div>
      ) : null}

      {passwordError && <div className="password-error">{passwordError}</div>}
      {confirmPasswordError && <div className="password-error">{confirmPasswordError}</div>}

      <div className="autofill-trap">
        <input name="username" autoComplete="username" />
        <input name="password" autoComplete="current-password" />
      </div>

      {!showConfirm && (
        <form className="sidebar-form" onSubmit={(e) => {
          e.preventDefault();
          if (validateBeforeConfirm()) setShowConfirm(true);
        }} noValidate>
          <div className="form-grid">
            <div className="personal-details">
              <h4>Personal Details</h4>
              <div className="Name-row">
              <div className="field-row">
                <label className="field">
                  <span className="field-label">First Name *</span>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field">
                  <span className="field-label">Middle Name</span>
                  <input 
                    type="text" 
                    value={middleName} 
                    onChange={(e) => setMiddleName(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field">
                  <span className="field-label">Last Name *</span>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>
              </div>
              </div>
            <div className="DateofBirthrow">
              {/* <div className="field-row"> */}
               
                <label className="field date-field">
                  <span className="field-label">Date of Birth</span>
                  <div className="date-wrapper">
                    <DatePicker 
                      selected={dateOfBirth} 
                      onChange={(d) => setDateOfBirth(d)} 
                      dateFormat="MM-dd-yyyy" 
                      placeholderText="MM-DD-YYYY" 
                      className="date-input-small" 
                    />
                    <Calendar size={18} className="calendar-icon"/>
                    
                  </div>
                </label>
                

                  <div className="field-selectRole">
                <label className="field Role">
                  
                  <span className="field-label">Role</span>
                  {loadingRoles ? (
                    <div>Loading roles...</div>
                  ) : (
                    <select
                      value={roleId || ""}
                      onChange={(e) => {
                        const selectedId = e.target.value || null;
                        setRoleId(selectedId);
                        const found = roleOptions.find((o) => o.value === selectedId);
                        setRole(found ? found.code : "");
                      }}
                    >
                      <option value="">Select role</option>
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                  
                </label>
                </div>
              </div>
              {/* </div> */}

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Email Address *</span>
                  <input
                    type="email"
                    name="no_autofill_email"
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="email"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      if (emailExists) setEmailExists(false);
                    }}
                    autoCorrect="off"
                    autoCapitalize="none"
                  />
                </label>

                <label className="field">
                  <span className="field-label">New Password *</span>
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Confirm Password *</span>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </label>
              </div>

              <h4>Contact Details</h4>
              
              <div className="field-row">
                {/* <div className="Mobile-Row" > */}
                <label className="field Phonenumber">
                  <span className="field-label">Phone Number *</span>
                  <input 
                    type="text" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field Homenumber">
                  <span className="field-label">Home Phone</span>
                  <input 
                    type="text" 
                    value={homePhone} 
                    onChange={(e) => setHomePhone(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>
              </div>
              

              <div className="field-row">
                <label className="field Address1">
                  <span className="field-label">Address Line 1 *</span>
                  <input 
                    type="text" 
                    value={address1} 
                    onChange={(e) => setAddress1(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field Address2">
                  <span className="field-label">Address Line 2</span>
                  <input 
                    type="text" 
                    value={address2} 
                    onChange={(e) => setAddress2(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>
              </div>
              {/* <div className="" */}
              <div className="field-row location-fields">
                <label className="field city">
                  <span className="field-label">City *</span>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field state">
                  <span className="field-label">State *</span>
                  <input 
                    type="text" 
                    value={stateValue} 
                    onChange={(e) => setStateValue(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>

                <label className="field ZipCode">
                  <span className="field-label">Zipcode {country?.toUpperCase() === "USA" ? "*" : ""}</span>
                  <input 
                    type="text" 
                    value={postalCode} 
                    onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ""))} 
                    maxLength={5} 
                  />
                </label>

                <label className="field Country">
                  <span className="field-label">Country *</span>
                  <input 
                    type="text" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    autoComplete="off" 
                  />
                </label>
              </div>
            </div>

            <div className="sidebar-section">
              <label className="field participant-field">
                <span className="field-label">Participant</span>
                <Select
                  components={{ DropdownIndicator: DropdownIndicatorWithAdd }}
                  options={participantOptions}
                  isClearable
                  isSearchable
                  placeholder="Select participant"
                  noOptionsMessage={() => "No participants"}
                  isMulti={false}
                  controlShouldRenderValue={true}
                  backspaceRemovesValue={false}

                  value={participantOptions.find((o) => String(o.value) === String(participantID)) || null}
                  onChange={(opt) => {
                    if (!opt) {
                      setParticipantID(null);
                      setParticipantName("");
                    } else {
                      setParticipantID(String(opt.value));
                      const name = opt.participantName ?? opt.raw?.ParticipantName ?? opt.label ?? "";
                      setParticipantName(String(name));
                    }
                  }}
                  filterOption={participantFilter}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      borderColor: "#d1d5bd",
                      minHeight: 28,
                      boxShadow: "none !important",
                      borderRadius: 6,
                      maxHeight: 35,
                      "&:hover": { borderColor: "#d1d5db" }
                    }),
                    input: (base) => ({
                    ...base,
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    padding: 0,
                    margin: 0,
                  }),
                    menu: (provided) => ({ ...provided, zIndex: 9999,fontSize:"12px" }),
                    singleValue: (provided) => ({ ...provided }),
                    dropdownIndicator: (base) => ({ ...base, padding: 0 }),
                    clearIndicator: (base) => ({ ...base, padding: 0 }),
                    indicatorsContainer: (base) => ({ ...base, padding: 0 }),
                    placeholder: (provided) => ({
                      ...provided,
                      margin: 0,
                      padding: 0,
                      lineHeight: "20px",
                      color: "#e1dfdf",
                      boxshadow: "none",
                    }),
                    valueContainer: (provided) => ({ ...provided, padding: "0 6px", margin: 0 }),
                  
                  multiValue: () => ({ display: "none" }),
                  multiValueLabel: () => ({ display: "none" }),
                  multiValueRemove: () => ({ display: "none" }),
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                  }),
                }}
                />
              </label>

              {isAdvisorRole && (
                <div className="agent-details">
                  <h4>Agent Details</h4>
                  
                  <div className="field-row">
                    <label className="field BranchNumber">
                      <span className="field-label">Branch Number</span>
                      <input 
                        type="text" 
                        value={agentBranchNumber} 
                        onChange={(e) => setAgentBranchNumber(e.target.value)} 
                      />
                    </label>

                    <label className="field ">
                      <span className="field-label">A/C-Number *</span>
                      <input 
                        type="text" 
                        value={agentNumber} 
                        onChange={(e) => setAgentNumber(e.target.value)} 
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Company *</span>
                      <input 
                        type="text" 
                        value={agentCompany} 
                        onChange={(e) => setAgentCompany(e.target.value)} 
                      />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">Rep Code</span>
                      <input 
                        type="text" 
                        value={agentRepCode} 
                        onChange={(e) => setAgentRepCode(e.target.value)} 
                      />
                    </label>

                    <label className="field date-field">
                      <span className="field-label">Start Date</span>
                      <div className="date-wrapper">
                        <DatePicker 
                          selected={agentStartDate} 
                          onChange={(d) => setAgentStartDate(d)} 
                          dateFormat="MM-dd-yyyy" 
                          placeholderText="MM-DD-YYYY" 
                        />
                        <Calendar size={18} />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-label">Funds Account Number</span>
                      <input 
                        type="text" 
                        value={americanFundsAccountNumber} 
                        onChange={(e) => setAmericanFundsAccountNumber(e.target.value)} 
                      />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">Client Account Number</span>
                      <input 
                        type="text" 
                        value={btcaAccountNumber} 
                        onChange={(e) => setBtcaAccountNumber(e.target.value)} 
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Client Account Name</span>
                      <input 
                        type="text" 
                        value={btcaAccountName} 
                        onChange={(e) => setBtcaAccountName(e.target.value)} 
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Short form</span>
                      <input 
                        type="text" 
                        value={accountNameShortform} 
                        onChange={(e) => setAccountNameShortform(e.target.value)} 
                      />
                    </label>
                  </div>

                  <div className="field-row full-width">
                    <label className="field Notes">
                      <span className="field-label">Notes</span>
                      <input 
                        type="text" 
                        value={agentNotes} 
                        onChange={(e) => setAgentNotes(e.target.value)} 
                      />
                    </label>
                  </div>

                  <h4 className="agent-additional-title">Agent Additional Details</h4>
                  
                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">Office Manager</span>
                      <input 
                        type="text" 
                        value={agentOfficeManager} 
                        onChange={(e) => setAgentOfficeManager(e.target.value)} 
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Email</span>
                      <input 
                        type="email" 
                        value={agentOfficeManagerEmail} 
                        onChange={(e) => setAgentOfficeManagerEmail(e.target.value)} 
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Phone</span>
                      <input 
                        type="text" 
                        value={agentOfficeManagerPhone} 
                        onChange={(e) => setAgentOfficeManagerPhone(e.target.value)} 
                      />
                    </label>
                  </div>
                </div>
              )}
              </div>
               </div>

              
       
        <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={clearAll}
                  disabled={!isAnyFormFieldFilled()}
                >
                  Clear
                </button>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving || emailExists || !!passwordError || !!confirmPasswordError || checkingEmail}
                >
                  {saving ? "Submitting..." : "Confirm"}
                </button>
              
           
          </div>
           </form>
      )}
      

      {showConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-card">
            <h2>Confirmation</h2>
            <ul>
              {Object.entries(buildUserPayload()).map(([k, v]) => {
                if (v === null || v === "") return null;
                if (k === 'NewPassword' || k === 'ConfirmPassword') return null;
                return (
                  <li key={k}>
                    <strong>{k}</strong>: {String(v)}
                  </li>
                );
              })}
            </ul>

            <div className="confirmation-actions">
              <button
                className="btn primary"
                disabled={saving || emailExists || !!passwordError || !!confirmPasswordError || checkingEmail}
                onClick={handleAddClick}
              >
                {saving ? "Adding..." : "Add"}
              </button>

              <button 
                className="btn ghost" 
                onClick={() => setShowConfirm(false)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
