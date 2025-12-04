
// // src/Forms/Form.jsx
// import React, { useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Select, { components as RSComponents } from "react-select";
// import { Calendar, PlusCircle } from "lucide-react";
// import { fetchAgentNames, addParticipant as apiAddParticipant } from "../../AuthContext/Api.jsx";
// import "./Form.scss";

// // optional react-router navigation (will be used only if parent doesn't handle the "go to add user" request)
// let useNavigate = null;
// try {
//   // require so this file still loads if react-router isn't present
//   // eslint-disable-next-line import/no-extraneous-dependencies
//   useNavigate = require("react-router-dom").useNavigate;
// } catch (e) {
//   useNavigate = null;
// }

// let useAuth = null;
// try {
//   useAuth = require("../../AuthContext/AuthProvider.jsx").useAuth;
// } catch (e) {
//   useAuth = null;
// }

// const suffixOptions = [
//   { value: "", label: "None" },
//   { value: "Jr", label: "Jr." },
//   { value: "Sr", label: "Sr." },
//   { value: "II", label: "II" },
//   { value: "III", label: "III" },
//   { value: "IV", label: "IV" },
//   { value: "Esq", label: "Esq." },
//   { value: "PhD", label: "PhD" },
//   { value: "MD", label: "MD" },
//   { value: "DDS", label: "DDS" },
//   { value: "JD", label: "JD" },
// ];

// function anyFieldFilled(fields) {
//   return Object.values(fields).some((val) => {
//     if (val === null || val === undefined) return false;
//     if (typeof val === "string") return val.trim() !== "";
//     if (typeof val === "object") return Object.keys(val).length > 0;
//     return true;
//   });
// }

// function formatDateForApi(date) {
//   if (!date) return null;
//   const mm = String(date.getMonth() + 1).padStart(2, "0");
//   const dd = String(date.getDate()).padStart(2, "0");
//   const yyyy = date.getFullYear();
//   return `${yyyy}-${mm}-${dd}`;
// }

// /* Custom DropdownIndicator which includes a small add button next to indicator */
// function DropdownIndicatorWithAdd(props) {
//   const { selectProps } = props;
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//       <RSComponents.DropdownIndicator {...props} />
//       <button
//         type="button"
//         aria-label="Add new advisor"
//         onClick={(e) => {
//           e.stopPropagation();
//           if (selectProps && typeof selectProps.onAddNew === "function") selectProps.onAddNew();
//         }}
//         style={{
//           background: "transparent",
//           border: "none",
//           cursor: "pointer",
//           padding: 4,
//           display: "inline-flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <PlusCircle size={18} />
//       </button>
//     </div>
//   );
// }

// /**
//  * Props:
//  *  - open
//  *  - onClose
//  *  - onSave
//  *  - token
//  *  - mode ("participant" or "user")
//  *  - addUserPath (optional, fallback route if parent doesn't handle request) - default "/add-user"
//  *  - onRequestAddUser (optional) - parent callback invoked when user clicks "+" in advisor select; parent can switch tabs or open modal
//  */
// export default function AddParticipantForm({
//   open = false,
//   onClose,
//   onSave,
//   token: tokenProp,
//   mode = "participant",
//   addUserPath = "/add-user",
//   onRequestAddUser = null,
// }) {
//   // optional navigate (only used when parent didn't supply onRequestAddUser)
//   const navigateFn = useNavigate ? useNavigate() : null;

//   // participant fields
//   const [participantName, setParticipantName] = useState("");
//   const [isActive, setIsActive] = useState("Y");
//   const [openDate, setOpenDate] = useState(null);
//   const [closeDate, setCloseDate] = useState(null);
//   const [participantType, setParticipantType] = useState("");
//   const [participantFinancialAdvisor, setParticipantFinancialAdvisor] = useState(null);

//   const [firstName, setFirstName] = useState("");
//   const [middleName, setMiddleName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [suffix, setSuffix] = useState("");
//   const [organizationName, setOrganizationName] = useState("");
//   const [emailAddress, setEmailAddress] = useState("");
//   const [confirmEmail, setConfirmEmail] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [address1, setAddress1] = useState("");
//   const [address2, setAddress2] = useState("");
//   const [city, setCity] = useState("");
//   const [stateValue, setStateValue] = useState("");
//   const [postalCode, setPostalCode] = useState("");
//   const [country, setCountry] = useState("USA");

//   // user-specific
//   const [dateOfBirth, setDateOfBirth] = useState(null);
//   const [role, setRole] = useState("");

//   // UI
//   const [errorMessage, setErrorMessage] = useState("");
//   const [apiError, setApiError] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");
//   const [resolvedToken, setResolvedToken] = useState(tokenProp || null);

//   // advisors
//   const [financialAdvisorOptions, setFinancialAdvisorOptions] = useState([]);
//   const [loadingAdvisors, setLoadingAdvisors] = useState(false);

//   // auth
//   let authCtx = null;
//   if (useAuth) {
//     try {
//       authCtx = useAuth();
//     } catch (e) {
//       authCtx = null;
//     }
//   }

//   // Resolve token
//   useEffect(() => {
//     if (tokenProp) {
//       setResolvedToken(tokenProp);
//       return;
//     }
//     if (authCtx && authCtx.token) {
//       setResolvedToken(authCtx.token);
//       return;
//     }
//     try {
//       const stored =
//         localStorage.getItem("acg_token") ||
//         localStorage.getItem("token") ||
//         localStorage.getItem("access_token") ||
//         null;
//       setResolvedToken(stored);
//     } catch (e) {
//       console.warn("Could not read token from localStorage", e);
//       setResolvedToken(null);
//     }
//   }, [tokenProp, authCtx]);

//   // Load advisors
//   useEffect(() => {
//     let mounted = true;
//     async function loadAgents() {
//       setLoadingAdvisors(true);
//       const userIdFromCtx = authCtx?.user?.UserID || authCtx?.userId || localStorage.getItem("userId") || null;
//       try {
//         const opts = await fetchAgentNames(userIdFromCtx, resolvedToken);
//         if (mounted) setFinancialAdvisorOptions(opts || []);
//       } catch (err) {
//         console.error("[AddParticipantForm] loadAgents error:", err);
//         if (mounted) setFinancialAdvisorOptions([]);
//       } finally {
//         if (mounted) setLoadingAdvisors(false);
//       }
//     }
//     if (resolvedToken || authCtx) loadAgents();
//     return () => {
//       mounted = false;
//     };
//   }, [resolvedToken, authCtx]);

//   const fieldValues = {
//     participantName,
//     isActive,
//     openDate,
//     closeDate,
//     participantType,
//     participantFinancialAdvisor,
//     firstName,
//     middleName,
//     lastName,
//     suffix,
//     organizationName,
//     emailAddress,
//     confirmEmail,
//     phoneNumber,
//     address1,
//     address2,
//     city,
//     stateValue,
//     postalCode,
//     country,
//     dateOfBirth,
//     role,
//   };

//   function isVisible(fieldKey) {
//     const userOnly = new Set(["dateOfBirth", "role", "confirmEmail"]);
//     if (mode === "participant") return !userOnly.has(fieldKey);
//     if (mode === "user") {
//       const userFields = new Set([
//         "suffix",
//         "firstName",
//         "middleName",
//         "lastName",
//         "emailAddress",
//         "confirmEmail",
//         "phoneNumber",
//         "address1",
//         "address2",
//         "city",
//         "stateValue",
//         "postalCode",
//         "country",
//         "dateOfBirth",
//         "role",
//       ]);
//       return userFields.has(fieldKey);
//     }
//     return true;
//   }

//   function validateBeforeConfirm() {
//     if (mode === "user") {
//       if (!firstName || !lastName || !phoneNumber || !address1 || !city || !stateValue || !emailAddress) {
//         setErrorMessage("Please fill all mandatory personal and contact fields correctly.");
//         return false;
//       }
//       if (!confirmEmail) {
//         setErrorMessage("Please confirm the email address.");
//         return false;
//       }
//       if (emailAddress !== confirmEmail) {
//         setErrorMessage("Email and confirmation email do not match.");
//         return false;
//       }
//     } else {
//       if (
//         !participantName ||
//         !isActive ||
//         !firstName ||
//         !lastName ||
//         !phoneNumber ||
//         !address1 ||
//         !city ||
//         !stateValue ||
//         !emailAddress
//       ) {
//         setErrorMessage("Please fill all mandatory fields correctly.");
//         return false;
//       }
//     }

//     if (country && country.toUpperCase() === "USA") {
//       if (postalCode && postalCode.length !== 5) {
//         setErrorMessage("For USA, Postal Code must be 5 digits.");
//         return false;
//       }
//     }

//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
//     if (!emailPattern.test(emailAddress)) {
//       setErrorMessage("Please enter a valid email address.");
//       return false;
//     }

//     setErrorMessage("");
//     return true;
//   }

//   function buildParticipantPayload() {
//     return {
//       ParticipantName: participantName || null,
//       Suffix: suffix || null,
//       FirstName: firstName || null,
//       MiddleName: middleName || null,
//       LastName: lastName || null,
//       ParticipantType: participantType || null,
//       ParticipantFinancialAdvisor: participantFinancialAdvisor ? participantFinancialAdvisor.value : null,
//       ParticipantFinancialAdvisorName: participantFinancialAdvisor ? participantFinancialAdvisor.label : null,
//       OrganizationName: organizationName || null,
//       IsActive: isActive || "Y",
//       OpenDate: formatDateForApi(openDate),
//       CloseDate: formatDateForApi(closeDate),
//       EmailAddress: emailAddress || null,
//       PhoneNumber: phoneNumber || null,
//       Address1: address1 || null,
//       Address2: address2 || null,
//       City: city || null,
//       State: stateValue || null,
//       PostalCode: postalCode || null,
//       Country: country || null,
//       DateOfBirth: formatDateForApi(dateOfBirth),
//       Role: role || null,
//       Meta_Mode: mode,
//     };
//   }

//   function handleConfirmClick(e) {
//     e.preventDefault();
//     if (validateBeforeConfirm()) setShowConfirm(true);
//   }

//   async function handleAddClick() {
//     setSaving(true);
//     setApiError("");
//     setSuccessMessage("");

//     let useToken = resolvedToken;
//     if (!useToken) {
//       try {
//         useToken = localStorage.getItem("acg_token") || localStorage.getItem("token") || localStorage.getItem("access_token") || null;
//         if (useToken) setResolvedToken(useToken);
//       } catch (e) {
//         console.warn("Could not read token from localStorage in fallback", e);
//       }
//     }

//     if (!useToken) {
//       setApiError("Missing or invalid token. Please log in again.");
//       setSaving(false);
//       return;
//     }

//     const payload = buildParticipantPayload();
//     try {
//       const result = await apiAddParticipant(payload, useToken);
//       setSaving(false);
//       setShowConfirm(false);
//       handleClear();
//       setSuccessMessage(mode === "user" ? "User added successfully." : "Participant added successfully.");
//       if (onSave) onSave(result);
//       setTimeout(() => {
//         if (onClose) onClose();
//       }, 900);
//     } catch (err) {
//       console.error("[AddParticipantForm] handleAddClick error:", err);
//       setApiError((err && err.message) || "Failed to add participant (see console).");
//       setSaving(false);
//       setShowConfirm(false);
//     }
//   }

//   function handleClear() {
//     setParticipantName("");
//     setIsActive("Y");
//     setOpenDate(null);
//     setCloseDate(null);
//     setParticipantType("");
//     setParticipantFinancialAdvisor(null);
//     setFirstName("");
//     setMiddleName("");
//     setLastName("");
//     setSuffix("");
//     setOrganizationName("");
//     setEmailAddress("");
//     setConfirmEmail("");
//     setPhoneNumber("");
//     setAddress1("");
//     setAddress2("");
//     setCity("");
//     setStateValue("");
//     setPostalCode("");
//     setCountry("USA");
//     setDateOfBirth(null);
//     setRole("");
//     setErrorMessage("");
//     setApiError("");
//     setSuccessMessage("");
//   }


//   async function handleAddNewAdvisor() {
//     try {
//       if (typeof onRequestAddUser === "function") {
//         onRequestAddUser(); // parent will open Add User UI (eg. switch tab)
//         return;
//       }

//       if (typeof onClose === "function") onClose();

//       // small delay for animation
//       setTimeout(() => {
//         try {
//           if (navigateFn) navigateFn(addUserPath);
//           else window.location.href = addUserPath;
//         } catch (err) {
//           console.error("Navigation fallback failed, using location.href", err);
//           try {
//             window.location.href = addUserPath;
//           } catch (e) {
//             console.error("Final fallback navigation failed", e);
//           }
//         }
//       }, 60);
//     } catch (err) {
//       console.error("handleAddNewAdvisor error:", err);
//     }
//   }

//   const confirmDataSnapshot = buildParticipantPayload();
//   const emailsMatch = !confirmEmail || emailAddress === confirmEmail;

//   return (
//     <aside className={`details-sidebar${open ? " open" : ""}`} aria-hidden={!open}>
//       <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
//         <h2 style={{ margin: 0, fontSize: "1.32em" }}>{mode === "user" ? "Add New User" : "Add New Participant"}</h2>
//         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//           <button className="sidebar-close-btn" type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: "2em", color: "#051a36", cursor: "pointer", padding: "0 7px" }}>
//             ×
//           </button>
//         </div>
//       </div>

//       {successMessage && <div style={{ padding: "12px 20px", margin: "10px 20px", background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", borderRadius: "6px", fontWeight: 500 }}>{successMessage}</div>}
//       {apiError && <div style={{ padding: "12px 20px", margin: "10px 20px", background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontWeight: 500 }}>{apiError}</div>}
//       {errorMessage && <div style={{ padding: "12px 20px", margin: "10px 20px", background: "#fff3cd", color: "#856404", border: "1px solid #ffeaa7", borderRadius: "6px", fontWeight: 500 }}>{errorMessage}</div>}

//       {!showConfirm && (
//         <form className="sidebar-form" onSubmit={handleConfirmClick} noValidate>
//           <div style={{ display: "grid", gridTemplateColumns: mode === "user" ? "1fr" : "1fr 1fr", gap: 20 }}>
//             <div style={{ paddingRight: mode === "user" ? 0 : "20px", borderRight: mode === "user" ? "none" : "1px solid #d7d2d2" }}>
//               <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Personal Details</h4>

//               <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "620px", flexWrap: "wrap" }}>
//                 <label className="field" style={{ width: "100px" }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Suffix</span>
//                   <select value={suffix} onChange={(e) => setSuffix(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}>
//                     {suffixOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                   </select>
//                 </label>

//                 {isVisible("participantName") && (
//                   <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Participant Name {mode === "participant" ? "*" : ""}</span>
//                     <input type="text" placeholder="Participant Name" value={participantName} onChange={(e) => setParticipantName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                   </label>
//                 )}
//               </div>

//               <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
//                 <label className="field" style={{ flex: 1, minWidth: 140 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>First Name *</span>
//                   <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Middle Name</span>
//                   <input type="text" placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1, minWidth: 140 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Last Name *</span>
//                   <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>
//               </div>

//               {isVisible("dateOfBirth") && (
//                 <div style={{ display: "flex", gap: "10px", marginBottom: "16px", maxWidth: "600px", flexWrap: "wrap" }}>
//                   <label className="field" style={{ flex: 1, minWidth: 140 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Date of Birth</span>
//                     <div style={{ position: "relative" }}>
//                       <DatePicker selected={dateOfBirth} onChange={(d) => setDateOfBirth(d)} dateFormat="MM-dd-yyyy" placeholderText="MM-DD-YYYY" className="date-input-small" />
//                       <Calendar size={18} style={{ position: "absolute", right: "100px", top: "45%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }} />
//                     </div>
//                   </label>

//                   <label className="field" style={{ flex: 1, minWidth: 140 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Role</span>
//                     <input type="text" placeholder="Role (e.g., Admin, Editor)" value={role} onChange={(e) => setRole(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                   </label>
//                 </div>
//               )}

//               {isVisible("participantType") && (
//                 <div style={{ display: "flex", gap: "10px", marginBottom: "24px", maxWidth: "600px", flexWrap: "wrap" }}>
//                   <label className="field" style={{ flex: 1, maxWidth: 170 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Participant Type</span>
//                     <input type="text" placeholder="Donor / Investor / Other" value={participantType} onChange={(e) => setParticipantType(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                   </label>

//                   <label className="field" style={{ flex: 1, maxWidth: 170 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Is Active {mode === "participant" ? "*" : ""}</span>
//                     <select value={isActive} onChange={(e) => setIsActive(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}>
//                       <option value="Y">Yes</option>
//                       <option value="N">No</option>
//                     </select>
//                   </label>

//                   <label className="field" style={{ flex: 1, maxWidth: 140 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Open Date {mode === "participant" ? "*" : ""}</span>
//                     <div style={{ position: "relative" }}>
//                       <DatePicker selected={openDate} onChange={(date) => setOpenDate(date)} dateFormat="MM-dd-yyyy" placeholderText="Begin Date" className="date-input-small" />
//                       <Calendar size={18} style={{ position: "absolute", right: "10px", top: "45%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }} />
//                     </div>
//                   </label>
//                 </div>
//               )}

//               <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Contact Details</h4>

//               <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
//                 <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Email Address *</span>
//                   <input type="email" placeholder="Email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 {isVisible("confirmEmail") && (
//                   <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                     <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Confirm Email *</span>
//                     <input type="email" placeholder="Confirm Email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                     {confirmEmail && !emailsMatch && <div style={{ color: "#b91c1c", marginTop: 6, fontSize: 13 }}>Emails do not match</div>}
//                     {confirmEmail && emailsMatch && <div style={{ color: "#065f46", marginTop: 6, fontSize: 13 }}>Emails match</div>}
//                   </label>
//                 )}

//                 <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Phone Number *</span>
//                   <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>
//               </div>

//               <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
//                 <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Address Line 1 *</span>
//                   <input type="text" placeholder="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1, minWidth: 180 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Address Line 2</span>
//                   <input type="text" placeholder="Address Line 2 (optional)" value={address2} onChange={(e) => setAddress2(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>
//               </div>

//               <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
//                 <label className="field" style={{ flex: 1, minWidth: 120 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>City *</span>
//                   <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1, minWidth: 120 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>State *</span>
//                   <input type="text" placeholder="State" value={stateValue} onChange={(e) => setStateValue(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1, minWidth: 120 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Zipcode {country && country.toUpperCase() === "USA" ? "*" : ""}</span>
//                   <input type="text" placeholder="Zipcode" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ""))} minLength={country && country.toUpperCase() === "USA" ? 5 : 0} maxLength={5} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>

//                 <label className="field" style={{ flex: 1, minWidth: 120 }}>
//                   <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Country *</span>
//                   <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
//                 </label>
//               </div>
//             </div>

//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", paddingLeft: mode === "user" ? 0 : "20px" }}>
//               {isVisible("participantType") && mode === "participant" && (
//                 <div>
//                   <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Participation</h4>

//                   <div style={{ display: "flex", gap: "10px", marginBottom: "16px", maxWidth: "400px", flexWrap: "wrap" }}>
//                     <label className="field" style={{ flex: 1, minWidth: 200 }}>
//                       <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>Financial Advisor</span>

//                       <Select
//                         className="my-advisor-select"
//                         classNamePrefix="advisor"
//                         value={participantFinancialAdvisor}
//                         onChange={(opt) => setParticipantFinancialAdvisor(opt)}
//                         options={financialAdvisorOptions}
//                         isClearable
//                         placeholder="Financial Advisor by name or id..."
//                         components={{ DropdownIndicator: DropdownIndicatorWithAdd }}
//                         onAddNew={handleAddNewAdvisor}
//                         styles={{
//                           control: (provided) => ({ ...provided, borderColor: "#d1d5bd", boxShadow: "none!important", borderRadius: 6, minHeight: 8, "&:hover": { borderColor: "#d1d5db" } }),
//                           menu: (provided) => ({ ...provided, zIndex: 9999 }),
//                           singleValue: (provided) => ({ ...provided }),
//                           dropdownIndicator: (base) => ({ ...base, padding: 0 }),
//                           clearIndicator: (base) => ({ ...base, padding: 0 }),
//                           indicatorsContainer: (base) => ({ ...base, padding: 0 }),
//                           placeholder: (provided) => ({ ...provided, margin: 0, padding: 0, lineHeight: "20px", color: "#e1dfdf" }),
//                           valueContainer: (provided) => ({ ...provided, padding: "0 6px", margin: 0 }),
//                         }}
//                         formatOptionLabel={(option) => (
//                           <div style={{ display: "flex", gap: "6px" }}>
//                             <span style={{ fontWeight: 500 }}>{option.value}</span>
//                             <span style={{ opacity: 0.8 }}>– {option.label}</span>
//                           </div>
//                         )}
//                       />
//                     </label>
//                   </div>
//                 </div>
//               )}

//               <div style={{ display: "flex", gap: "12px", justifyContent: mode === "user" ? "center" : "flex-end", marginTop: "auto", paddingTop: "20px" }}>
//                 <button type="button" className="btn" style={{ color: "#051A36", padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: 500, cursor: anyFieldFilled(fieldValues) ? "pointer" : "not-allowed", fontSize: "14px" }} onClick={handleClear} disabled={!anyFieldFilled(fieldValues)}>Clear</button>

//                 <button type="submit" className="btn primary" disabled={saving} style={{ background: "#051A36", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>
//                   {saving ? "Submitting..." : "Confirm"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </form>
//       )}

//       {showConfirm && (
//         <div className="confirmation-modal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center" }}>
//           <div style={{ background: "#fff", borderRadius: "7px", padding: "28px 46px", boxShadow: "0 5px 30px rgba(0,0,0,0.13)", maxHeight: "80vh", overflowY: "auto" }}>
//             <h2>Confirmation</h2>
//             <ul style={{ fontSize: 16, paddingLeft: 12 }}>
//               {Object.entries(confirmDataSnapshot).map(([key, value]) => {
//                 const fieldKeyMap = {
//                   ParticipantName: "ParticipantName",
//                   Suffix: "Suffix",
//                   FirstName: "FirstName",
//                   MiddleName: "MiddleName",
//                   LastName: "LastName",
//                   ParticipantType: "ParticipantType",
//                   ParticipantFinancialAdvisor: "ParticipantFinancialAdvisor",
//                   ParticipantFinancialAdvisorName: "ParticipantFinancialAdvisorName",
//                   OrganizationName: "OrganizationName",
//                   IsActive: "IsActive",
//                   OpenDate: "OpenDate",
//                   CloseDate: "CloseDate",
//                   EmailAddress: "EmailAddress",
//                   PhoneNumber: "PhoneNumber",
//                   Address1: "Address1",
//                   Address2: "Address2",
//                   City: "City",
//                   State: "State",
//                   PostalCode: "PostalCode",
//                   Country: "Country",
//                   DateOfBirth: "DateOfBirth",
//                   Role: "Role",
//                   Meta_Mode: "Mode",
//                 };

//                 if (!Object.prototype.hasOwnProperty.call(fieldKeyMap, key)) return null;

//                 const visKey = (() => {
//                   if (key === "DateOfBirth") return isVisible("dateOfBirth");
//                   if (key === "Role") return isVisible("role");
//                   if (key === "EmailAddress") return isVisible("emailAddress");
//                   if (mode === "participant") return true;
//                   const userVisibleKeys = new Set(["ParticipantName", "Suffix", "FirstName", "MiddleName", "LastName", "EmailAddress", "PhoneNumber", "Address1", "Address2", "City", "State", "PostalCode", "Country", "DateOfBirth", "Role", "Meta_Mode"]);
//                   return userVisibleKeys.has(key);
//                 })();

//                 if (!visKey) return null;

//                 let displayVal = value === null || value === "" ? <em>(empty)</em> : value;
//                 return (
//                   <li key={key} style={{ marginBottom: 6 }}>
//                     <strong>{fieldKeyMap[key]}</strong>: {(key === "OpenDate" || key === "CloseDate" || key === "DateOfBirth") ? (value || <em>(empty)</em>) : displayVal}
//                   </li>
//                 );
//               })}
//             </ul>

//             <div style={{ marginTop: 24 }}>
//               <button className="btn primary" disabled={saving} onClick={handleAddClick} style={{ background: "#051A36", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>
//                 {saving ? "Adding..." : "Add"}
//               </button>

//               <button className="btn ghost" style={{ marginLeft: 12, background: "#fff", color: "#051A36", padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }} onClick={() => setShowConfirm(false)}>Edit</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </aside>
//   );
// }
// src/Forms/Form.jsx
import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select, { components as RSComponents } from "react-select";
import { Calendar, PlusCircle } from "lucide-react";
import { fetchAgentNames, addParticipant as apiAddParticipant } from "../../../AuthContext/Api.jsx";
import "./Form.scss";

let useAuth = null;
try {
  useAuth = require("../../AuthContext/AuthProvider.jsx").useAuth;
} catch (e) {
  useAuth = null;
}

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
    if (typeof val === "object") return Object.keys(val).length > 0;
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

/* Custom DropdownIndicator which includes a small add button next to indicator */
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
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PlusCircle size={18} />
      </button>
    </div>
  );
}


const AddParticipantForm = forwardRef(function AddParticipantForm(
  {
    open = false,
    onClose,
    onSave,
    token: tokenProp,
    mode = "participant",
    addUserPath = "/add-user",
    onRequestAddUser = null,
  },
  ref
) {
  // participant fields
  const [participantName, setParticipantName] = useState("");
  const [isActive, setIsActive] = useState("Y");
  const [openDate, setOpenDate] = useState(null);
  const [closeDate, setCloseDate] = useState(null);
  const [participantType, setParticipantType] = useState("");
  const [participantFinancialAdvisor, setParticipantFinancialAdvisor] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");

  // user-specific additions
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [role, setRole] = useState("");

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resolvedToken, setResolvedToken] = useState(tokenProp || null);

  // advisor select
  const [financialAdvisorOptions, setFinancialAdvisorOptions] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  // auth context (optional)
  let authCtx = null;
  if (useAuth) {
    try {
      authCtx = useAuth();
    } catch (e) {
      authCtx = null;
    }
  }

  // Resolve token (prop -> authCtx -> localStorage)
  useEffect(() => {
    if (tokenProp) {
      setResolvedToken(tokenProp);
      return;
    }
    if (authCtx && authCtx.token) {
      setResolvedToken(authCtx.token);
      return;
    }
    try {
      const stored =
        localStorage.getItem("acg_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        null;
      setResolvedToken(stored);
    } catch (e) {
      console.warn("Could not read token from localStorage", e);
      setResolvedToken(null);
    }
  }, [tokenProp, authCtx]);

  // Load advisors
  useEffect(() => {
    let mounted = true;
    async function loadAgents() {
      setLoadingAdvisors(true);

      const userIdFromCtx = authCtx?.user?.UserID || authCtx?.userId || localStorage.getItem("userId") || null;

      try {
        const opts = await fetchAgentNames(userIdFromCtx, resolvedToken);
        if (mounted) setFinancialAdvisorOptions(opts || []);
      } catch (err) {
        console.error("[AddParticipantForm] loadAgents error:", err);
        if (mounted) setFinancialAdvisorOptions([]);
      } finally {
        if (mounted) setLoadingAdvisors(false);
      }
    }

    if (resolvedToken || authCtx) {
      loadAgents();
    }

    return () => {
      mounted = false;
    };
  }, [resolvedToken, authCtx]);

  const fieldValues = {
    participantName,
    isActive,
    openDate,
    closeDate,
    participantType,
    participantFinancialAdvisor,
    firstName,
    middleName,
    lastName,
    suffix,
    organizationName,
    emailAddress,
    confirmEmail,
    phoneNumber,
    address1,
    address2,
    city,
    stateValue,
    postalCode,
    country,
    dateOfBirth,
    role,
  };

  // Helper: decide whether a field/section should be visible for the current mode
  function isVisible(fieldKey) {
    // user-only fields
    const userOnly = new Set(["dateOfBirth", "role", "confirmEmail"]);
    if (mode === "participant") {
      return !userOnly.has(fieldKey); // hide user-only fields in participant mode
    }
    if (mode === "user") {
      const userFields = new Set([
        // personal
        "suffix",
        "firstName",
        "middleName",
        "lastName",
        // contact
        "emailAddress",
        "confirmEmail",
        "phoneNumber",
        "address1",
        "address2",
        "city",
        "stateValue",
        "postalCode",
        "country",
        // user extras
        "dateOfBirth",
        "role",
      ]);
      return userFields.has(fieldKey);
    }
    return true;
  }

  function validateBeforeConfirm() {
    // For user mode only check personal + contact required fields + email match.
    if (mode === "user") {
      if (!firstName || !lastName || !phoneNumber || !address1 || !city || !stateValue || !emailAddress) {
        setErrorMessage("Please fill all mandatory personal and contact fields correctly.");
        return false;
      }
      if (!confirmEmail) {
        setErrorMessage("Please confirm the email address.");
        return false;
      }
      if (emailAddress !== confirmEmail) {
        setErrorMessage("Email and confirmation email do not match.");
        return false;
      }
    } else {
      // participant mode: original checks
      if (
        !participantName ||
        !isActive ||
        !firstName ||
        !lastName ||
        !phoneNumber ||
        !address1 ||
        !city ||
        !stateValue ||
        !emailAddress
      ) {
        setErrorMessage("Please fill all mandatory fields correctly.");
        return false;
      }
    }

    if (country && country.toUpperCase() === "USA") {
      if (postalCode && postalCode.length !== 5) {
        setErrorMessage("For USA, Postal Code must be 5 digits.");
        return false;
      }
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(emailAddress)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function buildParticipantPayload() {
    // include fields that might be needed; backend can ignore unused ones
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
      CloseDate: formatDateForApi(closeDate),
      EmailAddress: emailAddress || null,
      PhoneNumber: phoneNumber || null,
      Address1: address1 || null,
      Address2: address2 || null,
      City: city || null,
      State: stateValue || null,
      PostalCode: postalCode || null,
      Country: country || null,
      DateOfBirth: formatDateForApi(dateOfBirth),
      Role: role || null,
      Meta_Mode: mode, // helpful for backend to know the intent
    };
  }

  function handleConfirmClick(e) {
    e && e.preventDefault && e.preventDefault();
    if (validateBeforeConfirm()) {
      setShowConfirm(true);
    }
  }

  async function handleAddClick() {
    setSaving(true);
    setApiError("");
    setSuccessMessage("");

    let useToken = resolvedToken;
    if (!useToken) {
      try {
        useToken = localStorage.getItem("acg_token") || localStorage.getItem("token") || localStorage.getItem("access_token") || null;
        if (useToken) setResolvedToken(useToken);
      } catch (e) {
        console.warn("Could not read token from localStorage in fallback", e);
      }
    }

    if (!useToken) {
      setApiError("Missing or invalid token. Please log in again.");
      setSaving(false);
      return;
    }

    const payload = buildParticipantPayload();
    console.log("Submitting participant:", payload);

    try {
      const result = await apiAddParticipant(payload, useToken);
      setSaving(false);
      setShowConfirm(false);
      console.log("API success response:", result);
      handleClear();
      setSuccessMessage(mode === "user" ? "User added successfully." : "Participant added successfully.");
      if (onSave) onSave(result);
      setTimeout(() => {
        if (onClose) onClose();
      }, 900);
    } catch (err) {
      console.error("[AddParticipantForm] handleAddClick error:", err);
      setApiError((err && err.message) || "Failed to add participant (see console).");
      setSaving(false);
      setShowConfirm(false);
    }
  }

  function handleClear() {
    setParticipantName("");
    setIsActive("Y");
    setOpenDate(null);
    setCloseDate(null);
    setParticipantType("");
    setParticipantFinancialAdvisor(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setOrganizationName("");
    setEmailAddress("");
    setConfirmEmail("");
    setPhoneNumber("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setStateValue("");
    setPostalCode("");
    setCountry("USA");
    setDateOfBirth(null);
    setRole("");
    setErrorMessage("");
    setApiError("");
    setSuccessMessage("");
  }

  // Simple example add-new-advisor flow. Replace this with your own modal + backend call.
  async function handleAddNewAdvisor() {
    try {
      if (typeof onRequestAddUser === "function") {
        onRequestAddUser();
        return;
      }
      // fallback navigation + close
      if (typeof onClose === "function") onClose();
      setTimeout(() => {
        try {
          window.location.href = addUserPath;
        } catch (e) {
          console.error("Failed to navigate to add user:", e);
        }
      }, 60);
    } catch (err) {
      console.error("handleAddNewAdvisor error:", err);
    }
  }

  const confirmDataSnapshot = buildParticipantPayload();
  const emailsMatch = !confirmEmail || emailAddress === confirmEmail;

  // Imperative handle to allow parent to trigger confirm/clear
  useImperativeHandle(ref, () => ({
    requestConfirm: () => {
      return validateBeforeConfirm() ? (setShowConfirm(true), true) : false;
    },
    clear: () => handleClear(),
    submitAdd: () => handleAddClick(),
    isSaving: () => !!saving,
    hasAnyField: () => anyFieldFilled(fieldValues),
  }));

  return (
    <aside className={`details-sidebar${open ? " open" : ""}`} aria-hidden={!open}>
      <div
        className="sidebar-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}
      >
        <h2 style={{ margin: 0, fontSize: "1.32em" }}>{mode === "user" ? "Add New User" : "Add New Participant"}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="sidebar-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: "2em", color: "#051a36", cursor: "pointer", padding: "0 7px" }}
          >
            ×
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{
          padding: "12px 20px",
          margin: "10px 20px",
          background: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          borderRadius: "6px",
          fontWeight: 500
        }}>
          {successMessage}
        </div>
      )}

      {apiError && (
        <div style={{
          padding: "12px 20px",
          margin: "10px 20px",
          background: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "6px",
          fontWeight: 500
        }}>
          {apiError}
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: "12px 20px",
          margin: "10px 20px",
          background: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          fontWeight: 500
        }}>
          {errorMessage}
        </div>
      )}

      {/* Note: Confirm and Clear buttons removed from here. Parent shows them in CreateNew. */}
      {!showConfirm && (
        <form className="sidebar-form" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* grid switches to single-column for user mode */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mode === "user" ? "1fr" : "1fr 1fr",
              gap: 20,
            }}
          >
            <div style={{ paddingRight: mode === "user" ? 0 : "20px", borderRight: mode === "user" ? "none" : "1px solid #d7d2d2" }}>
              <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Personal Details</h4>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
                <label className="field" style={{ width: "100px" }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Suffix
                  </span>
                  <select value={suffix} onChange={(e) => setSuffix(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}>
                    {suffixOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                
    <label className="field" style={{ flex: 1, minWidth: 180 }}>
      <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
        Participant Name {mode === "participant" ? "*" : ""}
      </span>
      <input
        type="text"
        placeholder="Participant Name"
        value={participantName}
        onChange={(e) => setParticipantName(e.target.value)}
        style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }}
      />
    </label>
                
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
                <label className="field" style={{ flex: 1, minWidth: 140 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    First Name *
                  </span>
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                <label className="field" style={{ flex: 1,  }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Middle Name
                  </span>
                  <input type="text" placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                <label className="field" style={{ flex: 1, minWidth: 140 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Last Name *
                  </span>
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>
              </div>

              {isVisible("dateOfBirth") && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", maxWidth: "600px", flexWrap: "wrap" }}>
                  <label className="field" style={{ flex: 1, minWidth: 140 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Date of Birth
                    </span>
                    <div style={{ position: "relative" }}>
                      <DatePicker selected={dateOfBirth} onChange={(d) => setDateOfBirth(d)} dateFormat="MM-dd-yyyy" placeholderText="MM-DD-YYYY" className="date-input-small" />
                      <Calendar
                        size={18}
                        style={{ position: "absolute", right: "100px", top: "45%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}
                      />
                    </div>
                  </label>

                  <label className="field" style={{ flex: 1, minWidth: 140 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Role
                    </span>
                    <input type="text" placeholder="Role (e.g., Admin,Donor,Advisor)" value={role} onChange={(e) => setRole(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", }} />
                  </label>
                </div>
              )}

              {isVisible("participantType") && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", maxWidth: "600px", flexWrap: "wrap" }}>
                  <label className="field" style={{ flex: 1, maxWidth: 190 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Participant Type
                    </span>
                    <input type="text" placeholder="Donor / Investor / Other" value={participantType} onChange={(e) => setParticipantType(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                  </label>

                  <label className="field" style={{ flex: 1, maxWidth: 190 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Is Active {mode === "participant" ? "*" : ""}
                    </span>
                    <select value={isActive} onChange={(e) => setIsActive(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }}>
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </label>

                  <label className="field" style={{ flex: 1, maxWidth: 170 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Open Date {mode === "participant" ? "*" : ""}
                    </span>
                    <div style={{ position: "relative" }}>
                      <DatePicker selected={openDate} onChange={(date) => setOpenDate(date)} dateFormat="MM-dd-yyyy" placeholderText="Begin Date" className="date-input-small" />
                      <Calendar
                        size={18}
                        style={{ position: "absolute", right: "10px", top: "45%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}
                      />
                    </div>
                  </label>
                </div>
              )}

              <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Contact Details</h4>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
                <label className="field" style={{ flex: 1, minWidth: 180 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Email Address *
                  </span>
                  <input type="email" placeholder="Email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                {isVisible("confirmEmail") && (
                  <label className="field" style={{ flex: 1, minWidth: 180 }}>
                    <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                      Confirm Email *
                    </span>
                    <input type="email" placeholder="Confirm Email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                    {/* live feedback */}
                    {confirmEmail && !emailsMatch && (
                      <div style={{ color: "#b91c1c", marginTop: 6, fontSize: 13 }}>Emails do not match</div>
                    )}
                    {confirmEmail && emailsMatch && (
                      <div style={{ color: "#065f46", marginTop: 6, fontSize: 13 }}>Emails match</div>
                    )}
                  </label>
                )}
              
                <label className="field" style={{ flex: 1, minWidth: 180 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Phone Number *
                  </span>
                  <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
                <label className="field" style={{ flex: 1, minWidth: 180 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Address Line 1 *
                  </span>
                  <input type="text" placeholder="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                <label className="field" style={{ flex: 1, minWidth: 180 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Address Line 2
                  </span>
                  <input type="text" placeholder="Address Line 2 (optional)" value={address2} onChange={(e) => setAddress2(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", width: "100%", maxWidth: "600px", flexWrap: "wrap" }}>
                <label className="field" style={{ flex: 1, minWidth: 120 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    City *
                  </span>
                  <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                <label className="field" style={{ flex: 1, minWidth: 120 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    State *
                  </span>
                  <input type="text" placeholder="State" value={stateValue} onChange={(e) => setStateValue(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>

                <label className="field" style={{ flex: 1, minWidth: 120 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Zipcode {country && country.toUpperCase() === "USA" ? "*" : ""}
                  </span>
                  <input
                    type="text"
                    placeholder="Zipcode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ""))}
                    minLength={country && country.toUpperCase() === "USA" ? 5 : 0}
                    maxLength={5}
                    style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }}
                  />
                </label>

                <label className="field" style={{ flex: 1, minWidth: 120 }}>
                  <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                    Country *
                  </span>
                  <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px",  }} />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", paddingLeft: mode === "user" ? 0 : "20px" }}>
              {/* Participation block: show only in participant mode */}
              {isVisible("participantType") && mode === "participant" && (
                <div>
                  <h4 style={{ marginBottom: 16, color: "#051A36", fontSize: "16px", fontWeight: 600 }}>Participation</h4>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px",  maxWidth: "400px", flexWrap: "wrap" }}>
                    <label className="field" style={{ flex: 1, minWidth: 200 }}>
                      <span className="field-label" style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px", display: "block" }}>
                        Financial Advisor
                      </span>

                      <Select
                        className="my-advisor-select"
                        classNamePrefix="advisor"
                        value={participantFinancialAdvisor}
                        onChange={(opt) => setParticipantFinancialAdvisor(opt)}
                        options={financialAdvisorOptions}
                        isClearable
                        // isLoading={loadingAdvisors}
                        placeholder="Financial Advisor by name or id..."
                        components={{ DropdownIndicator: DropdownIndicatorWithAdd }}
                        onAddNew={handleAddNewAdvisor}
                        styles={{
                          control: (provided) => ({ ...provided,borderColor:"#d1d5bd",boxShadow:"none!important", borderRadius: 6, minHeight:8,"&:hover":{borderColor:"#d1d5db"}}),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                          singleValue: (provided) => ({ ...provided }),
                          dropdownIndicator: (base) => ({ ...base,padding: 0, }),
                          clearIndicator: (base) => ({...base,padding: 0,}),
                          indicatorsContainer: (base) => ({...base,padding: 0,}),
                          placeholder: (provided) => ({ ...provided, margin: 0, padding: 0, lineHeight: '20px',color:"#e1dfdf" }),
                          valueContainer: (provided) => ({ ...provided, padding: '0 6px', margin: 0 }),
                        }}
                        formatOptionLabel={(option) => (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <span style={{ fontWeight: 500 }}>{option.value}</span>
                            <span style={{ opacity: 0.8 }}>– {option.label}</span>
                          </div>
                        )}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* NOTE: Confirm & Clear removed from here. Parent will control them. */}
              <div style={{ height: 1 }} />
            </div>
          </div>
        </form>
      )}

      {showConfirm && (
        <div
          className="confirmation-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.30)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "7px", padding: "28px 46px", boxShadow: "0 5px 30px rgba(0,0,0,0.13)", maxHeight: "80vh", overflowY: "auto" }}>
            <h2>Confirmation</h2>
            <ul style={{ fontSize: 16, paddingLeft: 12 }}>
              {Object.entries(confirmDataSnapshot).map(([key, value]) => {
                // Only show keys relevant for this mode (avoid huge dump)
                const fieldKeyMap = {
                  ParticipantName: "ParticipantName",
                  Suffix: "Suffix",
                  FirstName: "FirstName",
                  MiddleName: "MiddleName",
                  LastName: "LastName",
                  ParticipantType: "ParticipantType",
                  ParticipantFinancialAdvisor: "ParticipantFinancialAdvisor",
                  ParticipantFinancialAdvisorName: "ParticipantFinancialAdvisorName",
                  OrganizationName: "OrganizationName",
                  IsActive: "IsActive",
                  OpenDate: "OpenDate",
                  CloseDate: "CloseDate",
                  EmailAddress: "EmailAddress",
                  PhoneNumber: "PhoneNumber",
                  Address1: "Address1",
                  Address2: "Address2",
                  City: "City",
                  State: "State",
                  PostalCode: "PostalCode",
                  Country: "Country",
                  DateOfBirth: "DateOfBirth",
                  Role: "Role",
                  Meta_Mode: "Mode",
                };

                if (!Object.prototype.hasOwnProperty.call(fieldKeyMap, key)) return null;

                const visKey = (() => {
                  if (key === "DateOfBirth") return isVisible("dateOfBirth");
                  if (key === "Role") return isVisible("role");
                  if (key === "EmailAddress") return isVisible("emailAddress");
                  if (mode === "participant") return true;
                  const userVisibleKeys = new Set([
                    "ParticipantName","Suffix","FirstName","MiddleName","LastName",
                    "EmailAddress","PhoneNumber","Address1","Address2","City","State","PostalCode","Country","DateOfBirth","Role","Meta_Mode"
                  ]);
                  return userVisibleKeys.has(key);
                })();

                if (!visKey) return null;

                let displayVal = value === null || value === "" ? <em>(empty)</em> : value;
                return (
                  <li key={key} style={{ marginBottom: 6 }}>
                    <strong>{fieldKeyMap[key]}</strong>: {(key === "OpenDate" || key === "CloseDate" || key === "DateOfBirth") ? (value || <em>(empty)</em>) : displayVal}
                  </li>
                );
              })}
            </ul>

            <div style={{ marginTop: 24 }}>
              <button
                className="btn primary"
                disabled={saving}
                onClick={handleAddClick}
                style={{ background: "#051A36", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}
              >
                {saving ? "Adding..." : "Add"}
              </button>

              <button
                className="btn ghost"
                style={{ marginLeft: 12, background: "#fff", color: "#051A36", padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}
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
});

export default AddParticipantForm;
