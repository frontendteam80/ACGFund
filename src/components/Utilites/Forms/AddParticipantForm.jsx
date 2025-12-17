
// src/Forms/AddParticipantForm.jsx
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select, { components as RSComponents } from "react-select";
import { Calendar, PlusCircle } from "lucide-react";
import { fetchAgentNames, addParticipant as apiAddParticipant } from "../../../AuthContext/Api.jsx";
import { useNavigate } from "react-router-dom";
import "./Form.scss";

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

function anyFieldFilled(fields) {
  return Object.values(fields).some((val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim() !== "";
    if (typeof val === "object") return Object.keys(val || {}).length > 0;
    return true;
  });
}

function formatDateForApi(date) {
  if (!date) return null;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

/* dropdown indicator with small add-button */
function DropdownIndicatorWithAdd(props) {
  const { selectProps } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <RSComponents.DropdownIndicator {...props} />
      <button
        type="button"
        aria-label="Add new advisor"
        onClick={(e) => {
          e.stopPropagation();
          if (selectProps && typeof selectProps.onAddNew === "function") selectProps.onAddNew();
        }}
        style={{ background: "transparent", border: "none", cursor: "pointer", }}
      >
        <PlusCircle size={18} />
      </button>
    </div>
  );
}

export default function AddParticipantForm({
  open = false,
  onClose,
  onSave,
  token: tokenProp,
  onRequestAddUser = null,
  addUserPath = "/add-user",
}) {
  const navigate = useNavigate();

  // Participant fields
  const [participantName, setParticipantName] = useState("");
  const [isActive, setIsActive] = useState("Y");
  const [openDate, setOpenDate] = useState(null);
  const [participantType, setParticipantType] = useState("");
  const [participantFinancialAdvisor, setParticipantFinancialAdvisor] = useState(null);

  // Personal/contact
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");

  // UI
  const [errorMessage, setErrorMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resolvedToken, setResolvedToken] = useState(tokenProp || null);

  // advisors
  const [financialAdvisorOptions, setFinancialAdvisorOptions] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  // resolve token fallback
  useEffect(() => {
    if (tokenProp) setResolvedToken(tokenProp);
    else {
      try {
        const t = localStorage.getItem("acg_token") || localStorage.getItem("token") || localStorage.getItem("access_token");
        setResolvedToken(t);
      } catch {
        setResolvedToken(null);
      }
    }
  }, [tokenProp]);

  // load advisors
  useEffect(() => {
    let mounted = true;
    async function loadAgents() {
      setLoadingAdvisors(true);
      try {
        const raw = await fetchAgentNames(null, resolvedToken);
        const opts = (raw || []).map((a) => {
          const agentNumber = a.AgentNumber ?? a.AgentNo ?? "";
          const agentName = a.FinancialAdvisor ?? a.FinancialAdvisorName ?? "";
          return {
            value: agentNumber || null,
            label: `${agentNumber} - ${agentName}`,
            raw: a,
          };
        });
        if (mounted) setFinancialAdvisorOptions(opts);
      } catch (err) {
        console.error("[AddParticipantForm] loadAgents", err);
        if (mounted) setFinancialAdvisorOptions([]);
      } finally {
        if (mounted) setLoadingAdvisors(false);
      }
    }
    if (resolvedToken) loadAgents();
    return () => (mounted = false);
  }, [resolvedToken]);

  const fieldValues = {
    participantName,
    isActive,
    openDate,
    participantType,
    participantFinancialAdvisor,
    firstName,
    lastName,
    phoneNumber,
    address1,
    city,
    stateValue,
    emailAddress,
  };

  function validateBeforeConfirm() {
    if (!participantName || !firstName || !lastName || !phoneNumber || !address1 || !city || !stateValue || !emailAddress) {
      setErrorMessage("Please fill all mandatory fields correctly.");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(emailAddress)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }
    if (country && country.toUpperCase() === "USA" && postalCode && postalCode.length !== 5) {
      setErrorMessage("For USA, Postal Code must be 5 digits.");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function buildParticipantPayload() {
    return {
      ParticipantName: participantName || null,
      Suffix: suffix || null,
      FirstName: firstName || null,
      MiddleName: middleName || null,
      LastName: lastName || null,
      ParticipantType: participantType || null,
      ParticipantFinancialAdvisor: participantFinancialAdvisor ? participantFinancialAdvisor.value : null,
      ParticipantFinancialAdvisorName: participantFinancialAdvisor ? participantFinancialAdvisor.label : null,
      OrganizationName: organizationName || null,
      IsActive: isActive || "Y",
      OpenDate: formatDateForApi(openDate),
      EmailAddress: emailAddress || null,
      PhoneNumber: phoneNumber || null,
      Address1: address1 || null,
      Address2: address2 || null,
      City: city || null,
      State: stateValue || null,
      PostalCode: postalCode || null,
      Country: country || null,
      Meta_Mode: "participant",
    };
  }

  function handleConfirmClick(e) {
    e.preventDefault();
    if (validateBeforeConfirm()) setShowConfirm(true);
  }

  async function handleAddClick() {
    setSaving(true);
    setApiError("");
    let useToken = resolvedToken;
    if (!useToken) {
      useToken = localStorage.getItem("acg_token") || localStorage.getItem("token") || localStorage.getItem("access_token");
      if (useToken) setResolvedToken(useToken);
    }
    if (!useToken) {
      setApiError("Missing or invalid token. Please log in again.");
      setSaving(false);
      return;
    }
    const payload = buildParticipantPayload();
    try {
      const result = await apiAddParticipant(payload, useToken);
      setSaving(false);
      setShowConfirm(false);
      clearAll();
      setSuccessMessage("Participant added successfully.");
      if (onSave) onSave(result);
      setTimeout(() => { if (onClose) onClose(); }, 700);
    } catch (err) {
      console.error("[AddParticipantForm] handleAddClick", err);
      setApiError((err && err.message) || "Failed to add participant.");
      setSaving(false);
      setShowConfirm(false);
    }
  }

  function clearAll() {
    setParticipantName("");
    setIsActive("Y");
    setOpenDate(null);
    setParticipantType("");
    setParticipantFinancialAdvisor(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setOrganizationName("");
    setEmailAddress("");
    setPhoneNumber("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setStateValue("");
    setPostalCode("");
    setCountry("USA");
    setErrorMessage("");
    setApiError("");
    setSuccessMessage("");
  }

  // ---------- UPDATED: robust navigation + fallback ----------
  async function handleAddNewAdvisor() {
    // 1) If parent provided a modal-style handler, call it and set session fallback
    if (typeof onRequestAddUser === "function") {
      try {
        // allow parent to open AddUser modal and receive the requested role
        onRequestAddUser("advisor");
        // also set sessionStorage as extra fallback (harmless)
        try { sessionStorage.setItem("preselect_add_user_role", "advisor"); } catch {}
      } catch (err) {
        console.error("onRequestAddUser threw:", err);
      }
      return;
    }

    // 2) SPA navigation with state and sessionStorage fallback
    try {
      try { sessionStorage.setItem("preselect_add_user_role", "advisor"); } catch (e) {}
      navigate(addUserPath || "/add-user", { state: { role: "advisor" } });
    } catch (err) {
      console.error("navigate failed, falling back to href", err);
      try {
        // final fallback - query param
        window.location.href = `${addUserPath || "/add-user"}?role=advisor`;
      } catch (e) {
        console.error("fallback href navigation failed", e);
      }
    }
  }
  // ----------------------------------------------------------

  const confirmDataSnapshot = buildParticipantPayload();

  return (
    <aside className={`details-sidebar${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "600px" }}>
        <h2 style={{ margin: 0, fontSize: "1.32em" }}>Add New Participant</h2>
        <div>
          <button className="sidebar-close-btn" type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: "2em", color: "#051a36", cursor: "pointer", padding: "0 7px" }}>×</button>
        </div>
      </div>

      {successMessage && <div className="notice success">{successMessage}</div>}
      {apiError && <div className="notice error">{apiError}</div>}
      {errorMessage && <div className="notice warn">{errorMessage}</div>}

      {!showConfirm && (
        <form className="sidebar-form" onSubmit={handleConfirmClick} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ paddingRight: "20px", borderRight: "1px solid #d7d2d2" }}>
              <h4>Personal Details</h4>

              <div style={{ display: "flex", gap: 10, marginBottom: 16, width: 600 }}>
                <label className="field" style={{ width: 100 }}>
                  <span className="field-label">Suffix</span>
                  <select value={suffix} onChange={(e) => setSuffix(e.target.value)}>
                    {suffixOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>

                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Participant Name *</span>
                  <input type="text" placeholder="Participant Name" value={participantName} onChange={(e) => setParticipantName(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 16, width: 600 }}>
                <label className="field" style={{ flex: 1, width: 200 }}>
                  <span className="field-label">First Name *</span>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1, width: 200 }}>
                  <span className="field-label">Middle Name</span>
                  <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1, width: 180 }}>
                  <span className="field-label">Last Name *</span>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 24, width: 600 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Participant Type</span>
                  <input type="text" placeholder="Donor / Investor / Other" value={participantType} onChange={(e) => setParticipantType(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Is Active *</span>
                  <select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </label>

                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Open Date *</span>
                  <div style={{ position: "relative" }}>
                    <DatePicker selected={openDate} onChange={(d) => setOpenDate(d)} dateFormat="MM-dd-yyyy" placeholderText="Begin Date" className="date-input-small" />
                    <Calendar size={18} style={{ position: "absolute", right: 10, top: "45%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </label>
              </div>

              <h4>Contact Details</h4>

              <div style={{ display: "flex", gap: 10, marginBottom: 16, width: 600 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Email Address *</span>
                  <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Phone Number *</span>
                  <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 16, width: 600 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Address Line 1 *</span>
                  <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Address Line 2</span>
                  <input type="text" value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 16, width: 600 }}>
                <label className="field" style={{ flex: 1, width: 140 }}>
                  <span className="field-label">City *</span>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1, width: 140 }}>
                  <span className="field-label">State *</span>
                  <input type="text" value={stateValue} onChange={(e) => setStateValue(e.target.value)} />
                </label>

                <label className="field" style={{ flex: 1, width: 140 }}>
                  <span className="field-label">Zipcode {country && country.toUpperCase() === "USA" ? "*" : ""}</span>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ""))} maxLength={5} />
                </label>

                <label className="field" style={{ flex: 1, width: 150 }}>
                  <span className="field-label">Country *</span>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingLeft: 20 }}>
              <div>
                <h4>Participation</h4>
                <div style={{ display: "flex", gap: 10, maxWidth: 300 }}>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">Financial Advisor</span>
                    <Select
                      value={participantFinancialAdvisor}
                      onChange={(opt) => setParticipantFinancialAdvisor(opt)}
                      options={financialAdvisorOptions}
                      isClearable
                      placeholder="Agent number - name..."
                      components={{ DropdownIndicator: DropdownIndicatorWithAdd }}
                      onAddNew={handleAddNewAdvisor}
                      styles={{
                        control: (provided) => ({ ...provided, borderColor: "#d1d5bd", boxShadow: "none!important", borderRadius: 6, minHeight: 25, "&:hover": { borderColor: "#d1d5db" } }),
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        singleValue: (provided) => ({ ...provided }),
                        dropdownIndicator: (base) => ({ ...base, padding: 0 }),
                        clearIndicator: (base) => ({ ...base, padding: 0 }),
                        indicatorsContainer: (base) => ({ ...base, padding: 0 }),
                        placeholder: (provided) => ({ ...provided, margin: 0, padding: 0, lineHeight: "20px", color: "#e1dfdf" }),
                        valueContainer: (provided) => ({ ...provided, padding: "0 6px", margin: 0 }),
                      }}
                      formatOptionLabel={(option) => <div style={{ fontWeight: 500 }}>{option.label}</div>}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "auto", paddingTop: 20 }}>
                <button type="button" className="btn" onClick={clearAll} disabled={!anyFieldFilled(fieldValues)}>
                  Clear
                </button>

                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Submitting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {showConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-card">
            <h2>Confirmation</h2>
            <ul>
              {Object.entries(confirmDataSnapshot).map(([key, value]) => {
                if (value === null || value === "") return null;
                return (
                  <li key={key}>
                    <strong>{key}</strong>: {value}
                  </li>
                );
              })}
            </ul>

            <div style={{ marginTop: 24 }}>
              <button className="btn primary" disabled={saving} onClick={handleAddClick}>
                {saving ? "Adding..." : "Add"}
              </button>

              <button className="btn ghost" onClick={() => setShowConfirm(false)} style={{ marginLeft: 12 }}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
