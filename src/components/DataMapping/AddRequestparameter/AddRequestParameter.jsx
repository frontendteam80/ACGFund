// src/components/DataMapping/AddRequestParamTypes/AddRequestParamTypes.jsx
import React,{useState,useEffect,useMemo,useCallback,useRef} from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../../AuthContext/AuthContext.jsx";
import api from "../../../AuthContext/Api.jsx";
import Table from "../../Utilites/Table/Table.jsx";
import SearchBar from "../../Utilites/SearchBar/SearchBar.jsx";
import Loader from "../../Utilites/Loader/Loader.jsx";
import { Pencil } from "lucide-react";
import "../DataMapping.scss";

/* ---------------- Validation Schema ---------------- */
const validationSchema = Yup.object({
  RequestParameterType: Yup.string().min(3).required("Required"),
  SPName: Yup.string().min(3).required("Required"),
  ActionType: Yup.string().oneOf(["Reports", "API"]).required(),
  DisplayRequestParamType: Yup.string().nullable(),
  IsActive: Yup.string().oneOf(["Y", "N"]).required(),
});

export default function AddRequestParameter() {
    const { token } = useAuth();
    const [processMessage, setProcessMessage] = useState("");
    const [processCode, setProcessCode] = useState(null);
    const [requestParams, setRequestParams] = useState([]);
    const [loadingParams, setLoadingParams] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingRow, setEditingRow] = useState(null);
    const formRef =useRef(null);

    const loadRequestParameters =useCallback(async () => {
  if (!token) return;

  setLoadingParams(true);
  try {
    const resp = await api.fetchRequestParameters(token);
    setRequestParams(resp);
  } catch (e) {
    console.error("Failed to load request parameters", e);
    setRequestParams([]);
  } finally {
    setLoadingParams(false);
  }
}, [token]);

useEffect(() => {
  loadRequestParameters();
}, [loadRequestParameters]);

const filteredParams = useMemo(() => {
  if (!searchTerm.trim()) return requestParams;

  const term = searchTerm.toLowerCase();
  return requestParams.filter((row) =>
    Object.values(row).some((v) =>
      String(v ?? "").toLowerCase().includes(term)
    )
  );
}, [requestParams, searchTerm]);

const tableColumns = useMemo(
  () => [
    { key: "ID", label: "ID" },
    { key: "RequestParamType", label: "Request Parameter Type" },
    { key: "SPName", label: "Stored Procedure Name" },
    { key: "ActionType", label: "Action Type" },
    { key: "DisplayRequestParamType", label: "Display Name" },
    { key: "IsActive", label: "Status" },
  ],
  []
);

  return (
    <Formik
      enableReinitialize
  initialValues={{
    RequestParameterType: editingRow?.RequestParamType || "",
    SPName: editingRow?.SPName || "",
    ActionType: editingRow?.ActionType || "Reports",
    DisplayRequestParamType: editingRow?.DisplayRequestParamType || "",
    IsActive: editingRow?.IsActive || "Y",
  }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          const payload = {
            ...values,
            DisplayRequestParamType:
              values.DisplayRequestParamType || null,
            // CreatedByUserID: user?.id, // optional but recommended
          };

           let resp;

    if (editingRow?.ID) {
      
      resp = await api.updateRequestParameter(
        {
          ID: editingRow.ID, 
           OldRequestParameterType: editingRow.RequestParamType,
          ...payload,
        },
        token
      );
    } else {
     
      resp = await api.addRequestParameter(payload, token);
    }
  
          setProcessMessage(
            resp?.processMessage ||
              (editingRow ? "Request Parameter updated successfully" : "Request Parameter added successfully")
          );
          setProcessCode(resp?.ProcessCode);

          if (resp?.ProcessCode === 0) {
            resetForm();
            setEditingRow(null);     
            loadRequestParameters(); 
          }
        } catch (err) {
          console.error("Save Request Parameter failed", err);
          setProcessMessage("Failed to save Request Parameter");
          setProcessCode(1);
        } finally {
          setSubmitting(false);
              }
            }}
          >
      {({ values, errors, touched, handleChange }) => (
        <>
        <Form 
        ref={formRef}
        className="mapping-form MainContent-card">
          <h2 className="form-title">Request Parameter Setup</h2>
         {processMessage && (
            <div
              className={`process-msg ${
                processCode === 0 ? "process-success" : "process-error"
              }`}
            >
              {processMessage}
            </div>
          )}

          {/* ROW 1 */}
          <div className="form-row three">
            <div className="form-field">
              <label>Request Parameter Type *</label>
              <input
                name="RequestParameterType"
                value={values.RequestParameterType}
                onChange={handleChange}
              />
              {touched.RequestParameterType && (
                <div className="error">{errors.RequestParameterType}</div>
              )}
            </div>
            <div className="form-field">
              <label>SPName *</label>
              <input
                name="SPName"
                value={values.SPName}
                onChange={handleChange}
              />
              {touched.SPName && (
                <div className="error">{errors.SPName}</div>
              )}
            </div>


            <div className="form-field">
              <label>Action Type *</label>
              <select
                name="ActionType"
                value={values.ActionType}
                onChange={handleChange}
              >
                <option value="Reports">Reports</option>
                <option value="API">API</option>
              </select>
            </div>

            <div className="form-field">
              <label>Status *</label>
              <select
                name="IsActive"
                value={values.IsActive}
                onChange={handleChange}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="form-row two">
            {/* <div className="form-field">
              <label>SPName *</label>
              <input
                name="SPName"
                value={values.SPName}
                onChange={handleChange}
              />
              {touched.SPName && (
                <div className="error">{errors.SPName}</div>
              )}
            </div> */}

            <div className="form-field displayrequestparamtype">
             
              <label>Display Request Param Type</label>
              <input
                name="DisplayRequestParamType"
                value={values.DisplayRequestParamType}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="form-actions">
            <button type="submit" className="btn primary">
              Save
            </button>
            <button type="reset" className="btn ghost" onClick={() => setEditingRow(null)}>
              Clear
            </button>
            
          </div>
        </Form>
        <div className="MainContent-card" style={{ marginTop: 20 }}>
           <div className="header-searchbar">
            <h2 className="form-title">Existing Request Parameters</h2>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search "
            />
            </div>

          {loadingParams ? (
            <Loader size={20} text="Loading reports..." />
          ) : requestParams.length > 0 ? (
            <Table
              columns={tableColumns}
              // data={requestParams}
              data={filteredParams}
              renderValue={(row, col) => {
                if (col.key === "IsActive") {
                  return row.IsActive === "Y" ? "Yes" : "No";
                }
                return null;
              }}
              renderRowActions={(row) => (
              <button
              
                type="button"
                className="icon-btn"
                title="Edit"
                onClick={() => {
                  setEditingRow(row);
                setTimeout(() => {
              formRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 0)
          }}
              >
                <Pencil size={16} />
              </button>
               )}
            />
          ) : (
            <div style={{ padding: 16, color: "#6b7280" }}>
              No request parameters found.
            </div>
          )}
        </div>
        </>
      )}
    </Formik>
  );
}
