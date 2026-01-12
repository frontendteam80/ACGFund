
// Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Layers3, ChartNoAxesCombined, FilePlus, FilePen, Coins, ShieldUser,ReceiptText ,Receipt,DatabaseZap} from 'lucide-react';
import './Sidebar.scss';

export const sidebarItems = [
  { label: 'Custom Reports', path: '/customreports', icon: <BarChart2 size={20} /> },
  { label: 'Process Data', path: '/processdata', icon: <Layers3 size={20} /> },
  { label: 'Fund Price', path: '/fundprice', icon: <ChartNoAxesCombined size={20} /> },
  { label: 'Add Data', path: '/adddata', icon: <FilePlus size={20} /> },
  { label: 'Edit Data', path: '/editdata', icon: <FilePen size={20} /> },
  { label: 'Operations', path: '/operations', icon: <Coins size={20} /> },
  { label: 'Update Password', path: '/updatepassword', icon: <ShieldUser size={20} /> },
  { label: 'Reports', path: '/reports', icon: <Receipt size={20} /> },
  { label: 'Letters', path: '/Letters', icon: <ReceiptText size={20} /> },
  { label: 'Data Mapping', path: '/dataMapping', icon: <DatabaseZap size={20} /> },
];

const Sidebar = () => {
  return (
    <aside className="sidebar-container">
      {sidebarItems.map(item => (
        <React.Fragment key={item.label}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>

          {item.label === 'Fund Price' && <div className="sidebar-divider" />}
        </React.Fragment>
      ))}
    </aside>
  );
};

export default Sidebar;
