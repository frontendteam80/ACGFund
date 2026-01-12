
// import React from "react";
// import { Formik, Form } from "formik";
// import * as Yup from "yup";
// import Select from "react-select";
// import { components } from "react-select";
// import { useAuth } from "../../../AuthContext/AuthContext.jsx";
// import api from "../../../AuthContext/Api.jsx";
// import Table from "../../Utilites/Table/Table.jsx";
// import SearchBar from "../../Utilites/SearchBar/SearchBar.jsx";
// import Loader from "../../Utilites/Loader/Loader.jsx";
// import "../DataMapping.scss";

// /* ---------------- Validation Schema ---------------- */
// const validationSchema = Yup.object({
//   AdminCustomReportName: Yup.string().min(3).required("Report Name is required"),
//   AdminCustomReportProcedure: Yup.string().required("Procedure Name is required"),
//   DisplayOrderID: Yup.number().typeError("Must be number").required(),
//   DisplayView: Yup.string().oneOf(["Sidebar", "Scroll"]).required(),
//   RequiresBeginDate: Yup.string().oneOf(["Y", "N"]).required(),
//   RequiresEndDate: Yup.string().oneOf(["Y", "N"]).required(),
// });

// /* Checkbox option for react-select */
// const CheckboxOption = (props) => (
//   <components.Option {...props}>
//     <input
//       type="checkbox"
//       checked={props.isSelected}
//       readOnly
//       style={{ marginRight: 8 }}
//     />
//     {props.label}
//   </components.Option>
// );

// export default function CustomReportForm({ onSubmit }) {
  
//   const { token, user } = useAuth();
//   const [userOptions, setUserOptions] = React.useState([]);
//   const [loadingUsers, setLoadingUsers] = React.useState(false);
//   const [processMessage, setProcessMessage] = React.useState("");
//   const [processCode, setProcessCode] = React.useState(null);
//   const [reports, setReports] = React.useState([]);
//   const [loadingReports, setLoadingReports] = React.useState(false);
//   const [searchTerm, setSearchTerm] = React.useState("");
 
//   React.useEffect(() => {
//     async function loadUsers() {
//       if (!token) return;

//       setLoadingUsers(true);
//       try {
//         const users = await api.fetchAdminUserIds(token);

//         const options = users.map((u) => ({
//           value: u.Id,
//           label: u.UserName,
//         }));

//         setUserOptions(options);
//       } catch (e) {
//         console.error("Failed to load user IDs", e);
//         setUserOptions([]);
//       } finally {
//         setLoadingUsers(false);
//       }
//     }

//     loadUsers();
//   }, [token]);

//   const loadCustomReports = React.useCallback(async () => {
//   if (!token) return;

//   setLoadingReports(true);
//   try {
//     const resp = await api.fetchCustomReportswithusers(token);
//     setReports(Array.isArray(resp) ? resp : []);
//   } catch (e) {
//     console.error("Failed to load custom reports", e);
//     setReports([]);
//   } finally {
//     setLoadingReports(false);
//   }
// }, [token]);

// React.useEffect(() => {
//   loadCustomReports();
// }, [loadCustomReports]);

// const filteredReports = React.useMemo(() => {
//   if (!searchTerm.trim()) return reports;

//   const term = searchTerm.toLowerCase();
//   return reports.filter((row) =>
//     Object.values(row).some((v) =>
//       String(v ?? "").toLowerCase().includes(term)
//     )
//   );
// }, [reports, searchTerm]);

// const tableColumns = [
//   { key: "AdminCustomReportID", label: "Report ID" },
//   { key: "AdminCustomReportName", label: "Report Name" },
//   { key: "AdminCustomReportProcedure", label: "Procedure Name" },
//   { key: "DisplayView", label: "View" },
//   { key: "DisplayOrderID", label: "Display Order" },
//   { key: "RequiresBeginDate", label: "Begin Date" },
//   { key: "RequiresEndDate", label: "End Date" },
//   { key: "AccessUserNames", label: "Allowed Users" },
//   { key: "AccessAddedByUserName", label: "Created By" },
// ];

//   return (
//     <Formik
//       initialValues={{
//         AdminCustomReportName: "",
//         AdminCustomReportProcedure: "",
//         DisplayOrderID: 1,
//         DisplayView: "Sidebar",
//         RequiresBeginDate: "N",
//         RequiresEndDate: "N",
//         UserIDsCSV: [], 
//       }}
//       validationSchema={validationSchema}
//       onSubmit={async (values, { setSubmitting, resetForm }) => {
//   try {
//      const payload = {
//       ...values,
//       UserIDsCSV: Array.isArray(values.UserIDsCSV)
//         ? values.UserIDsCSV.join(",")
//         : values.UserIDsCSV,
//       AccessAddedBy: user?.id,
//     };

//     console.log("FINAL PAYLOAD:", payload);

    
//     // await api.addCustomReportWithUsers(payload, token);
//     const resp = await api.addCustomReportWithUsers(payload, token);

//     setProcessMessage(resp?.processMessage || "Saved successfully");
//     setProcessCode(resp?.ProcessCode);

//     if (resp?.ProcessCode === 0) {
//       resetForm();
//       loadCustomReports();
//     }
//   } catch (err) {
//     setProcessMessage("Failed to save custom report");
//     setProcessCode(1);
//     console.error(err);
//   } finally {
//     setSubmitting(false);
//   }
// }}

//     >
//       {({ values, errors, touched, handleChange, setFieldValue }) => (
//         <>
//         <Form className="mapping-form MainContent-card">
//             {processMessage && (
//             <div
//                 className={`process-msg ${
//                 processCode === 0 ? "process-success" : "process-error"
//                 }`}
//             >
//                 {processMessage}
//             </div>
//             )}

//           <h2 className="form-title"> Custom Report Setup</h2>

//           {/* ROW 1 */}
//           <div className="form-row three">
//             <div className="form-field ">
//               <label>Report Name *</label>
//               <input
//                 name="AdminCustomReportName"
//                 value={values.AdminCustomReportName}
//                 onChange={handleChange}
//               />
//               {touched.AdminCustomReportName && (
//                 <div className="error">{errors.AdminCustomReportName}</div>
//               )}
//             </div>

//             <div className="form-field">
//               <label>Procedure Name *</label>
//               <input
//                 name="AdminCustomReportProcedure"
//                 value={values.AdminCustomReportProcedure}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="form-field">
//               <label>Display View *</label>
//               <select
//                 name="DisplayView"
//                 value={values.DisplayView}
//                 onChange={handleChange}
//               >
//                 <option value="Sidebar">Sidebar</option>
//                 <option value="Scroll">Scroll</option>
//               </select>
//             </div>

//             <div className="form-field">
//               <label>Display Order *</label>
//               <input
//                 type="number"
//                 name="DisplayOrderID"
//                 value={values.DisplayOrderID}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           {/* ROW 2 */}
//           <div className="form-row two">

// //             {/* ACCESS */}
//             <div>
//               <div className="form-section-title">Access</div>
//               <div className="form-field">
//                 <label>User IDs *</label>

//                 <Select
//                   options={userOptions}
//                   isMulti
//                 //   isLoading={loadingUsers}
//                   closeMenuOnSelect={false}
//                   hideSelectedOptions={false}
//                   components={{ Option: CheckboxOption }}
//                   placeholder="Select User IDs"
//                   value={userOptions.filter((opt) =>
//                     values.UserIDsCSV.includes(opt.value)
//                   )}
//                   onChange={(selected) => {
//                     const ids = selected
//                       ? selected.map((o) => o.value)
//                       : [];
//                     setFieldValue("UserIDsCSV", ids);
//                   }}
//                   styles={{
//                 control: (provided) => ({
//                   ...provided,
//                   minHeight:26,
//                 //   maxHeight: 26,
//                   fontSize: "12px",
//                   borderRadius:"8px",
//                   boxShadow: "none",
//                   borderColor:"#d1d5db",
//                 //   width:595,
//                    padding: 0 , 
//                 }),
//                 option: (provided, state) => ({
//                 ...provided,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",

//                 /* remove default blue */
//                 backgroundColor: state.isSelected
//                     ? "#ccccccff"     
                         
//                     : "#ffffff",

//                 color:  "#0f172a",

//                 cursor: "pointer",
//                 fontSize: "12px",
//                 }),
//                 menu: (provided) => ({
//                   ...provided,
//                   zIndex: 9999,
//                   fontSize: "12px",
//                 }),
//                 dropdownIndicator: (base) => ({ ...base, padding: 0 }),
//                 clearIndicator: (base) => ({ ...base, padding: 0 }),
//                 indicatorsContainer: (base) => ({ ...base, padding: 0 }),
//               }}
            
//                 />
//               </div>
//             </div>

//             {/* DATE FILTERS */}
//             <div>
//               <div className="form-section-title">Date Filters</div>

//               <div className="Date-fields">
//                 <div className="form-field BeginDate">
//                 <label>Requires Begin Date</label>
//                 <select
//                     name="RequiresBeginDate"
//                     value={values.RequiresBeginDate}
//                     onChange={handleChange}
//                 >
//                     <option value="N">No</option>
//                     <option value="Y">Yes</option>
//                 </select>
//                 </div>

//                 <div className="form-field EndDate">
//                 <label>Requires End Date</label>
//                 <select
//                     name="RequiresEndDate"
//                     value={values.RequiresEndDate}
//                     onChange={handleChange}
//                 >
//                     <option value="N">No</option>
//                     <option value="Y">Yes</option>
//                 </select>
//                 </div>
//             </div>
            
// //             </div>
// //           </div>

//           {/* ACTIONS */}
//           <div className="form-actions">
//             <button className="btn primary" type="submit">Save</button>
//             <button className="btn ghost" type="reset">Clear</button>
            
//           </div>
//         </Form>
//         <div className="MainContent-card" style={{ marginTop: 20 }}>
//           <div className="header-searchbar">
//       <h2 className="form-title">Existing Custom Reports</h2>
//       <SearchBar
//           value={searchTerm}
//           onChange={setSearchTerm}
//           onSearch={setSearchTerm}
//           placeholder="Search CustomReports..."
//         />
//         </div>

//       {loadingReports ? (
//         <Loader size={20} text="Loading reports..." />
//       ) : reports.length > 0 ? (
//         <Table
//           columns={tableColumns}
//           data={filteredReports}
//           // data={reports}
//         />
//       ) : (
//         <div style={{ padding: 16, color: "#6b7280" }}>
//           No custom reports found.
//         </div>
//       )}
//     </div>
//   </>
// )}
      
//     </Formik>
//   );
// }


import React, { useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Select, { components } from "react-select";
import SlidePanel from "../../Utilites/SlidePanel/SlidePanel.jsx";
import Table from "../../Utilites/Table/Table.jsx";
import SearchBar from "../../Utilites/SearchBar/SearchBar.jsx";
import Loader from "../../Utilites/Loader/Loader.jsx";
import { useAuth } from "../../../AuthContext/AuthContext.jsx";
import api from "../../../AuthContext/Api.jsx";
import "../DataMapping.scss";

/* ---------------- Validation Schema ---------------- */
const validationSchema = Yup.object({
  AdminCustomReportName: Yup.string().min(3).required("Report Name is required"),
  AdminCustomReportProcedure: Yup.string().required("Procedure Name is required"),
  DisplayOrderID: Yup.number().typeError("Must be number").required(),
  DisplayView: Yup.string().oneOf(["Sidebar", "Scroll"]).required(),
  RequiresBeginDate: Yup.string().oneOf(["Y", "N"]).required(),
  RequiresEndDate: Yup.string().oneOf(["Y", "N"]).required(),
});

/* Checkbox option for react-select */
const CheckboxOption = (props) => (
  <components.Option {...props}>
    <input type="checkbox" checked={props.isSelected} readOnly />
    {props.label}
  </components.Option>
);

export default function CustomReports() {
  const { token, user } = useAuth();

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [userOptions, setUserOptions] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [loadingReports, setLoadingReports] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [processMessage, setProcessMessage] = React.useState("");
  const [processCode, setProcessCode] = React.useState(null);

  /* ---------------- Load Users ---------------- */
  useEffect(() => {
    async function loadUsers() {
      if (!token) return;
      try {
        const users = await api.fetchAdminUserIds(token);
        setUserOptions(
          users.map((u) => ({ value: u.Id, label: u.UserName }))
        );
      } catch {
        setUserOptions([]);
      }
    }
    loadUsers();
  }, [token]);

  /* ---------------- Load Reports ---------------- */
  const loadReports = async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const resp = await api.fetchCustomReportswithusers(token);
      setReports(Array.isArray(resp) ? resp : []);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [token]);

  const filteredReports = React.useMemo(() => {
    if (!searchTerm.trim()) return reports;
    return reports.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [reports, searchTerm]);

  const columns = [
    { key: "AdminCustomReportID", label: "Report ID" },
    { key: "AdminCustomReportName", label: "Report Name" },
    { key: "AdminCustomReportProcedure", label: "Procedure Name" },
    { key: "DisplayView", label: "View" },
    { key: "DisplayOrderID", label: "Order" },
    { key: "RequiresBeginDate", label: "Begin Date" },
    { key: "RequiresEndDate", label: "End Date" },
    { key: "AccessUserNames", label: "Allowed Users" },
    { key: "AccessAddedByUserName", label: "Created By" },
  ];

  return (
    <>
     <div className="MainContent-card">
      {/* HEADER */}
      <div className="header-searchbar">
       
        <h2 className="form-title">Custom Reports</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search Custom Reports..."
          />
          <button className="btn primary" onClick={() => setPanelOpen(true)}>
            + Add Custom Report
          </button>
        </div>
      </div>

      {/* TABLE */}
      
        {loadingReports ? (
          <Loader size={20} text="Loading reports..." />
        ) : (
          <Table columns={columns} data={filteredReports} />
        )}
      </div>

      {/* SLIDE PANEL */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add Custom Report"
        width="720px"
      >
        <Formik
          initialValues={{
            AdminCustomReportName: "",
            AdminCustomReportProcedure: "",
            DisplayOrderID: 1,
            DisplayView: "Sidebar",
            RequiresBeginDate: "N",
            RequiresEndDate: "N",
            UserIDsCSV: [],
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => {
            const payload = {
              ...values,
              UserIDsCSV: values.UserIDsCSV.join(","),
              AccessAddedBy: user?.id,
            };

            try {
              const resp = await api.addCustomReportWithUsers(payload, token);
              setProcessMessage(resp?.processMessage || "Saved successfully");
              setProcessCode(resp?.ProcessCode);

              if (resp?.ProcessCode === 0) {
                resetForm();
                setPanelOpen(false);
                loadReports();
              }
            } catch {
              setProcessMessage("Failed to save custom report");
              setProcessCode(1);
            }
          }}
        >
          {({ values, handleChange, setFieldValue }) => (
            <Form className="mapping-form">
              {processMessage && (
                <div
                  className={`process-msg ${
                    processCode === 0 ? "process-success" : "process-error"
                  }`}
                >
                  {processMessage}
                </div>
              )}

              <div className="form-row three">
                <div className="form-field">
                  <label>Report Name *</label>
                  <input
                    name="AdminCustomReportName"
                    value={values.AdminCustomReportName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <label>Procedure Name *</label>
                  <input
                    name="AdminCustomReportProcedure"
                    value={values.AdminCustomReportProcedure}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field view">
                  <label>View *</label>
                  <select
                    name="DisplayView"
                    value={values.DisplayView}
                    onChange={handleChange}
                  >
                    <option value="Sidebar">Sidebar</option>
                    <option value="Scroll">Scroll</option>
                  </select>
                </div>

                <div className="form-field order">
                  <label>Order *</label>
                  <input
                    type="number"
                    name="DisplayOrderID"
                    value={values.DisplayOrderID}
                    onChange={handleChange}
                  />
                </div>
              </div>

               <div className="form-row two">

            {/* ACCESS */}
            <div>
              <div className="form-section-title">Access</div>
              <div className="form-field">
                <label>User IDs *</label>

                <Select
                  options={userOptions}
                  isMulti
                //   isLoading={loadingUsers}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  components={{ Option: CheckboxOption }}
                  placeholder="Select User IDs"
                  value={userOptions.filter((opt) =>
                    values.UserIDsCSV.includes(opt.value)
                  )}
                  onChange={(selected) => {
                    const ids = selected
                      ? selected.map((o) => o.value)
                      : [];
                    setFieldValue("UserIDsCSV", ids);
                  }}
                  styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight:26,
                //   maxHeight: 26,
                  fontSize: "12px",
                  borderRadius:"8px",
                  boxShadow: "none",
                  borderColor:"#d1d5db",
                //   width:595,
                   padding: 0 , 
                }),
                option: (provided, state) => ({
                ...provided,
                display: "flex",
                alignItems: "center",
                gap: "8px",

                /* remove default blue */
                backgroundColor: state.isSelected
                    ? "#ccccccff"     
                         
                    : "#ffffff",

                color:  "#0f172a",

                cursor: "pointer",
                fontSize: "12px",
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
            </div>

            {/* DATE FILTERS */}
            <div>
              <div className="form-section-title">Date Filters</div>

              <div className="Date-fields">
                <div className="form-field BeginDate">
                <label>Requires Begin Date</label>
                <select
                    name="RequiresBeginDate"
                    value={values.RequiresBeginDate}
                    onChange={handleChange}
                >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                </select>
                </div>

                <div className="form-field EndDate">
                <label>Requires End Date</label>
                <select
                    name="RequiresEndDate"
                    value={values.RequiresEndDate}
                    onChange={handleChange}
                >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                </select>
                </div>
            </div>
            
             </div>
          </div>
              <div className="form-actions">
                <button type="submit" className="btn primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setPanelOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </SlidePanel>
    </>
  );
}
