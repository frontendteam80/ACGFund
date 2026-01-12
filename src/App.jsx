

// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login.jsx";
import PageLayout from "./components/PageLayout/PageLayout.jsx"; // or Dashboard/DashboardLayout.jsx
import CustomReports from "./components/CustomReports/CustomReports.jsx";
import ProcessData from "./components/ProcessData/ProcessData.jsx";
import FundPrice from "./components/FundPrice/FundPrice.jsx";
import CreateNew from "./components/CreateNew/CreateNew.jsx";
import EditData from "./components/EditData/EditData.jsx";
import Operations from "./components/Operations/Operations.jsx";
import UpdatePassword from "./components/UpdatePassword/UpdatePassword.jsx";
import Reports from "./components/Reports/Reports.jsx";
import Letters from "./components/Letters/Letters.jsx";
import DataMapping from "./components/DataMapping/DataMapping.jsx";
import { AuthProvider } from "./AuthContext/AuthContext.jsx";
import "./components/Utilites/Styles/message.scss";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* PATHLESS layout: no /dashboard segment */}
          <Route element={<PageLayout />}>
            <Route index element={<Navigate to="/customreports" replace />} />
            <Route path="/customreports" element={<CustomReports />} />
            <Route path="/processdata" element={<ProcessData />} />
            <Route path="/fundprice" element={<FundPrice />} />
            <Route path="/adddata" element={<CreateNew />} />
            <Route path="/editdata" element={<EditData />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/updatepassword" element={<UpdatePassword />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/Letters" element={<Letters/>} />
            <Route path="/dataMapping" element={<DataMapping/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
