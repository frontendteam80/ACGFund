
// Sidebar.jsx
import React from 'react';
import { BarChart2, Layers3, ChartNoAxesCombined, FilePlus } from 'lucide-react';
import './Sidebar.css';

const sidebarItems = [
  { label: 'Custom Reports', icon: <BarChart2 size={20} /> },
  { label: 'Process Data', icon: <Layers3 size={20} /> },
  { label: 'Fund Price', icon: <ChartNoAxesCombined size={20} /> },
  { label: 'Add Data', icon: <FilePlus size={20} /> }
];

const Sidebar = ({ activeItem, onSelect }) => (
  <aside className="sidebar-container">
    {sidebarItems.map((item, index) => (
      <React.Fragment key={item.label}>
        <div
          className={`sidebar-item${activeItem === item.label ? ' active' : ''}`}
          onClick={() => onSelect(item.label)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          {item.label}
        </div>

        {/* Insert divider after "Fund Price" (index 2) */}
        {item.label === 'Fund Price' && (
          <div className="sidebar-divider" />
        )}
      </React.Fragment>
    ))}
  </aside>
);

export default Sidebar;
