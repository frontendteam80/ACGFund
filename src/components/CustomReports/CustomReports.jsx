
// src/components/CustomReports/MainContent.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import { fetchCustomReportsList, fetchCustomReportData } from '../../AuthContext/Api.jsx';
import Table from '../Utilites/Table/Table.jsx';
import * as XLSX from 'xlsx';
import { Download, RotateCw, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
import Select from "../Utilites/DropDown/DropDown.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import './CustomReports.css';

function resolveUserId(u) {
  if (!u) return null;
  return (
    u.id ?? u.userId ?? u.UserID ?? u.UserId ?? u.profileId ?? u.sub ??
    (u.raw && (u.raw.id ?? u.raw.userId)) ?? null
  );
}

function roleAllowsReports(u) {
  if (!u) return false;
  const raw = String(u.normalizedRole ?? u.role ?? u.roleName ?? '').toLowerCase();
  const allowed = ['admin', 'administrator', 'ops', 'operation', 'operations', 'advisor', 'adviser', 'advisors'];
  if (allowed.includes(raw)) return true;
  const rolesArr = u.roles ?? u.Roles ?? (u.raw && u.raw.roles);
  if (Array.isArray(rolesArr) && rolesArr.length > 0) {
    const r = String(rolesArr[0]?.name ?? rolesArr[0]?.role ?? rolesArr[0] ?? '').toLowerCase();
    if (allowed.includes(r)) return true;
  }
  return raw.includes('admin') || raw.includes('op') || raw.includes('advisor') || raw.includes('advis');
}

function isEndDateOnlyReportName(name) {
  if (!name) return false;
  const lower = String(name).toLowerCase();
  const patterns = [
    'bill pay char',
    'bill add vendor',
    'bill add vendors',
    'bill pay charity',
  ];
  return patterns.some(p => lower.includes(p));
}

export default function MainContent({ activeItem }) {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarData, setSidebarData] = useState(null);
  const [reportName, setReportName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);

  const normalizedActive = (activeItem || '').toString().trim().toLowerCase();
  const userId = useMemo(() => resolveUserId(user), [user]);
  const token = useMemo(
    () => user?.token ?? user?.accessToken ?? user?.authToken ?? localStorage.getItem('authToken') ?? null,
    [user]
  );
  const canViewReports = roleAllowsReports(user);

  const autoLoadTimeoutRef = useRef(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    let aborted = false;
    async function loadReports() {
      if (!canViewReports) {
        setReports([]);
        return;
      }
      if (!userId || !token) {
        setReports([]);
        setErrorMessage('Missing user id or token in auth context. Check console for the `user` object.');
        return;
      }

      setLoading(true);
      setErrorMessage('');
      try {
        const arr = await fetchCustomReportsList(userId, token);
        if (!aborted) {
          setReports(arr || []);
          if (!arr || arr.length === 0) setErrorMessage('No custom reports found for this user.');
        }
      } catch (err) {
        if (!aborted) {
          console.error('[MainContent] error loading reports:', err);
          setReports([]);
          setErrorMessage('Failed to load reports (see console).');
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    loadReports();
    return () => {
      aborted = true;
    };
  }, [normalizedActive, userId, token, canViewReports, user]);

  const { typeOptions, operationsByType } = useMemo(() => {
    const typesSet = new Set();
    const grouped = {};
    for (const r of reports) {
      if (r.AdminCustomReportName && r.AdminCustomReportID) {
        const [type, operation] = r.AdminCustomReportName.split(' - ');
        if (type && operation) {
          const t = type.trim();
          typesSet.add(t);
          if (!grouped[t]) grouped[t] = [];
          grouped[t].push({
            label: operation.trim(),
            value: r.AdminCustomReportID,
            fullLabel: r.AdminCustomReportName
          });
        }
      }
    }
    return {
      typeOptions: Array.from(typesSet).map(t => ({ label: t, value: t })),
      operationsByType: grouped
    };
  }, [reports]);

  const typeOptionsWithAll = [{ label: "All", value: "all" }, ...typeOptions];

  const filteredOperationOptions = useMemo(() => {
    if (!selectedType || selectedType.value === "all") {
      return Object.values(operationsByType).flat();
    }
    return operationsByType[selectedType.value] || [];
  }, [selectedType, operationsByType]);

  const handleTypeChange = (opt) => {
    setSelectedType(opt);
    setSelectedOperation(null);
    setSelectedReportId('');
    setReportName('');
    setErrorMessage('');
    setFromDate(null);
    setToDate(null);
    setReportData([]);
  };

  const handleOperationChange = (opt) => {
    setSelectedOperation(opt);
    setSelectedReportId(opt && opt.value !== "all" ? opt.value : '');
    setReportName(opt && opt.value !== "all" ? opt.fullLabel : '');
    setErrorMessage('');
    setFromDate(null);
    setToDate(null);
    setReportData([]);
  };

  function formatDateForApi(date) {
    if (!date || !(date instanceof Date)) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${mm}-${dd}-${yyyy}`;
  }

  async function fetchMultipleReportsData(userIdParam, reportIds, tokenParam, from, to) {
    const combinedData = [];
    for (const id of reportIds) {
      const data = await fetchCustomReportData(userIdParam, id, tokenParam, from, to);
      if (Array.isArray(data)) combinedData.push(...data);
    }
    return combinedData;
  }

  const activeReportLabel = reportName || (selectedOperation && selectedOperation.fullLabel) || '';
  const showOnlyEndDate = isEndDateOnlyReportName(activeReportLabel);

  const handleView = async () => {
    setErrorMessage('');
    if (!userId || !token) {
      setErrorMessage('Missing user id or token.');
      return;
    }
    setDataLoading(true);

    try {
      const beginDate = showOnlyEndDate ? '' : formatDateForApi(fromDate);
      const endDate = formatDateForApi(toDate);

      if (showOnlyEndDate && !endDate) {
        setErrorMessage('Please select an End Date.');
        setDataLoading(false);
        return;
      }

      if ((!selectedType || selectedType.value === "all") && (!selectedOperation || selectedOperation.value === "all")) {
        const allReportIds = reports.map(r => r.AdminCustomReportID);
        const allData = await fetchMultipleReportsData(userId, allReportIds, token, beginDate, endDate);
        setReportData(allData);
        setReportName("All Reports");
      }
      else if (selectedType && selectedType.value !== "all" && (!selectedOperation || selectedOperation.value === "all")) {
        const reportIdsForType = operationsByType[selectedType.value]?.map(opt => opt.value) || [];
        const data = await fetchMultipleReportsData(userId, reportIdsForType, token, beginDate, endDate);
        setReportData(data);
        setReportName(`All ${selectedType.label} Reports`);
      }
      else {
        if (!selectedReportId) {
          setErrorMessage('Please select a report.');
          setDataLoading(false);
          return;
        }
        const rows = await fetchCustomReportData(userId, selectedReportId, token, beginDate, endDate);
        setReportData(rows || []);
        const name = reports.find(r => r.AdminCustomReportID === selectedReportId)?.AdminCustomReportName || '';
        setReportName(name);
      }
    } catch (err) {
      console.error('[MainContent] error fetching report data:', err);
      setReportData([]);
      setErrorMessage('Failed to load report data (see console).');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!showOnlyEndDate) return;
    if (!toDate || !selectedReportId) return;

    const t = setTimeout(() => {
      handleView();
    }, 150);

    return () => clearTimeout(t);
  }, [toDate, selectedReportId, showOnlyEndDate]);

  const handleReset = () => {
    setSelectedType(null);
    setSelectedOperation(null);
    setSelectedReportId('');
    setFromDate(null);
    setToDate(null);
    setReportData([]);
    setReportName('');
    setErrorMessage('');
    setSearchTerm('');
  };

  useEffect(() => {
    if (!selectedReportId || !userId || !token) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }
    if (autoLoadTimeoutRef.current) {
      clearTimeout(autoLoadTimeoutRef.current);
    }
    autoLoadTimeoutRef.current = setTimeout(() => {
      handleView();
    }, 300);
    return () => {
      if (autoLoadTimeoutRef.current) {
        clearTimeout(autoLoadTimeoutRef.current);
      }
    };
  }, [selectedReportId, userId, token]); // included userId & token to avoid stale values

  const allColumns = reportData.length > 0 ? Object.keys(reportData[0]) : [];
  const visibleColumns = allColumns.slice(0, 6);
  const hiddenColumns = allColumns.slice(6);
  const showDetailsColumn = hiddenColumns.length > 0;

  const filteredReportData = useMemo(() => {
    if (!searchTerm.trim()) return reportData;
    return reportData.filter(row => {
      return allColumns.some(col => {
        const value = row[col];
        return value && value.toString().toLowerCase().includes(searchTerm.trim().toLowerCase());
      });
    });
  }, [reportData, searchTerm, allColumns]);

  const openSidebar = (row) => {
    const details = Object.fromEntries(hiddenColumns.map(c => [c, row[c]]));
    setSidebarData(details);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setSidebarData(null);
    setShowSidebar(false);
  };

  const handleExportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filteredReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportName || 'Report');
    const fileName = `${reportName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <main className="maincontent-container">
      <div className="maincontent-filters-row">
        <div>
          <div style={{ display: 'flex', gap: 115, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 150 }}>
                <Select
                  options={typeOptionsWithAll}
                  value={selectedType}
                  onChange={handleTypeChange}
                  isClearable
                  placeholder="Select Report"
                  classNamePrefix="react-select"
                />
              </div>
              <div style={{ minWidth: 180 }}>
                <Select
                  options={filteredOperationOptions}
                  value={selectedOperation}
                  onChange={handleOperationChange}
                  isClearable
                  isSearchable
                  isDisabled={!selectedType || loading}
                  placeholder="Select Report Type"
                  classNamePrefix="react-select"
                />
              </div>

              <div style={{ position: "relative", display: "inline-block" }}>
                {!showOnlyEndDate && (
                  <div style={{ position: "relative", display: "inline-block", marginRight: 8 }}>
                    <DatePicker
                      selected={fromDate}
                      onChange={setFromDate}
                      dateFormat="MM-dd-yyyy"
                      placeholderText="BeginDate"
                      className="maincontent-filter"
                    />
                    <Calendar
                      size={18}
                      style={{ position: 'absolute', right: '10px', top: '45%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}
                    />
                  </div>
                )}

                <div style={{ position: "relative", display: "inline-block" }}>
                  <DatePicker
                    selected={toDate}
                    onChange={date => {
                      setToDate(date);
                      setErrorMessage('');
                    }}
                    dateFormat="MM-dd-yyyy"
                    placeholderText="End Date"
                    className="maincontent-filter"
                  />
                  <Calendar
                    size={18}
                    style={{ position: 'absolute', right: '10px', top: '45%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}
                  />
                </div>
              </div>

              <button
                className="maincontent-btn maincontent-reset"
                onClick={handleReset}
                type="button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCw size={18} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ color: 'crimson', padding: 8 }}>{errorMessage}</div>
      )}

      <div className="maincontent-card">
        <div className="maincontent-title-row">
          <div style={{ fontWeight: 'bold', marginBottom: 12, color: '#121212' }}>
            {reportName ? (
              <>Report: <span style={{ fontWeight: 600 }}>{reportName}</span> </> 
            ) : (
              <>Report Results </>
            )}
          </div>
          <div className="maincontent-search-export">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search reports..."
              className="maincontent-search"
            />
            <button
              className="maincontent-export"
              onClick={handleExportToExcel}
              disabled={!reportData || reportData.length === 0}
              title="Export to Excel"
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={18} />
              Export to Excel
            </button>
          </div>
        </div>

        {dataLoading ? (
          <div className="maincontent-empty">Loading Report Data...</div>
        ) : reportData.length > 0 ? (
          <div className="report-table-wrapper" style={{ position: 'relative' }}>
            <Table
              columns={visibleColumns}
              data={filteredReportData}
              onDetails={openSidebar}
              showDetailsColumn={showDetailsColumn}
            />
          </div>
        ) : (
          <div className="maincontent-empty">
            <svg width="48" height="48" fill="#BCC9DB" style={{ marginBottom: 12 }}>
              <rect x="9" y="26" width="6" height="13" rx="2" />
              <rect x="21" y="21" width="6" height="18" rx="2" />
              <rect x="33" y="31" width="6" height="8" rx="2" />
            </svg>
            <div className="maincontent-empty-text">
              {reportName ? 'No data for selected report.' : 'Select type and operation to load data.'}
            </div>
          </div>
        )}
      </div>

      {showSidebar && (
        <aside className="details-sidebar open">
          <div className="sidebar-header">
            <button className="sidebar-close-btn" onClick={closeSidebar} type="button">×</button>
            <h2>Details</h2>
          </div>
          <div className="sidebar-content">
            {sidebarData && Object.keys(sidebarData).length > 0 ? (
              Object.entries(sidebarData).map(([key, val]) => (
                <div className="sidebar-row" key={key}>
                  <span className="sidebar-label">{key}:</span>
                  <span className="sidebar-value">{val == null ? '' : String(val)}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#788' }}>No details available</div>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}
