

// Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Layers3, ChartNoAxesCombined, FilePlus,FilePen,Coins, ShieldUser } from 'lucide-react';
import './Sidebar.css';

const sidebarItems = [
  { label: 'Custom Reports', path: '/dashboard/custom-reports', icon: <BarChart2 size={20} /> },
  { label: 'Process Data', path: '/dashboard/process-data', icon: <Layers3 size={20} /> },
  { label: 'Fund Price', path: '/dashboard/fund-price', icon: <ChartNoAxesCombined size={20} /> },
  { label: 'Add Data', path: '/dashboard/add-data', icon: <FilePlus size={20} /> },
  { label: 'Edit Data', path: '/dashboard/edit-data', icon: <FilePen size={20} /> },
  { label: 'Operations', path: '/dashboard/operationscreen', icon: <Coins size={20} /> },
  { label: 'Update Password', path: '/dashboard/UpdatePassword', icon: < ShieldUser size={20} /> },

];

const Sidebar = () => {
  return (
    <aside className="sidebar-container">
      {sidebarItems.map(item => (
        <React.Fragment key={item.label}>
          
          {/* CLICK → Navigate (NavLink handles active highlight) */}
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>

          {/* Divider after Fund Price */}
          {item.label === 'Fund Price' && <div className="sidebar-divider" />}
        </React.Fragment>
      ))}
    </aside>
  );
};

export default Sidebar;
