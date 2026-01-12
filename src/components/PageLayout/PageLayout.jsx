


import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import HeaderBar from '../Header/Headerbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import './PageLayout.scss';

const pathToLabel = {
  '/customreports': 'Custom Reports',
  '/processdata': 'Process Data',
  '/fundprice': 'Fund Price',
  '/adddata': 'Add Data',
  '/editdata': 'Edit Data',
  '/operations': 'Operation',
  '/updatepassword': 'Update Password',
  '/reports': 'Reports',
  '/Letters':'letters',
  '/dataMapping':'DataMapping',
};

export default function PageLayout() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  const activeLabel =
    pathToLabel[currentPath] ||
    (Object.keys(pathToLabel).find(k => currentPath.startsWith(k))
      ? 'Custom Reports'
      : 'Custom Reports');

  const isAddDataPage = currentPath.startsWith('/adddata');

  return (
    <div className="Main-layout">
      <div className="topbar">
        {/* <Logo /> */}
        <HeaderBar activeMenu={activeLabel} />
      </div>
      <div className="main-area">
        <Sidebar />
        <div
          key={location.pathname}
          className={`Main-content ${isAddDataPage ? 'white-bg' : ''}`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
