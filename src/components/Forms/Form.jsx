
// src/components/Forms/Form.jsx
import React, { useState } from "react";
import { addParticipant } from "../../AuthContext/Api.jsx";
import "./Form.scss";

const suffixOptions = [
  { value: "", label: "None" }, { value: "Jr", label: "Jr." }, { value: "Sr", label: "Sr." },
  { value: "II", label: "II" }, { value: "III", label: "III" }, { value: "IV", label: "IV" },
  { value: "Esq", label: "Esq." }, { value: "PhD", label: "PhD" }, { value: "MD", label: "MD" },
  { value: "DDS", label: "DDS" }, { value: "JD", label: "JD" }
];

function formatDateToMMDDYYYY(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${month}-${day}-${year}`;
}

function anyFieldFilled(fields) {
  return Object.values(fields).some(val => val && val !== "Y" && val !== "USA");
}

export default function AddParticipantForm({ open = false, onClose, onSave, token }) {
  // Form field state
  const [participantName, setParticipantName] = useState("");
  const [isActive, setIsActive] = useState("Y");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [participantFinancialAdvisor, setParticipantFinancialAdvisor] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");

  const [errorMessage, setErrorMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Collect current field values for clear/enable checks
  const fieldValues = {
    participantName, isActive, openDate, closeDate, participantType, participantFinancialAdvisor,
    firstName, middleName, lastName, suffix, organizationName, emailAddress, address1,
    address2, city, stateValue, postalCode, country
  };

  // Validation (returns boolean)
  function validateBeforeConfirm() {
    // basic mandatory checks
    if (
      !participantName || !isActive || !firstName || !lastName ||
      !address1 || !city || !stateValue || !emailAddress
    ) {
      setErrorMessage("Please fill all mandatory fields correctly.");
      return false;
    }

    // Postal code requirement only for USA
    if (country && country.toUpperCase() === "USA") {
      if (postalCode.length !== 5) {
        setErrorMessage("For USA, Postal Code must be 5 digits.");
        return false;
      }
    }

    // Less restrictive but safe email regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(emailAddress)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  // Build the participant payload from current state (used when sending)
  function buildParticipantPayload() {
    return {
      ParticipantName: participantName || null,
      Suffix: suffix || null,
      FirstName: firstName || null,
      MiddleName: middleName || null,
      LastName: lastName || null,
      ParticipantType: participantType || null,
      ParticipantFinancialAdvisor: participantFinancialAdvisor || null,
      OrganizationName: organizationName || null,
      IsActive: isActive || "Y",
      OpenDate: openDate || null,
      CloseDate: closeDate || null,
      EmailAddress: emailAddress || null,
      Address1: address1 || null,
      Address2: address2 || null,
      City: city || null,
      State: stateValue || null,
      PostalCode: postalCode || null,
      Country: country || null
    };
  }

  function handleConfirmClick(e) {
    e.preventDefault();
    if (validateBeforeConfirm()) {
      setShowConfirm(true);
    }
  }

  async function handleAddClick() {
    setSaving(true);
    setApiError("");
    console.log("handleAddClick - token:", token);

    if (!token) {
      setApiError("Missing or invalid token. Please log in again.");
      setSaving(false);
      return;
    }

    const payload = buildParticipantPayload();
    console.log("handleAddClick - payload:", payload);

    try {
      const result = await addParticipant(payload, token);
      console.log("handleAddClick - API response:", result);

      setSaving(false);
      setShowConfirm(false);

      if (!result || result.error || result.ErrorCode === 401 || result.ErrorDescription) {
        setApiError(result?.message || result?.ErrorDescription || "Failed to add participant.");
        return;
      }

      // Reset fields on success
      handleClear();

      if (onSave) onSave(result);
      if (onClose) onClose();
    } catch (err) {
      console.error('[AddParticipantForm] handleAddClick error:', err);
      setApiError("Failed to add participant (see console).");
      setSaving(false);
      setShowConfirm(false);
    }
  }

  function handleClear() {
    setParticipantName("");
    setIsActive("Y");
    setOpenDate("");
    setCloseDate("");
    setParticipantType("");
    setParticipantFinancialAdvisor("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setOrganizationName("");
    setEmailAddress("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setStateValue("");
    setPostalCode("");
    setCountry("USA");
    setErrorMessage("");
    setApiError("");
  }

  // Data snapshot for confirmation display (fresh)
  const confirmDataSnapshot = buildParticipantPayload();

  return (
    <aside className={`details-sidebar${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}>
        <h2 style={{ margin: 0, fontSize: "1.32em" }}>Add New Participant</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px"}}>
          <button
            type="button"
            className="btn"
            style={{
              background: "#051A36", color: "#fff", padding: "6px 16px", border: "1px solid #ccc",
              borderRadius: "4px", fontWeight: 500, cursor: anyFieldFilled(fieldValues) ? "pointer" : "not-allowed", fontSize: "1em"
            }}
            onClick={handleClear}
            disabled={!anyFieldFilled(fieldValues)}
          >
            Clear
          </button>
          <button className="sidebar-close-btn" type="button" onClick={onClose} aria-label="Close"
            style={{ background: "none", border: "none", fontSize: "2em", color: "#051a36", cursor: "pointer", padding: "0 7px" }}>×</button>
        </div>
      </div>

      {errorMessage && <div className="error-alert" style={{ color: "#d32f2f", fontWeight: 500, marginBottom: 10 }}>{errorMessage}</div>}
      {apiError && <div className="error-alert" style={{ color: "#d32f2f", fontWeight: 500, marginBottom: 10 }}>{apiError}</div>}

      {!showConfirm && (
        <form className="sidebar-form" onSubmit={handleConfirmClick} noValidate>
          <h4 style={{ marginBottom: 6, color: "#051A36" }}>Personal Details</h4>
          <div className="form-grid">
            <label className="field full-width">
              <span className="field-label">Participant Name *</span>
              <input type="text" placeholder="Participant Name" value={participantName} onChange={e => setParticipantName(e.target.value)} />
            </label>

            <label className="field" style={{ maxWidth: '80px' }}>
              <span className="field-label">Suffix</span>
              <select value={suffix} onChange={e => setSuffix(e.target.value)} style={{ width: '80px', fontSize: '0.9em', padding: '8px 12px' }}>
                {suffixOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </label>

            <label className="field"><span className="field-label">First Name *</span>
              <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Middle Name</span>
              <input type="text" placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Last Name *</span>
              <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Participant Type</span>
              <input type="text" placeholder="Donor / Investor / Other" value={participantType} onChange={e => setParticipantType(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Participant Financial Advisor</span>
              <input type="text" placeholder="Financial Advisor" value={participantFinancialAdvisor} onChange={e => setParticipantFinancialAdvisor(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Organization Name</span>
              <input type="text" placeholder="Organization Name" value={organizationName} onChange={e => setOrganizationName(e.target.value)} />
            </label>
          </div>

          <h4 style={{ marginBottom: 6, color: "#051A36" }}>Contact Details</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <label className="field"><span className="field-label">Email Address *</span>
              <input type="email" placeholder="Email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} style={{ width: "230px" }} />
            </label>
            <label className="field"><span className="field-label">Address Line 1 *</span>
              <input type="text" placeholder="Address Line 1" value={address1} onChange={e => setAddress1(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Address Line 2</span>
              <input type="text" placeholder="Address Line 2" value={address2} onChange={e => setAddress2(e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <label className="field"><span className="field-label">City *</span>
              <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">State *</span>
              <input type="text" placeholder="State" value={stateValue} onChange={e => setStateValue(e.target.value)} style={{ width: '90px', fontSize: '0.9em', padding: '8px 12px' }} />
            </label>
            <label className="field"><span className="field-label">Postal Code {country && country.toUpperCase() === "USA" ? '*' : ''}</span>
              <input type="text" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/[^0-9]/g, ""))} minLength={country && country.toUpperCase() === "USA" ? 5 : 0} maxLength={5} style={{ width: '100px', fontSize: '0.9em', padding: '9px 12px' }} />
            </label>
            <label className="field"><span className="field-label">Country *</span>
              <input type="text" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
            </label>
          </div>

          <h4 style={{ marginBottom: 6, color: "#051A36" }}>Participation</h4>
          <div className="form-grid">
            <label className="field"><span className="field-label">Is Active *</span>
              <select value={isActive} onChange={e => setIsActive(e.target.value)}>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </label>
            <label className="field"><span className="field-label">Open Date *</span>
              <input type="text" placeholder="MM-DD-YYYY" value={openDate} onChange={e => setOpenDate(e.target.value)} />
            </label>
            <label className="field"><span className="field-label">Close Date</span>
              <input type="text" placeholder="MM-DD-YYYY" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
            </label>
          </div>

          <div className="sidebar-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>Confirm</button>
          </div>
        </form>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirmation-modal" style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: "7px", padding: "28px 46px", boxShadow: "0 5px 30px rgba(0,0,0,0.13)", maxHeight: '80vh', overflowY: 'auto' }}>
            <h2>Confirmation</h2>
            <ul style={{ fontSize: 16, paddingLeft: 12 }}>
              {Object.entries(confirmDataSnapshot).map(([key, value]) => (
                <li key={key} style={{ marginBottom: 6 }}>
                  <strong>{key}</strong>: {(key === "OpenDate" || key === "CloseDate") ? formatDateToMMDDYYYY(value) : (value || <em>(empty)</em>)}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24 }}>
              <button className="btn primary" disabled={saving} onClick={handleAddClick}>
                {saving ? "Adding..." : "Add"}
              </button>
              <button className="btn ghost" style={{ marginLeft: 12 }} onClick={() => setShowConfirm(false)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
