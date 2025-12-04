import React from 'react';
import Akra from "../../assets/AKRA Logo.jpg"
import './Logo.css';

const Logo = () => (
  <div className="logo-container">
    <img src={Akra} alt="Logo" className="logo-image" />
  </div>
);

export default Logo;

