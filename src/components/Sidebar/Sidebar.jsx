// Sidebar.jsx
import React from 'react';
import { BarChart2, Layers3,ChartNoAxesCombined } from 'lucide-react';
import './Sidebar.css';

const sidebarItems = [
  { label: 'Custom Reports', icon: <BarChart2 size={20} /> },
  { label: 'Process Data',icon: <Layers3 size={20} />},
  {label:'FundPrice',icon:<ChartNoAxesCombined size={20}/>},
];

const Sidebar = ({ activeItem, onSelect }) => (
  <aside className="sidebar-container">
    {sidebarItems.map(item => (
      <div
        key={item.label}
        className={`sidebar-item${activeItem === item.label ? ' active' : ''}`}
        onClick={() => onSelect(item.label)}
      >
        <span className="sidebar-icon">{item.icon}</span>
        {item.label}
      </div>
    ))}
  </aside>
);

export default Sidebar;
