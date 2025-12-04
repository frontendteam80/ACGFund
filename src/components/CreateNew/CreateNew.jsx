
import React, { useState, useEffect, useRef } from "react";
import "./CreateNew.scss";
import { UserPlus, FileUser } from "lucide-react";
import AddParticipantForm from "../Utilites/Forms/Form.jsx";

let useAuth = null;
try {
  useAuth = require("../AuthContext/AuthProvider.jsx").useAuth;
} catch (e) {
  useAuth = null;
}

const CreateNew = ({ token: tokenProp }) => {
  // use "participant" and "user" as clearer mode keys
  const [active, setActive] = useState("participant");
  const [token, setToken] = useState(tokenProp || null);

  const formRef = useRef(null);

  // If useAuth exists, get token from it
  let authCtx = null;
  if (useAuth) {
    try {
      authCtx = useAuth();
    } catch (e) {
      authCtx = null;
    }
  }

  useEffect(() => {
    if (tokenProp) {
      setToken(tokenProp);
      return;
    }

    if (authCtx && authCtx.token) {
      setToken(authCtx.token);
      return;
    }

    try {
      const stored =
        localStorage.getItem("acg_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        null;
      if (stored) setToken(stored);
      else setToken(null);
    } catch (e) {
      console.warn("CreateNew: unable to read localStorage for token", e);
      setToken(null);
    }
  }, [tokenProp, authCtx]);

  useEffect(() => {
    console.log("CreateNew resolved token:", token ? `${token.slice(0, 8)}...` : "NO_TOKEN");
  }, [token]);

  const handleSave = (result) => {
    console.log("Saved (CreateNew):", result);
    // refresh lists or show toast if needed
  };

  // handlers for buttons on the tab row
  const handleClearClick = () => {
    try {
      if (formRef.current && typeof formRef.current.clear === "function") {
        formRef.current.clear();
      }
    } catch (e) {
      console.error("Clear failed:", e);
    }
  };

  const handleConfirmClick = () => {
    try {
      if (formRef.current && typeof formRef.current.requestConfirm === "function") {
        formRef.current.requestConfirm();
      }
    } catch (e) {
      console.error("Confirm failed:", e);
    }
  };

  const isSaving = () => {
    try {
      return formRef.current && typeof formRef.current.isSaving === "function" ? formRef.current.isSaving() : false;
    } catch (e) {
      return false;
    }
  };

  const hasAnyField = () => {
    try {
      return formRef.current && typeof formRef.current.hasAnyField === "function" ? formRef.current.hasAnyField() : false;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="create-new-container">
      <div className="tabs-container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`tab-btn ${active === "participant" ? "active" : ""}`} onClick={() => setActive("participant")}>
            <UserPlus className="tab-icon" />
            Add Participant
          </button>

          <button className={`tab-btn ${active === "user" ? "active" : ""}`} onClick={() => setActive("user")}>
            <FileUser className="tab-icon" />
            Add User
          </button>
        </div>

        {/* Right side controls (Clear + Confirm) placed in same row */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={handleClearClick}
            disabled={!hasAnyField()}
            style={{
              color: "#051A36",
              padding: "8px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontWeight: 500,
              cursor: hasAnyField() ? "pointer" : "not-allowed",
              fontSize: "14px",
              background: "#fff",
            }}
          >
            Clear
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={handleConfirmClick}
            disabled={isSaving()}
            style={{
              background: "#051A36",
              color: "#fff",
              padding: "8px 14px",
              border: "none",
              borderRadius: "6px",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isSaving() ? "Submitting..." : "Confirm"}
          </button>
        </div>
      </div>

      <div className="tab-content-area" style={{ marginTop: 16 }}>
        {active === "participant" && (
          <AddParticipantForm
            ref={formRef}
            open={true}
            onClose={() => {}}
            onSave={handleSave}
            token={token}
            mode="participant"
            onRequestAddUser={() => setActive("user")}
          />
        )}

        {active === "user" && (
          <AddParticipantForm
            ref={formRef}
            open={true}
            onClose={() => {}}
            onSave={handleSave}
            token={token}
            mode="user"
            onRequestAddUser={() => setActive("user")}
          />
        )}
      </div>
    </div>
  );
};

export default CreateNew;

