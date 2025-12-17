// src/components/Utilites/Select/Select.jsx
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
  styles,
  menuPlacement = "auto",
  noOptionsMessage = () => "No options",
}) {
  // If consumer provided a primitive value (string/number), normalize to option object for react-select
  const normalizedValue =
    value && (typeof value === "string" || typeof value === "number")
      ? options.find((o) => (o.value ?? o.id ?? o.key) === value) || null
      : value || null;

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
        styles={{
                  dropdownIndicator: (base) => ({ ...base, padding: 5 }),
                  clearIndicator: (base) => ({ ...base, padding: 0 }),
                  indicatorsContainer: (base) => ({ ...base, padding: 0 }),
                }}
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
