
// src/pages/CustomReports/MainContent.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import { fetchCustomReportsList, fetchCustomReportData } from '../../AuthContext/Api.jsx';
import Table from '../Utilites/Table.jsx';
import * as XLSX from 'xlsx';
import './CustomReports.css';
import { Download, RotateCw } from 'lucide-react';
import Select from 'react-select';
import AddParticipantForm from '../Forms/Form.jsx';

function formatDate(input) {
  if (!input) return '';
  const [year, month, day] = input.split('-');
  return `${month}-${day}-${year}`;
}

function resolveUserId(u) {
  if (!u) return null;
  return (
    u.id ?? u.userId ?? u.UserID ?? u.UserId ?? u.profileId ?? u.sub ?? (u.raw && (u.raw.id ?? u.raw.userId)) ?? null
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

export default function MainContent({ activeItem }) {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarData, setSidebarData] = useState(null);
  const [reportName, setReportName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);

  // Notification & quick success message
  const [notification, setNotification] = useState('');
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const normalizedActive = (activeItem || '').toString().trim().toLowerCase();
  const userId = useMemo(() => resolveUserId(user), [user]);
  const token = useMemo(
    () => user?.token ?? user?.accessToken ?? user?.authToken ?? localStorage.getItem('authToken') ?? null,
    [user]
  );
  const canViewReports = roleAllowsReports(user);

  // load reports list (and expose refresh)
  useEffect(() => {
    let aborted = false;
    async function loadReports() {
      if (normalizedActive !== 'custom reports') {
        setReports([]);
        setSelectedType(null);
        setSelectedOperation(null);
        setSelectedReportId('');
        setReportName('');
        setErrorMessage('');
        return;
      }
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
          if (!arr || arr.length === 0)
            setErrorMessage('No custom reports found for this user.');
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

  // helper to refresh reports on successful add
  async function refreshReports() {
    if (!userId || !token) return;
    try {
      setLoading(true);
      const arr = await fetchCustomReportsList(userId, token);
      setReports(arr || []);
    } catch (err) {
      console.error('[MainContent] refreshReports error:', err);
    } finally {
      setLoading(false);
    }
  }

  const { typeOptions, operationsByType } = useMemo(() => {
    const typesSet = new Set();
    const grouped = {};
    for (const r of reports) {
      if (r.AdminCustomReportName && r.AdminCustomReportID) {
        const [type, operation] = r.AdminCustomReportName.split(' - ');
        if (type && operation) {
          typesSet.add(type.trim());
          if (!grouped[type.trim()]) grouped[type.trim()] = [];
          grouped[type.trim()].push({
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

  const filteredOperationOptions = useMemo(
    () => (selectedType ? operationsByType[selectedType.value] || [] : []),
    [selectedType, operationsByType]
  );

  const triggerNotification = () => {
    if (selectedType && selectedOperation) {
      setNotification(
        `Type: "${selectedType.label}", Operation: "${selectedOperation.label}" selected. Click "View" to update.`
      );
      setFiltersChanged(true);
    } else {
      setNotification('');
      setFiltersChanged(false);
    }
  };

  const handleTypeChange = (opt) => {
    setSelectedType(opt);
    setSelectedOperation(null);
    setSelectedReportId('');
    setReportName('');
    setNotification('');
    setFiltersChanged(false);
  };

  const handleOperationChange = (opt) => {
    setSelectedOperation(opt);
    setSelectedReportId(opt ? opt.value : '');
    setReportName(opt ? opt.fullLabel : '');
    if (selectedType && opt) {
      setNotification(
        `Label: "${selectedType.label}", Operation: "${opt.label}" selected. Click "View" to update.`
      );
      setFiltersChanged(true);
    } else {
      setNotification('');
      setFiltersChanged(false);
    }
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    triggerNotification();
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    triggerNotification();
  };

  const handleView = async () => {
    setErrorMessage('');
    setFiltersChanged(false);
    setNotification('');
    if (!selectedReportId) {
      setErrorMessage('Please select a report first.');
      return;
    }
    if (!userId || !token) {
      setErrorMessage('Missing user id or token.');
      return;
    }
    setDataLoading(true);
    try {
      const beginDate = formatDate(fromDate);
      const endDate = formatDate(toDate);
      const rows = await fetchCustomReportData(
        userId,
        selectedReportId,
        token,
        beginDate,
        endDate
      );
      setReportData(rows || []);
      setReportName(
        reports.find(r => r.AdminCustomReportID === selectedReportId)?.AdminCustomReportName ||
        ''
      );
      if (!rows || rows.length === 0) setErrorMessage('Report returned no rows.');
    } catch (err) {
      console.error('[MainContent] error fetching report data:', err);
      setReportData([]);
      setErrorMessage('Failed to load report data (see console).');
    } finally {
      setDataLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setSelectedOperation(null);
    setSelectedReportId('');
    setFromDate('');
    setToDate('');
    setReportData([]);
    setReportName('');
    setErrorMessage('');
    setSearchTerm('');
    setFiltersChanged(false);
    setNotification('');
  };

  // columns and search
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
    if (!selectedReportId || !reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filteredReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportName || 'Report');
    const fileName = `${reportName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // === NEW: onSave handler for AddParticipantForm ===
  const handleParticipantSaved = async (apiResult) => {
    console.log('[MainContent] participant saved:', apiResult);
    setShowAddParticipant(false);
    setSuccessMessage('Participant added successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);

    await refreshReports();

    if (selectedReportId) {
      handleView();
    }
  };

  return (
    <main className="maincontent-container">
      <div className="maincontent-filters-row">
        <div>
          <div
            style={{
              display: 'flex',
               gap: 45,
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{display:"flex",justifyContent:"space-between",gap:6}}>
            <div style={{ minWidth: 180 }}>
              <Select
                options={typeOptions}
                value={selectedType}
                onChange={handleTypeChange}
                isDisabled={loading}
                placeholder="Select Report"
                classNamePrefix="react-select"
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <Select
                options={filteredOperationOptions}
                value={selectedOperation}
                onChange={handleOperationChange}
                isDisabled={!selectedType || loading}
                placeholder="Select Operation"
                classNamePrefix="react-select"
              />
            </div>

            <input
              type="text"
              className="maincontent-filter"
              value={fromDate}
              onChange={handleFromDateChange}
              placeholder="MM-DD-YYYY"
            />
            <input
              type="text"
              className="maincontent-filter"
              value={toDate}
              onChange={handleToDateChange}
              placeholder="MM-DD-YYYY"
            />
            <button
              className="maincontent-btn maincontent-view"
              disabled={!selectedReportId || loading}
              onClick={handleView}
            >
              View
            </button>
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

            {/* ADD PARTICIPANT BUTTON */}
            
            <button
              className="maincontent-btn maincontent-new-participant"
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px',justifyContent:"space-around" }}
              onClick={() => setShowAddParticipant(true)}
            >
              + Add Participant
            </button>
            
          </div>
        </div>
      </div>

      {/* Notification area */}
      {filtersChanged && notification && (
        <div className="maincontent-notification"
          style={{
            color: '#121212',
            margin: '2px 0',
            fontWeight: 400,
            borderRadius: 4,
            padding: '7px'
          }}>
          {notification}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div style={{ color: 'green', margin: '6px 0', fontWeight: 500 }}>{successMessage}</div>
      )}

      {/* Add Participant Sidebar - PASS token and onSave handler */}
      <AddParticipantForm
        open={showAddParticipant}
        onClose={() => setShowAddParticipant(false)}
        onSave={handleParticipantSaved}
        token={token}
      />

      {/* Details sidebar */}
      {showSidebar && (
        <aside className="details-sidebar open">
          <div className="sidebar-header">
            <button className="sidebar-close-btn" onClick={closeSidebar} type="button">
              ×
            </button>
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

      <div className="maincontent-card">
        <div className="maincontent-title-row">
          <div style={{ fontWeight: 'bold', marginBottom: 12, color: '#121212' }}>
            Report Results ({filteredReportData.length} of {reportData.length} rows)
          </div>
          <div className="maincontent-search-export">
            <input
              className="maincontent-search"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{color:"#121212"}}
            />
            <button
              className="maincontent-export"
              onClick={handleExportToExcel}
              disabled={!selectedReportId || !reportData || reportData.length === 0}
              title="Export to Excel"
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={18} />
              Export to Excel
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ color: 'crimson', padding: 8 }}>{errorMessage}</div>
        )}

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
              Select type and operation, then click View to view data.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
