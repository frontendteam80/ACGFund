
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import './Headerbar.css';
import { LogOut } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const HeaderBar = ({ activeMenu }) => {
  const { user,logout } = useAuth();
  const initials = user
    ? ((user.FirstName?.[0] || 'Guest') + (user.LastName?.[0] || '')).toUpperCase()
    : '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  // const {logout,user} = useAuth();

  // Click outside to close dropdown
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
    <div className="headerbar-container">

      <div className="headerbar-right">
        <div className="headerbar-avatar">{initials}</div>
        <span
          className="headerbar-username"
          onClick={() => setDropdownOpen(o => !o)}
          style={{ cursor: 'pointer', fontWeight: 500 }}
        >
          {user?.FirstName || 'Guest'} {user.LastName}
        </span>
        {dropdownOpen && (
          <div className="profile-dropdown-menu" ref={dropdownRef}>
            <div className="profile-dropdown-user">
              {/* <div className="profile-dropdown-avatar">{initials}</div> */}
              <div>
                <div className="profile-dropdown-name">{user?.FirstName} {user?.LastName}</div>
               <div className="profile-dropdown-email">{user?.email || user?.Email || user?.UserEmail}</div>
              </div>
            </div>
            <div className="profile-dropdown-role">{user?.role || 'Admin'}</div>
            <div className="profile-dropdown-divider" />
            <button className="profile-dropdown-btn">Change Password</button>
            <button className="profile-dropdown-btn">Security Questions</button>
            <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-logout"
          onClick={()=>{
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
  );
};

export default HeaderBar;
