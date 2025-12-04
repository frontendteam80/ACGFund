
// src/Utilites/Table.jsx
import React from "react";
import { Eye } from "lucide-react";
import "./Table.css";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function Table({
  columns,
  data,
  onDetails,
  showDetailsColumn,
  alignMap = {},
}) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className={
                  alignMap[col] === "right"
                    ? "col-right"
                    : alignMap[col] === "center"
                    ? "col-center"
                    : ""
                }
              >
                {col}
              </th>
            ))}
            {showDetailsColumn && <th className="col-center">Details</th>}
          </tr>
        </thead>
        <tbody>
          {safeData.map((row, rIdx) => (
            <tr key={rIdx}>
              {columns.map((col) => (
                <td
                  key={col}
                  className={
                    alignMap[col] === "right"
                      ? "col-right"
                      : alignMap[col] === "center"
                      ? "col-center"
                      : ""
                  }
                >
                  {formatCell(row[col])}
                </td>
              ))}
              {showDetailsColumn && (
                <td className="col-center">
                  <button
                    className="details-btn"
                    onClick={() => onDetails && onDetails(row)}
                    type="button"
                    aria-label="View Details"
                  >
                    <Eye size={20} color="#486488" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
