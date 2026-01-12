

// src/components/Reports/ParticipantStatements.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Loader from "../Utilites/Loader/Loader.jsx";
import { Download, Eye } from "lucide-react";
import Table from "../Utilites/Table/Table.jsx";
import { IconButton, Tooltip } from "@mui/material";
import api from "../../AuthContext/Api.jsx";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import "./Reports.scss";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";

/* ---------------- Helpers ---------------- */
const normalize = (v = "") =>
  v.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");

/* ---------------- Tab config ---------------- */
const REPORT_TABS = [
  { key: "statement", label: "Statements" },
  { key: "contributionletter", label: "Contributions" },
  { key: "grantletter", label: "Grant Letters" },
];

const Reports = () => {
  const { token } = useAuth();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("statement");

  
  /* ---------------- Fetch Statements ---------------- */
  const fetchStatements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchStatements(1, 2000, token);
      const rawData = Array.isArray(response)
        ? response
        : response?.Data ?? [];

      const transformed = rawData.map((item) => ({
        id: item.WWWID,
        participantNumber: item.ParticipantNumber ?? "-",
        participantName: item.ParticipantName ?? "-",
        reportType: item.ReportType ?? "",
        reportTypeKey: normalize(item.ReportType),
        type: item.Type ?? "-",
        wwwid: item.WWWID ?? "-",
        date: item.Date
          ? new Date(item.Date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          : "-",
        year: item.Year,
        downloadUrl: item.Url,
      }));

      setTableData(transformed);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const loadParticipants = async () => {
    try {
      const list = await api.fetchUserParticipantDetails(null, token);
      setParticipants(list || []);
    } catch (e) {
      setError("Unable to load participants");
    }
  };

  if (token) loadParticipants();
}, [token]);


  useEffect(() => {
    if (token) fetchStatements();
  }, [token]);

  /* ---------------- Columns ---------------- */
  const baseColumns = [
    { key: "participantNumber", label: "Participant Number" },
    { key: "participantName", label: "Participant Name" },
    { key: "date", label: "Date" },
    { key: "reportType", label: "Report Type" },
  ];

  const columns = useMemo(() => {
    if (activeTab === "statement") {
      return [...baseColumns, { key: "type", label: "Type" }];
    }
    if (activeTab === "contributionletter" || activeTab === "grantletter") {
      return [
        { key: "wwwid", label: "WWWID" },
        ...baseColumns,
      ];
    }
    return baseColumns;
  }, [activeTab]);

  /* ---------------- Filters ---------------- */
  const filteredData = useMemo(() => {
    let data = tableData.filter(
      (row) => row.reportTypeKey === activeTab
    );

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          r.participantName.toLowerCase().includes(q) ||
          r.participantNumber.toString().includes(q)
      );
    }

    if (yearFilter !== "All") {
      data = data.filter((r) => r.year === yearFilter);
    }

    return data;
  }, [tableData, activeTab, searchTerm, yearFilter]);

  /* ---------------- Export (Fixed) ---------------- */
  const handleExport = useCallback(() => {
    if (handleExport.disabled) return;
    handleExport.disabled = true;

    const csv = [
      ["Participant Number", "Participant Name", "Date"],
      ...filteredData.map((r) => [
        r.participantNumber,
        r.participantName,
        r.date,
      ]),
    ]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participant-reports.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      handleExport.disabled = false;
    }, 1000);
  }, [filteredData]);
  handleExport.disabled = false;

  /* ---------------- View (Working) ---------------- */
  const handleView = useCallback((row) => {
    if (!row.downloadUrl) return;
    window.open(row.downloadUrl, '_blank', 'noopener,noreferrer');
  }, []);

 /* ---------------- Download (DIRECT SYSTEM DOWNLOAD) ---------------- */
/* ---------------- Download (API PROXY – CORS SAFE) ---------------- */
const handleDownload = useCallback((row, index = 0) => {
  if (!row?.downloadUrl) return;

  // Build a meaningful filename
  const participant = row.participantNumber || "participant";
  const filename = `statement-${participant}-${index + 1}.pdf`;

  // Backend proxy URL (avoids CORS issues)
  const apiUrl = `/api/download?url=${encodeURIComponent(
    row.downloadUrl
  )}&filename=${encodeURIComponent(filename)}`;

  // Trigger browser download
  const link = document.createElement("a");
  link.href = apiUrl;
  link.download = filename; // browser fallback
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}, []);



  /* ---------------- Row Actions ---------------- */
 const renderRowActions = useCallback(
  (row, rowIndex) => (
    <>
      <Tooltip title="View PDF">
        <IconButton
          size="small"
          onClick={() => handleView(row)}
          disabled={!row.downloadUrl}
        >
          <Eye size={14} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Download PDF">
        <IconButton
          size="small"
          onClick={() => handleDownload(row, rowIndex)}
          disabled={!row.downloadUrl}
        >
          <Download size={14} />
        </IconButton>
      </Tooltip>
    </>
  ),
  [handleView, handleDownload]
);


  /* ---------------- UI ---------------- */
  return (
    <div className="MainContent-card reports-root">
      {/* ---------- Letter Number Input Section ---------- */}
      <div className="Tabs-SearchRow">
        <div className="pa-tabs">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`pa-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="Search-filters">
          <SearchBar
            placeholder="Search ..."
            debounceMs={300}
            onChange={(val) => setSearchTerm(String(val || "").trim())}
            onSearch={(val) => setSearchTerm(String(val || "").trim())}
          />
          <div className="reports-filters">
            <select
              className="reports-year-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <button
              className="CustomReports-export Report-export"
              onClick={handleExport}
              disabled={!filteredData.length || handleExport.disabled}
              title="Export to Excel"
              type="button"
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="reports-loader">
          <Loader size={48} text="Loading reports..." />
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredData}
          renderRowActions={renderRowActions}
          key={`${activeTab}-${searchTerm}-${yearFilter}`}
        />
      )}
    </div>
  );
};

export default Reports;
