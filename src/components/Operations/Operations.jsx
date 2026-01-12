

// src/components/Operations/Operations.jsx
import React, { useState } from "react";
import { useAuth } from "../../AuthContext/AuthContext.jsx"; 
import SelectDropDown from "../Utilites/DropDown/DropDown.jsx";
import GrantStatus from "../GrantStatus/GrantStatus.jsx";
import ContributionStatus from "../Contribution/Contribution.jsx";
import TransferAgent from "../TransferAgents/TransferAgent.jsx";
import "./Operations.scss";

const operationOptions = [
  { value: "transfer", label: "Transfer of Agent" },
  { value: "grantStatus", label: "Grant Status" },
  { value: "contributionStatus", label: "Contribution Status" },
];

const fixedSelectStyles = {
  container: (base) => ({ ...base, width: 240 }),
  control: (base) => ({ ...base, width: 240 }),
};

export default function Operations() {
  const { user } = useAuth();
  const userId = user?.id || user?.UserID || null;
  const [operationType, setOperationType] = useState(null);

  return (
    <div className="ops-root">
      {/* ✅ "Select an operation type" at TOP - Always visible */}
      {!operationType && (
        <div style={{  color: "#e85757", marginBottom: 20 }}>
          Select an operation type to begin.
        </div>
      )}

      {/* Operation Type Selector */}
      <div className="ops-row ops-row--full">
        <div className="ops-field opstype-field">
          <label className="select-label">Operation Type</label>
          <div className="select-control">
            <SelectDropDown
              options={operationOptions}
              value={operationOptions.find((o) => o.value === operationType)}
              onChange={(o) => {
                const val = (o && o.value) || null;
                setOperationType(val);
              }}
              placeholder="Select operation..."
              isClearable
              isSearchable
              styles={fixedSelectStyles}
            />
          </div>
        </div>
      </div>

      {/* Render Selected Operation */}
      {operationType === "transfer" ? (
        <div className="transfer-agent-fullscreen">
          <TransferAgent userId={userId} />
        </div>
      ) : operationType === "grantStatus" ? (
        <div className="grant-status-fullscreen">
          <GrantStatus userId={userId} />
        </div>
      ) : operationType === "contributionStatus" ? (
        <div className="grant-status-fullscreen">
          <ContributionStatus userId={userId} />
        </div>
      ) : null}
    </div>
  );
}
