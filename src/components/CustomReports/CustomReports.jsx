
// src/components/CustomReports/MainContent.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import {
  fetchCustomReportsList,
  fetchCustomReportData,
} from "../../AuthContext/Api.jsx";
import Table from "../Utilites/Table/Table.jsx";
import Loader from "../Utilites/Loader/Loader.jsx";
import * as XLSX from "xlsx";
import { Download, RotateCw, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import Select from "../Utilites/DropDown/DropDown.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import SlidePanel from "../Utilites/SlidePanel/SlidePanel.jsx";
import DetailsContent from "../Utilites/SlidePanel/DetailsContent.jsx";
import "./CustomReports.scss";

/* ---------------- helpers ---------------- */

function resolveUserId(u) {
  return (
    u?.id ??
    u?.userId ??
    u?.UserID ??
    u?.UserId ??
    u?.profileId ??
    u?.sub ??
    u?.raw?.id ??
    u?.raw?.userId ??
    null
  );
}

function roleAllowsReports(u) {
  if (!u) return false;
  const raw = String(u.normalizedRole ?? u.role ?? u.roleName ?? "")
    .toLowerCase()
    .trim();

  if (
    raw.includes("admin") ||
    raw.includes("op") ||
    raw.includes("advisor") ||
    raw.includes("advis")
  ) {
    return true;
  }

  const rolesArr = u.roles ?? u.Roles ?? u.raw?.roles;
  if (Array.isArray(rolesArr) && rolesArr.length > 0) {
    const r = String(rolesArr[0]?.name ?? rolesArr[0]).toLowerCase();
    return (
      r.includes("admin") ||
      r.includes("op") ||
      r.includes("advisor") ||
      r.includes("advis")
    );
  }

  return false;
}

function needsAnyDate(msg) {
  if (!msg) return false;
  return msg.toLowerCase().includes("date");
}

function needsBothDates(msg) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes("begin date") && lower.includes("end date");
}

function needsOnlyEndDate(msg) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes("end date") && !lower.includes("begin date");
}

function formatDateForApi(date) {
  if (!date || !(date instanceof Date)) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${yyyy}`;
}

/* ---------------- component ---------------- */

export default function MainContent({ activeItem }) {
  const { user } = useAuth();

  const userId = useMemo(() => resolveUserId(user), [user]);
  const token = useMemo(
    () =>
      user?.token ??
      user?.accessToken ??
      user?.authToken ??
      localStorage.getItem("authToken") ??
      null,
    [user]
  );

  const canViewReports = roleAllowsReports(user);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedType, setSelectedType] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportName, setReportName] = useState("");
  const [selectedDisplayMessage, setSelectedDisplayMessage] = useState("");

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [reportData, setReportData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const [showFilterDropdowns, setShowFilterDropdowns] = useState({});

  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const autoLoadRef = useRef(null);

  const requiresAnyDate = needsAnyDate(selectedDisplayMessage);
  const requiresBothDates = needsBothDates(selectedDisplayMessage);
  const requiresOnlyEndDate = needsOnlyEndDate(selectedDisplayMessage);

  /* -------- load reports list -------- */

  useEffect(() => {
    if (!canViewReports || !userId || !token) return;

    let cancelled = false;
    setLoading(true);

    fetchCustomReportsList(userId, token)
      .then((res) => {
        if (!cancelled) setReports(res || []);
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("Failed to load reports.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, token, canViewReports, activeItem]);

  /* -------- type / operation mapping -------- */

  const { typeOptions, operationsByType } = useMemo(() => {
    const map = {};
    const types = new Set();

    reports.forEach((r) => {
      if (!r.AdminCustomReportName || !r.AdminCustomReportID) return;
      const [type, op] = r.AdminCustomReportName.split(" - ");
      if (!type || !op) return;

      const t = type.trim();
      types.add(t);
      if (!map[t]) map[t] = [];

      map[t].push({
        label: op.trim(),
        value: r.AdminCustomReportID,
        fullLabel: r.AdminCustomReportName,
        displayMessage: r.AdminCustomReportDisplayMessage || "",
      });
    });

    return {
      typeOptions: Array.from(types).map((t) => ({ label: t, value: t })),
      operationsByType: map,
    };
  }, [reports]);

  const typeOptionsWithAll = [{ label: "All", value: "all" }, ...typeOptions];

  const operationOptions = useMemo(() => {
    if (!selectedType || selectedType.value === "all") {
      return Object.values(operationsByType).flat();
    }
    return operationsByType[selectedType.value] || [];
  }, [selectedType, operationsByType]);

  /* -------- handlers -------- */

  const handleTypeChange = (opt) => {
    setSelectedType(opt);
    setSelectedOperation(null);
    setSelectedReportId("");
    setReportName("");
    setSelectedDisplayMessage("");
    setFromDate(null);
    setToDate(null);
    setReportData([]);
    setErrorMessage("");
  };

  const handleOperationChange = (opt) => {
    setSelectedOperation(opt);
    setSelectedReportId(opt?.value || "");
    setReportName(opt?.fullLabel || "");
    setSelectedDisplayMessage(opt?.displayMessage || "");
    setFromDate(null);
    setToDate(null);
    setReportData([]);
    setErrorMessage("");
  };

  /* -------- FETCH LOGIC (updated dates) -------- */

  const handleView = async () => {
    if (!userId || !token || !selectedReportId) return;

    setDataLoading(true);
    setErrorMessage("");

    try {
      // 1) Always compute from pickers
      let beginDate = fromDate ? formatDateForApi(fromDate) : "";
      let endDate = toDate ? formatDateForApi(toDate) : "";

      // 2) End-date-only reports
      if (requiresOnlyEndDate) {
        if (!endDate) {
          setErrorMessage("Please select an End Date.");
          setDataLoading(false);
          return;
        }
        if (!beginDate) beginDate = endDate;
      }

      // 3) Begin+End reports
      if (requiresBothDates) {
        if (!beginDate || !endDate) {
          setErrorMessage("Please select Begin Date and End Date.");
          setDataLoading(false);
          return;
        }
      }

      // For no‑message reports: dates optional but whatever is picked is sent
      console.log("[CustomReports] dates:", {
        beginDate,
        endDate,
        selectedReportId,
      });

      const data = await fetchCustomReportData(
        userId,
        selectedReportId,
        token,
        beginDate,
        endDate
      );

      setReportData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[MainContent] error fetching report data:", e);
      setReportData([]);
      setErrorMessage("Failed to load report data.");
    } finally {
      setDataLoading(false);
    }
  };

  /* -------- AUTO LOAD RULES (old behavior) -------- */

  // Load when End Date selected
  useEffect(() => {
    if (!selectedReportId || !toDate) return;

    clearTimeout(autoLoadRef.current);
    autoLoadRef.current = setTimeout(handleView, 200);

    return () => clearTimeout(autoLoadRef.current);
  }, [toDate, selectedReportId]);

  // Load when report selected (no end date yet)
  useEffect(() => {
    if (!selectedReportId || toDate) return;

    clearTimeout(autoLoadRef.current);
    autoLoadRef.current = setTimeout(handleView, 300);

    return () => clearTimeout(autoLoadRef.current);
  }, [selectedReportId]);

  /* -------- filters, search, filter summary -------- */

  const toggleFilterDropdown = (column) => {
    setShowFilterDropdowns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleFilterChangeCol = (column, selected) => {
    let normalized;
    if (Array.isArray(selected)) normalized = selected;
    else if (selected) normalized = [selected];
    else normalized = [];

    setPendingFilters((prev) => ({
      ...prev,
      [column]: normalized,
    }));
  };

  const applyFilterColumn = (column) => {
    setFilters((prev) => ({
      ...prev,
      [column]: pendingFilters[column] || [],
    }));
    setShowFilterDropdowns((prev) => ({
      ...prev,
      [column]: false,
    }));
  };

  const clearFilterColumn = (column) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
    setPendingFilters((prev) => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setPendingFilters({});
    setShowFilterDropdowns({});
  };

  const filteredReportData = useMemo(() => {
    let data = reportData;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes(term)
        )
      );
    }

    Object.entries(filters).forEach(([col, optionsArray]) => {
      if (!Array.isArray(optionsArray) || optionsArray.length === 0) return;
      const allowed = optionsArray.map((opt) => String(opt?.value ?? ""));
      data = data.filter((row) =>
        allowed.includes(String(row[col] ?? ""))
      );
    });

    return data;
  }, [reportData, searchTerm, filters]);

  const columnFilterOptions = useMemo(() => {
    const options = {};
    if (filteredReportData.length === 0) return options;

    const allColumns = Object.keys(filteredReportData[0]);
    allColumns.forEach((col) => {
      const unique = [
        ...new Set(
          filteredReportData
            .map((row) => row[col])
            .filter(
              (val) => val !== null && val !== undefined && val !== ""
            )
        ),
      ];
      options[col] = unique
        .map((val) => ({ label: String(val), value: String(val) }))
        .slice(0, 50);
    });
    return options;
  }, [filteredReportData]);

  /* -------- reset -------- */

  const handleReset = () => {
    setSelectedType(null);
    setSelectedOperation(null);
    setSelectedReportId("");
    setFromDate(null);
    setToDate(null);
    setReportData([]);
    setReportName("");
    setSearchTerm("");
    setFilters({});
    setPendingFilters({});
    setShowFilterDropdowns({});
    setErrorMessage("");
    setSelectedDisplayMessage("");
  };

  /* -------- render (old layout + summary) -------- */

  const allColumns = reportData[0] ? Object.keys(reportData[0]) : [];
  const visibleColumns = allColumns.slice(0, 6);
  const hiddenColumns = allColumns.slice(6);

  return (
    <main className="CustomReports-container">
      {errorMessage && <div className="notification-row">{errorMessage}</div>}

      <div className="CustomReports-filters-row">
        <div className="filters-left">
          <Select
            options={typeOptionsWithAll}
            value={selectedType}
            onChange={handleTypeChange}
            isClearable
            placeholder="Select Report"
          />

          <Select
            options={operationOptions}
            value={selectedOperation}
            onChange={handleOperationChange}
            isClearable
            isSearchable
            isDisabled={!selectedType}
            placeholder="Select Report Type"
          />

          <div className="filter-date-wrapper">
             <DatePicker
               selected={fromDate}
              onChange={setFromDate}
               dateFormat="MM-dd-yyyy"
               placeholderText="Begin Date"
              className="maincontent-filter"
           />
            <Calendar size={18} className="calendar-icon" />
           </div>

           <div className="filter-date-wrapper">
            <DatePicker
               selected={toDate}
               onChange={(date) => {
                 setToDate(date);
                setErrorMessage("");
               }}
              dateFormat="MM-dd-yyyy"
              placeholderText="End Date"
               className="maincontent-filter"
             />
             <Calendar size={18} className="calendar-icon" />
           </div>
        </div>

        <button
          className="maincontent-btn maincontent-reset"
          onClick={handleReset}
          type="button"
        >
          <RotateCw size={18} /> Reset Filters
        </button>
      </div>

      <div className="MainContent-card">
        <div className="CustomReports-title-row">
          <div style={{ fontWeight: "bold", marginBottom: 12, color: "#121212" }}>
            {reportName ? (
              <>
                Report: <span style={{ fontWeight: 600 }}>{reportName}</span>
              </>
            ) : (
              <>Report Results</>
            )}
          </div>
          <div className="CustomReports-search-export">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search reports..."
              className="maincontent-search"
            />
            <button
              className="CustomReports-export"
              onClick={() => {
                if (!filteredReportData.length) {
                  alert("No data to export");
                  return;
                }
                const ws = XLSX.utils.json_to_sheet(filteredReportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(
                  wb,
                  ws,
                  reportName || "Report"
                );
                const fileName = `${
                  reportName || "Report"
                }_${new Date().toISOString().split("T")[0]}.xlsx`;
                XLSX.writeFile(wb, fileName);
              }}
              disabled={!filteredReportData.length}
              title="Export to Excel"
              type="button"
            >
              <Download size={18} />
              Export to Excel
            </button>
          </div>
        </div>

        {Object.keys(filters).length > 0 && (
          <div className="filter-summary">
            <ul className="filter-summary-list">
              {Object.entries(filters).map(([column, optionsArray]) => (
                <li key={column}>
                  {Array.isArray(optionsArray)
                    ? optionsArray.map((o) => o.label).join(", ")
                    : ""}
                </li>
              ))}
            </ul>
            <button
              onClick={clearAllFilters}
              className="filter-summary-clear-btn"
              type="button"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {dataLoading ? (
          <div className="maincontent-empty">
            <Loader text="Loading Reports..." size={40} />
          </div>
        ) : reportData.length > 0 ? (
          <Table
            columns={visibleColumns}
            data={filteredReportData}
            onDetails={(row) => {
              setSelectedRow(row);
              setShowSidebar(true);
            }}
            showDetailsColumn={hiddenColumns.length > 0}
            showFilters
            onFilterToggle={toggleFilterDropdown}
            isFilterActive={pendingFilters}
            showFilterDropdowns={showFilterDropdowns}
            columnFilterOptions={columnFilterOptions}
            onFilterChange={handleFilterChangeCol}
            onFilterClear={clearFilterColumn}
            onFilterApply={applyFilterColumn}
          />
        ) : (
          <div className="maincontent-empty">
             <svg width="48" height="48" fill="#BCC9DB" style={{ marginBottom: 12 }}>
              <rect x="9" y="26" width="6" height="13" rx="2" />
               <rect x="21" y="21" width="6" height="18" rx="2" />
              <rect x="33" y="31" width="6" height="8" rx="2" />
             </svg>
             <div className="maincontent-empty-text">
               {reportName
                ? "No data for selected report."
                : "Select type and operation to load data."}
             </div>
           </div>
        )}
      </div>

      {showSidebar && selectedRow && (
        <SlidePanel
          open={showSidebar}
          onClose={() => setShowSidebar(false)}
          title={`Details - ${reportName}`}
          width="520px"
        >
          <DetailsContent row={selectedRow} remainingCols={hiddenColumns} />
        </SlidePanel>
      )}
    </main>
  );
}


