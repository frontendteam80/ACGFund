

// src/components/ProcessData/ProcessData.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import {
  fetchProcessParamTypes,
  fetchProcessData,
} from "../../AuthContext/Api.jsx";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { RotateCw, Calendar } from "lucide-react";
import Table from "../Utilites/Table/Table.jsx";
import "../CustomReports/CustomReports.scss";
import "./ProcessData.scss";

export default function ProcessData() {
  const { user } = useAuth();
  const userId = user?.id ?? user?.userId ?? null;
  const token = user?.token || localStorage.getItem("authToken");

  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [errorCode, setErrorCode] = useState(null);
  const [errorDescription, setErrorDescription] = useState("");

  const [detailRow, setDetailRow] = useState(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);

  const requiresEndDate =
    selected &&
    (String(selected.value) === "76" || String(selected.value) === "77");

  /* -------- load process options -------- */

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
                  "";
                if (!id || !label) return null;
                return {
                  value: id,
                  label: String(label).trim(),
                  requestParamType: "ProcessData",
                };
              })
              .filter(Boolean)
          : [];
        setOptions(mapped);
      } catch (err) {
        console.error("Failed to load process param types", err);
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
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  /* -------- view / fetch data -------- */

  const handleView = async () => {
    setErrorCode(null);
    setErrorDescription("");
    setResultRows([]);

    if (!selected) {
      setErrorCode(100);
      setErrorDescription("Please select a process option.");
      return;
    }
    if (requiresEndDate && !endDate) {
      setErrorCode(100);
      setErrorDescription(
        "Please select an End Date before executing this process."
      );
      return;
    }

    setLoading(true);
    try {
      const formattedEnd = formatDateForApi(endDate);

      const res = await fetchProcessData(
        selected.value,
        selected.requestParamType || "ProcessData",
        token,
        userId,
        null,
        formattedEnd
      );

      setErrorCode(res?.errorCode ?? null);
      setErrorDescription(res?.errorDescription ?? "");

      const rows = Array.isArray(res?.data) ? res.data : [];
      setResultRows(rows);
    } catch (err) {
      console.error("Error fetching process data", err);
      setErrorCode(100);
      setErrorDescription(
        "Unexpected error while loading process data (see console)."
      );
      setResultRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setEndDate(null);
    setErrorCode(null);
    setErrorDescription("");
    setResultRows([]);
    setDetailRow(null);
    setShowDetailsSidebar(false);
  };

  /* -------- table / columns -------- */

  const {
    columns,
    visibleColumns,
    hiddenColumns,
    alignMap,
    showDetailsColumn,
  } = useMemo(() => {
    if (!resultRows || resultRows.length === 0) {
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
    const visible = cols; // show all
    const hidden = [];

    const align = {};
    for (const c of cols) {
      const v = first[c];
      if (typeof v === "number") {
        align[c] = "right";
      } else {
        const numCandidate = String(v).replace(/[$,]/g, "").trim();
        align[c] =
          numCandidate !== "" && !Number.isNaN(Number(numCandidate))
            ? "right"
            : "left";
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

  /* -------- render -------- */

  const runLabel = selected
    ? String(selected.label).trim().split(" ").slice(-1)[0]
    : "Execute";

  const hasResults = resultRows && resultRows.length > 0;

  return (
    <main className="ProcessData-container">
      <div className="Processdata-filters-row">
        <div className="filters-left processdata-filters-left">
          <div className="filter-select processdata-select">
            <Select
              options={options}
              value={selected}
              onChange={(v) => {
                setSelected(v);
                setErrorCode(null);
                setErrorDescription("");
                setResultRows([]);
              }}
              isClearable
              placeholder="Select Process Option"
              isDisabled={loading}
              classNamePrefix="react-select"
            />
          </div>

          {requiresEndDate && (
            <div className="filter-date-wrapper processdata-date-wrapper">
              <DatePicker
                selected={endDate}
                onChange={(d) => {
                  setEndDate(d);
                  setErrorCode(null);
                  setErrorDescription("");
                }}
                dateFormat="MM-dd-yyyy"
                placeholderText="End Date"
                className="maincontent-filter"
                maxDate={new Date()}
                disabled={loading}
              />
              <Calendar size={18} className="calendar-icon" />
            </div>
          )}
          <button
            className="maincontent-btn maincontent-Run"
            onClick={handleView}
            type="button"
            disabled={!selected || loading}
          >
            {runLabel}
          </button>
        {/* </div> */}

        {/* <div className="processdata-buttons"> */}
          <button
            className="maincontent-btn maincontent-reset"
            onClick={handleReset}
            type="button"
            disabled={loading}
          >
            <RotateCw size={18} />
            Reset Filters
          </button>
        </div>
      </div>

      <div className=" processdata-card">
        {loading ? (
          <div className="maincontent-empty">Loading Data...</div>
        ) : errorDescription ? (
          <div
            className={`maincontent-empty processdata-message ${
              errorCode === 0 ? "processdata-success" : "processdata-error"
            }`}
          >
            {errorDescription}
          </div>
        ) : hasResults ? (
          <>
            <div className="processdata-results-header">
              {`Results — ${resultRows.length} rows`}
            </div>
            <Table
              columns={visibleColumns}
              data={resultRows}
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
      </div>
    </main>
  );
}
