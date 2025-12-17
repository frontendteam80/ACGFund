

// src/pages/CreateNew/CreateNew.jsx
import React, { useState, useEffect } from "react";
import "./CreateNew.scss";
import { UserPlus, FileUser } from "lucide-react";
import AddParticipantForm from "../Utilites/Forms/AddParticipantForm.jsx";
import AddUserForm from "../Utilites/Forms/AddUserForm.jsx";

let useAuth = null;
try {
  useAuth = require("../../AuthContext/AuthProvider.jsx").useAuth;
} catch (e) {
  useAuth = null;
}

const CreateNew = ({ token: tokenProp }) => {
  const [active, setActive] = useState("participant"); // "participant" | "user"
  const [token, setToken] = useState(tokenProp || null);

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
    console.log("CreateNew resolved token:", token ? `${String(token).slice(0, 8)}...` : "NO_TOKEN");
  }, [token]);

  const handleSave = (result) => {
    console.log("Saved (CreateNew):", result);
  };

  
  function openUserTabWithRole(role = "") {
   
    setActive("user");
    
  }

  return (
    <div className="create-new-container">
      <div className="tabs-container" role="tablist" aria-label="Create new">
        <button
          role="tab"
          aria-selected={active === "participant"}
          aria-controls="tab-participant"
          id="tab-btn-participant"
          className={`tab-btn ${active === "participant" ? "active" : ""}`}
          onClick={() => setActive("participant")}
        >
          <UserPlus className="tab-icon" />
          Add Participant
        </button>

        <button
          role="tab"
          aria-selected={active === "user"}
          aria-controls="tab-user"
          id="tab-btn-user"
          className={`tab-btn ${active === "user" ? "active" : ""}`}
          onClick={() => setActive("user")}
        >
          <FileUser className="tab-icon" />
          Add User
        </button>
      </div>

      <div className="tab-content-area">
        <div
          id="tab-participant"
          role="tabpanel"
          aria-labelledby="tab-btn-participant"
          hidden={active !== "participant"}
          className={`tab-panel ${active === "participant" ? "show" : ""}`}
        >
          <AddParticipantForm
            open={true}
            onClose={() => {}}
            onSave={handleSave}
            token={token}
            mode="participant"
            // when AddParticipantForm calls onRequestAddUser, switch to the user tab and preselect advisor
            onRequestAddUser={() => openUserTabWithRole("advisor")}
            // also pass addUserPath if your app needs it
            addUserPath="/dashboard/create-new" // optional fallback
          />
        </div>

        <div
          id="tab-user"
          role="tabpanel"
          aria-labelledby="tab-btn-user"
          hidden={active !== "user"}
          className={`tab-panel ${active === "user" ? "show" : ""}`}
        >
          <AddUserForm
            open={true}
            onClose={() => {}}
            onSave={handleSave}
            token={token}
        
            initialRole={active === "user" ? "advisor" : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateNew;
