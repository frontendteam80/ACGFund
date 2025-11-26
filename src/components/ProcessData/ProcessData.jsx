
// ProcessData.jsx (component)
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext/AuthContext.jsx';
import { fetchProcessParamTypes, fetchProcessData } from '../../AuthContext/Api.jsx';
import Select from 'react-select';
import { RotateCw } from 'lucide-react';
import '../CustomReports/CustomReports.css';

export default function ProcessData() {
  const { user } = useAuth();
  const userId = user?.id;
  const token = user?.token || localStorage.getItem('authToken');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load dropdown options dynamically
  useEffect(() => {
    async function loadOptions() {
      if (!token || !userId) return;
      const arr = await fetchProcessParamTypes(token, userId);
      console.log('Dropdown API response:', arr);
      setOptions(
        Array.isArray(arr)
          ? arr
              .map(opt => {
                const raw = opt?.RequestParamType ?? (typeof opt === 'string' ? opt : '');
                if (typeof raw === 'string' && raw)
                  return { value: raw, label: raw.replace(/^Process/, 'Process ') };
                return null;
              })
              .filter(Boolean)
          : []
      );
    }
    loadOptions();
  }, [token, userId]);

  // Fetch process data on selection or view click
  const handleView = async () => {
    if (!selected) return;
    setLoading(true);
    const paramType = typeof selected.value === 'string' ? selected.value.trim() : '';
    console.log('Fetching for paramType:', paramType);
    const result = await fetchProcessData(paramType, token, userId);
    setData(Array.isArray(result) ? result : []);
    setLoading(false);
  };

  

  const handleReset = () => {
    setSelected(null);
    setData([]);
  };

  return (
    <main className="maincontent-container">
      <div
        className="maincontent-filters-row"
        style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: 12, justifyContent: 'normal' }}
      >
        <div style={{ minWidth: 200 }}>
          <Select
            options={options}
            value={selected}
            onChange={setSelected}
            isClearable
            placeholder="Select Process Option"
            isDisabled={loading}
            classNamePrefix="react-select"
            maxMenuHeight={280}
          />
        </div>
        <button
          className="maincontent-btn maincontent-reset"
          onClick={handleReset}
          disabled={loading}
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCw size={18} />
          Reset Filters
        </button>
        <div>
          <button
            className="maincontent-btn maincontent-Run"
            disabled={!selected || loading}
            onClick={handleView}
          >
            {selected ? String(selected.label).trim().split(' ').slice(-1)[0] : 'Execute'}
          </button>
        </div>
      </div>
      <div className="maincontent-card">
        {loading ? (
          <div className="maincontent-empty">Loading Data...</div>
        ) : data && data.length > 0 ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <div className="maincontent-empty">Select a process option to view data.</div>
        )}
      </div>
    </main>
  );
}
