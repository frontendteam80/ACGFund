
// src/Utilites/Table/Table.jsx
import React from "react";
import { Eye } from "lucide-react";
import "./Table.css";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function Table({
  columns = [],
  data = [],
  onDetails,
  showDetailsColumn = false,
  alignMap = {},
  renderValue, // parent-provided renderer
  renderRowActions, 
  renderHeader, // NEW: parent-provided header renderer
}) {
  const normalizedColumns = (columns || []).map((col) =>
    typeof col === "string" ? { key: col, label: col } : { key: col.key, label: col.label ?? col.key }
  );

  const safeData = Array.isArray(data) ? data : [];

  const getRowKey = (row, idx) => {
    if (row && row.__uid) return row.__uid;
    if (row && row.__raw) {
      const raw = row.__raw;
      if (raw.id) return `${raw.id}-${idx}`;
      if (raw.ParticipantNumber) return `${raw.ParticipantNumber}-${idx}`;
      if (raw.AgentNumber) return `${raw.AgentNumber}-${idx}`;
      if (raw.AgentID) return `${raw.AgentID}-${idx}`;
    }
    if (row && row.id) return `${row.id}-${idx}`;
    if (row && row.AgentNumber) return `${row.AgentNumber}-${idx}`;
    if (row && row.ParticipantName) return `${row.ParticipantName}-${idx}`;
    return `row-${idx}`;
  };

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {normalizedColumns.map((col) => {
              const cellAlignClass =
                alignMap[col.key] === "right"
                  ? "col-right"
                  : alignMap[col.key] === "center"
                  ? "col-center"
                  : "";

              // Use custom header renderer if provided
              if (typeof renderHeader === "function") {
                return (
                  <th key={col.key} className={cellAlignClass}>
                    {renderHeader(col)}
                  </th>
                );
              }

              // Default header
              return (
                <th key={col.key} className={cellAlignClass}>
                  {col.label}
                </th>
              );
            })}
            {showDetailsColumn && <th className="col-center">Details</th>}
            {renderRowActions && <th className="col-center">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {safeData.map((row, rIdx) => (
            <tr key={getRowKey(row, rIdx)}>
              {normalizedColumns.map((col) => {
                const cellAlignClass =
                  alignMap[col.key] === "right" ? "col-right" : alignMap[col.key] === "center" ? "col-center" : "";

                // prefer parent renderValue if provided
                if (typeof renderValue === "function") {
                  const rendered = renderValue(row, col);
                  const content = rendered === null || rendered === undefined ? formatCell(row?.[col.key]) : rendered;
                  return (
                    <td key={col.key} className={cellAlignClass}>
                      {content}
                    </td>
                  );
                }

                // default behavior
                return (
                  <td key={col.key} className={cellAlignClass}>
                    {formatCell(row?.[col.key])}
                  </td>
                );
              })}

              {showDetailsColumn && (
                <td className="col-center">
                  <button
                    className="details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetails && onDetails(row);
                    }}
                    type="button"
                    aria-label="View Details"
                  >
                    <Eye size={20} color="#486488" />
                  </button>
                </td>
              )}

              {renderRowActions && (
                <td className="col-center">
                  {renderRowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
