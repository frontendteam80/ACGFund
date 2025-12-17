// src/components/Utilites/SearchBar/SearchBar.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./SearchBar.scss";

/**
 * Reusable SearchBar component
 *
 * Props:
 *  - value (string, optional) controlled value
 *  - defaultValue (string, optional) uncontrolled initial value
 *  - onChange (fn) => called immediately on input change with new value
 *  - onSearch (fn) => called after debounceMs with final value
 *  - placeholder (string)
 *  - debounceMs (number) default 300
 *  - className (string) additional classes
 */
export default function SearchBar({
  value,
  defaultValue = "",
  onChange,
  onSearch,
  placeholder = "Search…",
  debounceMs = 300,
  className = "",
}) {
  const [internal, setInternal] = useState(() =>
    value !== undefined ? value : defaultValue
  );

  // Support controlled usage: update internal when controlled value changes
  useEffect(() => {
    if (value !== undefined && value !== internal) setInternal(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce onSearch calls
  useEffect(() => {
    const t = setTimeout(() => {
      onSearch && onSearch((internal || "").trim());
    }, debounceMs);
    return () => clearTimeout(t);
  }, [internal, debounceMs, onSearch]);

  function handleChange(e) {
    const v = e.target.value;
    if (value === undefined) setInternal(v); // uncontrolled mode
    onChange && onChange(v);
  }

  function handleClear() {
    if (value === undefined) setInternal("");
    onChange && onChange("");
    onSearch && onSearch("");
  }

  return (
    <div className={`searchbar-root ${className}`} role="search">
      <input
        className="searchbar-input"
        type="search"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {/* {internal ? (
        <button
          type="button"
          className="searchbar-clear"
          aria-label="Clear search"
          onClick={handleClear}
        >
          ✕
        </button>
      ) : null} */}
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
  className: PropTypes.string,
};
