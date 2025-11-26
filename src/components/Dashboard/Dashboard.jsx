

import React, { useState } from 'react';
import Logo from '../Logo/Logo.jsx';
import HeaderBar from '../Header/Headerbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import CustomReports from '../CustomReports/CustomReports.jsx';
import ProcessData from '../ProcessData/ProcessData.jsx';
import FundPrice from '../FundPrice/FundPrice.jsx';
import './Dashboard.css';

const DashboardLayout = ({ children }) => {
  const [activeItem, setActiveItem] = useState('Custom Reports');

  return (
    <div className="dashboard-layout">
      <div className="dashboard-topbar">
        <Logo />
        <HeaderBar activeMenu={activeItem} />
      </div>
      <div className="dashboard-main-area">
        <Sidebar activeItem={activeItem} onSelect={setActiveItem} />
        
        {activeItem === 'Custom Reports' && (
            <CustomReports activeItem={activeItem}>{children}</CustomReports>
          )}
          {activeItem === 'Process Data' && <ProcessData />}
          {activeItem === 'Fund Price' && <FundPrice />}
      </div>
    </div>
  );
};

export default DashboardLayout;

