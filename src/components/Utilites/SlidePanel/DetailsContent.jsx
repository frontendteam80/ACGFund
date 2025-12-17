

// src/Utilites/SlidePanel/DetailsContent.jsx
import React from "react";
import PropTypes from "prop-types";
import "./DetailsContent.scss";

export default function DetailsContent({
  row = {},
  primaryFields = null,
  remainingCols = [],
}) {
  const PRIMARY_FIELDS =
    primaryFields || [
      "Participant Number",
      "Participant Name",
      "Participant Type",
      "First Name",
      "Last Name",
    ];

  function showValue(key) {
    const v = row[key];
    if (v === null || v === undefined || String(v).trim() === "") return "N/A";
    return v;
  }

  function prettyLabel(key) {
    if (!key) return "";

    const raw = String(key);

    // If key is camelCase / PascalCase, insert space before capitals:
    // GrantPeriodType -> Grant Period Type
    if (!raw.includes("_") && /[a-z][A-Z]/.test(raw)) {
      return raw
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .trim();
    }

    // For ALLCAPS or SNAKE_CASE: WWWGRANTID, CREATEDBY, GRANTPERIODTYPE
    return raw
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const additionalKeys =
    remainingCols && remainingCols.length > 0
      ? remainingCols
      : Object.keys(row).filter((k) => !PRIMARY_FIELDS.includes(k));

  return (
    <div className="dc-root">
      <div className="dc-card dc-card--primary" aria-labelledby="user-info-heading">
        <div className="dc-primary-grid">
          {PRIMARY_FIELDS.map((key) => (
            <div className="dc-primary-col" key={key}>
              <div className="dc-label">{prettyLabel(key)}</div>
              <div className="dc-value">{showValue(key)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dc-card" aria-labelledby="additional-heading">
        <div className="dc-detail-grid">
          {additionalKeys.map((key) => (
            <div className="dc-tile" key={key}>
              <div className="dc-tile-label">{prettyLabel(key)}</div>
              <div className="dc-tile-value">{showValue(key)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

DetailsContent.propTypes = {
  row: PropTypes.object,
  primaryFields: PropTypes.arrayOf(PropTypes.string),
  remainingCols: PropTypes.arrayOf(PropTypes.string),
};
