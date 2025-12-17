

// components/Dashboard/DashboardLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import HeaderBar from '../Header/Headerbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import './Dashboard.css';

const pathToLabel = {
  '/dashboard/custom-reports': 'Custom Reports',
  '/dashboard/process-data': 'Process Data',
  '/dashboard/fund-price': 'Fund Price',
  '/dashboard/add-data': 'Add Data',
  '/dashboard/edit-data': 'Editdata',
  '/dashboard/operation-screen': 'Operation Screen', 
  '/dashboard/update-password':'Update Password',

};

export default function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  const activeLabel =
    pathToLabel[currentPath] ||
    (Object.keys(pathToLabel).find(k => currentPath.startsWith(k)) ? 'Custom Reports' : 'Custom Reports');

  const isAddDataPage = currentPath.startsWith('/dashboard/add-data');

  return (
    <div className="dashboard-layout">
      <div className="dashboard-topbar">
        <Logo />
        <HeaderBar activeMenu={activeLabel} />
      </div>

      <div className="dashboard-main-area">
        <Sidebar />

        <div
          key={location.pathname}
          className={`dashboard-content ${isAddDataPage ? 'white-bg' : ''}`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
