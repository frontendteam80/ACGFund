// src/components/Reports/Letters.jsx
import React, { useState } from "react";
import'./Letters.scss';

const Letters = () => {
  const [letterMode, setLetterMode] = useState("contribution");
  const [letterNumber, setLetterNumber] = useState("");

  return (
    <div className="MainContent-card letters-root">
      {/* <div className="letter-input-section"> */}
        <div className="letter-radio-group">
          <label className="letter-radio">
            <input
              type="radio"
              name="letterMode"
              value="contribution"
              checked={letterMode === "contribution"}
              onChange={() => setLetterMode("contribution")}
            />
            <span>Contribution Letter</span>
          </label>

          <label className="letter-radio">
            <input
              type="radio"
              name="letterMode"
              value="grant"
              checked={letterMode === "grant"}
              onChange={() => setLetterMode("grant")}
            />
            <span>Grant Letter</span>
          </label>
        </div>
        <div className="letter-input-section">
        <input
          type="text"
          className="letter-number-input"
          placeholder={
            letterMode === "contribution"
              ? "Enter Contribution Number"
              : "Enter Grant Number"
          }
          value={letterNumber}
          onChange={(e) => setLetterNumber(e.target.value)}
        />

        
            <button
            type="button"
            className="buttons Reports-generate-button"
            disabled={!letterNumber.trim()}
          >
            Generate
          </button>
          </div>
        <div className="buttons">
          <button
            type="button"
            className="Reports-view-button"
            disabled={!letterNumber.trim()}
          >
            View
          </button>

          <button
            type="button"
            disabled={!letterNumber.trim()}
          >
            Download
          </button>
        </div>
      </div>
    // </div>
  );
};

export default Letters;
