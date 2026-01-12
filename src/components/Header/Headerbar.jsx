
// export default HeaderBar;

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import Logo from '../Logo/Logo.jsx';
import './Headerbar.scss';
import { LogOut } from 'lucide-react';
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { BarChart2, Layers3, ChartNoAxesCombined, FilePlus, FilePen, Coins, ShieldUser } from 'lucide-react';

const sidebarItems = [
  { label: 'Custom Reports', path: '/customreports', icon: <BarChart2 size={20} /> },
  { label: 'Process Data', path: '/processdata', icon: <Layers3 size={20} /> },
  { label: 'Fund Price', path: '/fundprice', icon: <ChartNoAxesCombined size={20} /> },
  { label: 'Add Data', path: '/adddata', icon: <FilePlus size={20} /> },
  { label: 'Edit Data', path: '/editdata', icon: <FilePen size={20} /> },
  { label: 'Operations', path: '/operations', icon: <Coins size={20} /> },
  { label: 'Update Password', path: '/updatepassword', icon: <ShieldUser size={20} /> },
];

const HeaderBar = ({ activeMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user
    ? ((user.FirstName?.[0] || 'G') + (user.LastName?.[0] || '')).toUpperCase()
    : 'G';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="headerbar-container">
        {/* LEFT: Logo only */}
        <div className="headerbar-logo">
          <Logo />
        </div>

        {/* RIGHT: Profile - BOTH clickable */}
        <div className="headerbar-right">
          {/* ✅ AVATAR NOW CLICKABLE */}
          <div 
            className="headerbar-avatar"
            onClick={() => setDropdownOpen(o => !o)}
            style={{ cursor: 'pointer' }}
          >
            {initials}
          </div>
          <span
            className="headerbar-username"
            onClick={() => setDropdownOpen(o => !o)}
          >
            {user?.FirstName || 'Guest'} {user?.LastName || ''}
          </span>

          {dropdownOpen && (
            <div className="profile-dropdown-menu" ref={dropdownRef}>
              <div className="profile-dropdown-user">
                <div>
                  <div className="profile-dropdown-name">
                    {user?.FirstName} {user?.LastName}
                  </div>
                  <div className="profile-dropdown-email">
                    {user?.email || user?.Email || user?.UserEmail}
                  </div>
                </div>
              </div>
              <div className="profile-dropdown-role">
                {user?.role || 'Admin'}
              </div>
              <div className="profile-dropdown-divider" />
              <button className="profile-dropdown-btn">Change Password</button>
              <button className="profile-dropdown-btn">Security Questions</button>
              <div className="profile-dropdown-divider" />
              <button
                className="profile-dropdown-logout"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER WITH ICONS */}
      <div className="mobile-footer">
        <div className="mobile-footer-container">
          {sidebarItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              className={`mobile-footer-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="mobile-footer-icon">{item.icon}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeaderBar;
