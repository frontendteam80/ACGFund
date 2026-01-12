// src/components/DataMapping/DataMapping.jsx
import React, { useState } from "react";
import SelectDropDown from "../Utilites/DropDown/DropDown.jsx";
import AddCustomReports from "./AddCustomReports/AddCustomReports.jsx";
import AddRequestParameter from "./AddRequestparameter/AddRequestParameter.jsx";
import "./DataMapping.scss";

const dataMappingOptions = [
  { value: "customReports", label: "Add Custom Reports" },
  { value: "requestParameter", label: "Add Request Parameter" },
];

const fixedSelectStyles = {
  container: (base) => ({ ...base, width: 260 }),
  control: (base) => ({ ...base, width: 260 }),
};

export default function DataMapping() {
  const [mappingType, setMappingType] = useState(null);

  return (
    <div className="ops-root">
      {/* Info text */}
      {!mappingType && (
        <div style={{ color: "#e85757", marginBottom: 20 }}>
          Select a data mapping option to begin.
        </div>
      )}

      {/* Dropdown */}
      <div className="ops-row ops-row--full">
        <div className="ops-field">
          <label className="select-label">Data Mapping Type</label>
          <div className="select-control">
            <SelectDropDown
              options={dataMappingOptions}
              value={dataMappingOptions.find(
                (o) => o.value === mappingType
              )}
              onChange={(o) => {
                const val = (o && o.value) || null;
                setMappingType(val);
              }}
              placeholder="Select mapping"
              isClearable
              isSearchable
              styles={fixedSelectStyles}
            />
          </div>
        </div>
      </div>

      {/* Render selected screen */}
      {mappingType === "customReports" ? (
        <AddCustomReports />
      ) : mappingType === "requestParameter" ? (
        <AddRequestParameter />
      ) : null}
    </div>
  );
}
