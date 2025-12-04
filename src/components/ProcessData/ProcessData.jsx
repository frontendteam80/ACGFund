
// src/components/ProcessData/ProcessData.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import { fetchProcessParamTypes, fetchProcessData } from '../../AuthContext/Api.jsx';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { RotateCw, Calendar } from 'lucide-react';
import Table from '../Utilites/Table/Table.jsx';
import '../CustomReports/CustomReports.css';
import './ProcessData.scss';

export default function ProcessData() {
  const { user } = useAuth();
  const userId = user?.id ?? user?.userId ?? null;
  const token = user?.token || localStorage.getItem('authToken');

  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultRows, setResultRows] = useState([]); // always array
  const [errorCode, setErrorCode] = useState(null);
  const [errorDescription, setErrorDescription] = useState('');

  // Details sidebar
  const [detailRow, setDetailRow] = useState(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);

  // Which param IDs require an EndDate
  const requiresEndDate =
    selected && (String(selected.value) === '76' || String(selected.value) === '77');

  // Load process param types for the dropdown
  useEffect(() => {
    async function load() {
      if (!token || !userId) return;
      try {
        const arr = await fetchProcessParamTypes(token, userId);
        const mapped = Array.isArray(arr)
          ? arr
              .map((opt) => {
                if (!opt) return null;
                const id = opt.ID ?? opt.Id ?? opt.ParamID ?? opt.Value;
                const label =
                  opt.DisplayRequestParamType ??
                  opt.DisplayRequestType ??
                  opt.RequestParamType ??
                  opt.Name ??
                  opt.AdminCustomReportName ??
                  '';
                if (!id || !label) return null;
                return {
                  value: id,
                  label: String(label).trim(),
                  requestParamType: 'ProcessData',
                };
              })
              .filter(Boolean)
          : [];
        setOptions(mapped);
      } catch (err) {
        console.error('Failed to load process param types', err);
        setOptions([]);
      }
    }
    load();
  }, [token, userId]);

  useEffect(() => {
    if (!requiresEndDate) setEndDate(null);
  }, [requiresEndDate]);

  const formatDateForApi = (d) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleView = async () => {
    setErrorCode(null);
    setErrorDescription('');
    setResultRows([]);

    if (!selected) {
      setErrorCode(100);
      setErrorDescription('Please select a process option.');
      return;
    }
    if (requiresEndDate && !endDate) {
      setErrorCode(100);
      setErrorDescription('Please select an End Date before executing this process.');
      return;
    }

    setLoading(true);
    try {
      const formattedEnd = formatDateForApi(endDate);

      const res = await fetchProcessData(
        selected.value,
        selected.requestParamType || 'ProcessData',
        token,
        userId,
        null,
        formattedEnd
      );

      console.log('fetchProcessData result:', res);

      setErrorCode(res?.errorCode ?? null);
      setErrorDescription(res?.errorDescription ?? '');

      const rows = Array.isArray(res?.data) ? res.data : [];

      if (rows.length > 0) {
        console.log('rows for table:', rows);
        setResultRows(rows);
      } else {
        setResultRows([]);
      }
    } catch (err) {
      console.error('Error fetching process data', err);
      setErrorCode(100);
      setErrorDescription('Unexpected error while loading process data (see console).');
      setResultRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setEndDate(null);
    setErrorCode(null);
    setErrorDescription('');
    setResultRows([]);
  };

  // Build columns and alignment from first row
  const { columns, visibleColumns, hiddenColumns, alignMap, showDetailsColumn } = useMemo(() => {
    if (!resultRows || !Array.isArray(resultRows) || resultRows.length === 0) {
      return {
        columns: [],
        visibleColumns: [],
        hiddenColumns: [],
        alignMap: {},
        showDetailsColumn: false,
      };
    }
    const first = resultRows[0];
    const cols = Object.keys(first);

    const visible = cols.slice(0, cols.length); // show all columns
    const hidden = cols.slice(visible.length);

    const align = {};
    for (const c of cols) {
      const v = first[c];
      if (typeof v === 'number') align[c] = 'right';
      else {
        const numCandidate = String(v).replace(/[$,]/g, '').trim();
        if (numCandidate !== '' && !Number.isNaN(Number(numCandidate))) align[c] = 'right';
        else align[c] = 'left';
      }
    }
    return {
      columns: cols,
      visibleColumns: visible,
      hiddenColumns: hidden,
      alignMap: align,
      showDetailsColumn: hidden.length > 0,
    };
  }, [resultRows]);

  const onDetails = (row) => {
    setDetailRow(row);
    setShowDetailsSidebar(true);
  };
  const closeSidebar = () => {
    setDetailRow(null);
    setShowDetailsSidebar(false);
  };

  return (
    <main className="maincontent-container">
      <div
        className="maincontent-filters-row"
        style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12 }}
      >
        <div style={{ minWidth: 260 }}>
          <Select
            options={options}
            value={selected}
            onChange={(v) => {
              setSelected(v);
              setErrorCode(null);
              setErrorDescription('');
              setResultRows([]);
            }}
            isClearable
            placeholder="Select Process Option"
            isDisabled={loading}
            classNamePrefix="react-select"
          />
        </div>

        {requiresEndDate && (
          <div style={{ position: 'relative', display: 'inline-block', minWidth: 140 }}>
            <DatePicker
              selected={endDate}
              onChange={(d) => {
                setEndDate(d);
                setErrorCode(null);
                setErrorDescription('');
              }}
              dateFormat="MM-dd-yyyy"
              placeholderText="End Date"
              className="maincontent-filter"
              maxDate={new Date()}
              disabled={loading}
            />
            <Calendar
              size={18}
              style={{
                position: 'absolute',
                right: '20px',
                top: '45%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6b7280',
              }}
            />
          </div>
        )}

        <button
          className="maincontent-btn maincontent-reset"
          onClick={handleReset}
          type="button"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={18} />
          Reset Filters
        </button>

        <button
          className="maincontent-btn maincontent-Run"
          onClick={handleView}
          type="button"
          disabled={!selected || loading}
          style={{ marginLeft: 6 }}
        >
          {selected ? String(selected.label).trim().split(' ').slice(-1)[0] : 'Execute'}
        </button>
      </div>

      <div className="maincontent-card" style={{ position: 'relative' }}>
        {loading ? (
          <div className="maincontent-empty">Loading Data...</div>
        ) : errorDescription ? (
          <div
            className="maincontent-empty"
            style={{ color: errorCode === 0 ? 'green' : '#e53838' }}
          >
            {errorDescription}
          </div>
        ) : resultRows && resultRows.length > 0 ? (
          <>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>
              {`Results — ${resultRows.length} rows`}
            </div>
            <Table
              columns={visibleColumns}
              data={resultRows || []}
              onDetails={onDetails}
              showDetailsColumn={showDetailsColumn}
              alignMap={alignMap}
            />
          </>
        ) : (
          <div className="maincontent-empty">
            <div className="maincontent-empty-text">
              Select a process option to view data.
            </div>
          </div>
        )}

        <aside className={`details-sidebar ${showDetailsSidebar ? 'open' : ''}`} style={{ width: 520 }}>
          <div className="sidebar-header">
            <button className="sidebar-close-btn" onClick={closeSidebar} type="button">
              ×
            </button>
            <h2>Details</h2>
          </div>
          <div
            className="sidebar-content"
            style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
          >
            {detailRow ? (
              <table className="details-modal-table" style={{ width: '100%' }}>
                <tbody>
                  {Object.keys(detailRow).map((k) => (
                    <tr key={k}>
                      <th style={{ textAlign: 'left', width: '35%', background: '#f5f7fb' }}>
                        {k}
                      </th>
                      <td style={{ padding: '8px 12px' }}>
                        {detailRow[k] == null || detailRow[k] === '' ? '-' : String(detailRow[k])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#6b7280' }}>Select a row to view details.</div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
