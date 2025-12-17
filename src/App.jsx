
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './components/Login/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import CustomReports from './components/CustomReports/CustomReports.jsx';
import ProcessData from './components/ProcessData/ProcessData.jsx';
import FundPrice from './components/FundPrice/FundPrice.jsx';
import CreateNew from './components/CreateNew/CreateNew.jsx';
import EditData from './components/EditData/EditData.jsx';
import { AuthProvider } from './AuthContext/AuthContext.jsx';
import Operations from "./components/Operations/Operations.jsx";
import UpdatePassword from './components/UpdatePassword/UpdatePassword.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard layout route — children render into the layout's Outlet */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="custom-reports" replace />} />
            <Route path="custom-reports" element={<CustomReports />} />
            <Route path="process-data" element={<ProcessData />} />
            <Route path="fund-price" element={<FundPrice />} />
            <Route path="add-data" element={<CreateNew />} />
           <Route path="edit-data" element={<EditData />} />
           <Route path="operationscreen" element={<Operations />} />
           <Route path="updatepassword" element={< UpdatePassword/>} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
