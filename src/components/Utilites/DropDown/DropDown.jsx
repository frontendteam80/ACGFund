

// src/components/Utilites/DropDown/DropDown.jsx (SelectDropDown)

import React from "react";
import PropTypes from "prop-types";
import ReactSelect from "react-select";
import "./DropDown.scss";

export default function SelectDropDown({
  options = [],
  value = null,
  onChange,
  placeholder = "Select...",
  isClearable = true,
  isSearchable = true,
  className = "",
  classNamePrefix = "react-select",
  getOptionLabel,
  getOptionValue,
  styles: customStyles,
  menuPlacement = "auto",
  noOptionsMessage = () => "No options",
  ...rest
}) {
  const isMulti = !!rest.isMulti;   // detect multi-select

  let normalizedValue;
  if (isMulti) {
    // multi-select: react-select expects array
    normalizedValue = Array.isArray(value) ? value : [];
  } else if (value && (typeof value === "string" || typeof value === "number")) {
    // single: allow primitive ids
    normalizedValue =
      options.find((o) => (o.value ?? o.id ?? o.key) === value) || null;
  } else {
    normalizedValue = value || null;
  }

  const baseStyles = {
    dropdownIndicator: (base) => ({ ...base, padding: 5 }),
    clearIndicator: (base) => ({ ...base, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, padding: 0 }),
  };

  const mergedStyles = {
    ...baseStyles,
    ...(customStyles || {}),
  };

  return (
    <div className={`util-select-root ${className}`}>
      <ReactSelect
        options={options}
        value={normalizedValue}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={isSearchable}
        classNamePrefix={classNamePrefix}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        menuPlacement={menuPlacement}
        noOptionsMessage={noOptionsMessage}
        styles={mergedStyles}
        {...rest}     // forwards isMulti, components, closeMenuOnSelect, etc.
      />
    </div>
  );
}

SelectDropDown.propTypes = {
  options: PropTypes.array,
  value: PropTypes.any,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  isClearable: PropTypes.bool,
  isSearchable: PropTypes.bool,
  className: PropTypes.string,
  classNamePrefix: PropTypes.string,
  getOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  styles: PropTypes.object,
  menuPlacement: PropTypes.string,
  noOptionsMessage: PropTypes.func,
};
