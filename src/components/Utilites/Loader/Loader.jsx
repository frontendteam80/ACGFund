import React from "react";
import PropTypes from "prop-types";
import "./Loader.scss";

export default function Loader({ size = 40, text = "", inline = false }) {
  const style = {
    width: size,
    height: size,
    borderWidth: Math.max(2, Math.round(size / 8))
  };

  return (
    <div
      className={`cg-loader ${inline ? "cg-loader--inline" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="cg-spinner" style={style}></div>
      {text ? <div className="cg-loader-text">{text}</div> : null}
    </div>
  );
}

Loader.propTypes = {
  size: PropTypes.number,
  text: PropTypes.string,
  inline: PropTypes.bool
};
