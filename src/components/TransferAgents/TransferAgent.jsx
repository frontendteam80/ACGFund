// src/components/TransferAgent/TransferAgent.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useRef,
} from "react";
import Table from "../Utilites/Table/Table.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import SelectDropDown from "../Utilites/DropDown/DropDown.jsx";
import Loader from "../Utilites/Loader/Loader.jsx";
import api from "../../AuthContext/Api.jsx";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import "./TransferAgent.scss"; // Create this SCSS file

/* =========================================================
   Helpers (EXACT SAME)
 ========================================================= */
function getAdvisorId(a) {
  if (!a) return null;
  return a.AgentNumber || a.agentNumber || null;
}

function getAdvisorLabel(a) {
  if (!a) return "";
  const num = a.AgentNumber || "";
  const name = a.AgentName || "";
  return `${num} — ${name}`;
}

function getParticipantKey(p, idx) {
  return String(
    p?.ParticipantID ??
      p?.ParticipantId ??
      p?.ParticipantNumber ??
      idx
  );
}

/* =========================================================
   Custom Date Input (EXACT SAME)
 ========================================================= */
const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className="custom-date-input"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      border: "1px solid #E6E9EE",
      background: "#fff",
      borderRadius: 8,
      padding: 6,
      height: 40,
      cursor: "pointer",
      minWidth: 180,
    }}
  >
    <input
      readOnly
      value={value || ""}
      placeholder={placeholder}
      style={{
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
      }}
    />
    <Calendar size={18} />
  </div>
));
CustomDateInput.displayName = "CustomDateInput";

export default function TransferAgent({ userId }) {
  const { token } = useAuth();
  const sourceRef = useRef(null);

  /* ---------------- State (EXACT SAME) ---------------- */
  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [selectedFromId, setSelectedFromId] = useState(null);
  const [selectedToId, setSelectedToId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState(new Set());
  const [endDate, setEndDate] = useState(null);
  const [shareType, setShareType] = useState("funds");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  /* ---------------- Select styles (EXACT SAME) ---------------- */
  const fixedSelectStyles = {
    container: (base) => ({ ...base, width: 240 }),
    control: (base) => ({ ...base, width: 240 }),
    valueContainer: (base) => ({
      ...base,
      overflow: "hidden",
      whiteSpace: "nowrap",
    }),
    singleValue: (base) => ({
      ...base,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
  };

  const endDateEnabled = !!selectedFromId;

  /* =========================================================
     Load Advisors (EXACT SAME)
   ========================================================= */
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingAdvisors(true);
      try {
        const rows = await api.fetchAdvisors(userId, token);
        if (mounted) setAdvisors(Array.isArray(rows) ? rows : []);
      } catch {
        if (mounted) setAdvisors([]);
      } finally {
        if (mounted) setLoadingAdvisors(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId, token]);

  /* =========================================================
     Load Participants (EXACT SAME)
   ========================================================= */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingParticipants(true);
      try {
        if (!selectedFromId) {
          if (mounted) {
            setParticipants([]);
            setSelectedParticipantIds(new Set());
          }
          return;
        }

        const rows = await api.fetchParticipants(userId, token);

        
        const filtered = (rows || []).filter(
          (p) =>
            String(p.ParticipantFinancialAdvisor).trim() ===
            String(selectedFromId).trim()
        );

        if (mounted) {
          setParticipants(filtered);
          setSelectedParticipantIds(new Set());
        }
      } catch {
        if (mounted) {
          setParticipants([]);
          setSelectedParticipantIds(new Set());
        }
      } finally {
        if (mounted) setLoadingParticipants(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [userId, token, selectedFromId]);

  /* =========================================================
     Derived Data (EXACT SAME)
   ========================================================= */
  const advisorOptions = useMemo(
    () =>
      (advisors || []).map((a) => ({
        value: String(getAdvisorId(a)),
        label: getAdvisorLabel(a),
      })),
    [advisors]
  );

  const filteredParticipants = useMemo(() => {
    const q = (participantSearch || "").toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      String(p.ParticipantName || "")
        .toLowerCase()
        .includes(q)
    );
  }, [participants, participantSearch]);

  const selectedParticipantsList = useMemo(() => {
    const list = [];
    participants.forEach((p, idx) => {
      const k = getParticipantKey(p, idx);
      if (selectedParticipantIds.has(k)) list.push(p);
    });
    return list;
  }, [participants, selectedParticipantIds]);

  // Select All Logic (EXACT SAME)
  const allVisibleSelected = filteredParticipants.length > 0 && 
    filteredParticipants.every((p, idx) => selectedParticipantIds.has(getParticipantKey(p, idx)));

  const toggleSelectAllVisible = (checked) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      filteredParticipants.forEach((p, idx) => {
        const key = getParticipantKey(p, idx);
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });
      return next;
    });
  };

  const columns = [
    {
      key: "__select",
      label: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={(e) => toggleSelectAllVisible(e.target.checked)}
        />
      ),
      width: 48,
    },
    { key: "ParticipantNumber", label: "Participant Number" },
    { key: "name", label: "Name" },
  ];

  /* =========================================================
     Handlers (EXACT SAME)
   ========================================================= */
  const toggleParticipantSelection = (key) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleReset = () => {
    setSelectedFromId(null);
    setSelectedToId(null);
    setParticipants([]);
    setSelectedParticipantIds(new Set());
    setParticipantSearch("");
    setEndDate(null);
    setShareType("funds");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    setConfirming(true);
    try {
      await api.transferParticipants(userId, token, {
        SourceAgentNumber: selectedFromId,
        DestinationAgentNumber: selectedToId,
        ParticipantIds:
          selectedParticipantIds.size === 0
            ? []
            : Array.from(selectedParticipantIds),
        EndDate: endDate,
        ShareType: shareType,
      });
      setShowConfirmModal(false);
      handleReset();
      alert("Transfer successful");
    } catch {
      alert("Transfer failed");
    } finally {
      setConfirming(false);
    }
  };

  /* =========================================================
     Render (EXACT SAME UI)
   ========================================================= */
  return (
    <div className="MainContent-card TransferAgent-card">
    <div className="transfer-agent-root">
      {/* Top area arranged in rows */}
      <div className="ops-grid">
        {/* Row 1 - Source & Destination */}
        <div className="ops-row">
          <div className="ops-field">
            <label className="select-label">Source(From)</label>
            <div className="select-control">
              <SelectDropDown
                ref={sourceRef}
                options={advisorOptions}
                value={advisorOptions.find(
                  (o) => o.value === String(selectedFromId)
                )}
                onChange={(o) => {
                  setSelectedFromId((o && o.value) || null);
                  setSelectedParticipantIds(new Set());
                  if (!o || !o.value) setSelectedToId(null);
                }}
                placeholder="Select Advisor"
                isClearable
                isSearchable
                styles={fixedSelectStyles}
              />
            </div>
          </div>

          <div className="ops-field">
            <label className="select-label">Destination(To)</label>
            <div className="select-control">
              <SelectDropDown
                options={(advisorOptions || []).filter(
                  (o) => o.value !== String(selectedFromId)
                )}
                value={advisorOptions.find(
                  (o) => o.value === String(selectedToId)
                )}
                onChange={(o) =>
                  setSelectedToId((o && o.value) || null)
                }
                placeholder="Select Advisor "
                isClearable
                isSearchable
                styles={fixedSelectStyles}
              />
            </div>
          </div>
        </div>

        {/* Row 2 - End Date & Type of Share */}
        <div className="ops-row">
          <div className="ops-field">
            <label className="select-label">End Date</label>
            <div className="select-control">
              <DatePicker
                selected={endDate}
                onChange={(d) => setEndDate(d)}
                dateFormat="dd-MM-yyyy"
                placeholderText={
                  endDateEnabled ? "Select End Date" : "Select Source first"
                }
                customInput={<CustomDateInput />}
                minDate={new Date()}
                disabled={!endDateEnabled}
                style={{ width: "240px" }}
              />
            </div>
          </div>

          <div className="ops-field ops-field--radio">
            <div className="FundsRow">
              <label
                className="select-label"
                style={{ alignItems: "center" }}
              >
                Type of Share
              </label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="shareType"
                    value="funds"
                    checked={shareType === "funds"}
                    onChange={() => setShareType("funds")}
                    disabled={!selectedFromId}
                  />
                  <span style={{ marginLeft: 6 }}>Funds</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="shareType"
                    value="shares"
                    checked={shareType === "shares"}
                    onChange={() => setShareType("shares")}
                    disabled={!selectedFromId}
                  />
                  <span style={{ marginLeft: 6 }}>Shares</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit}>
        <div className="ops-panel">
          {!selectedFromId ? (
            <div
              className="muted"
              style={{
                padding: 20,
                // background: "#FBFBFC",
                borderRadius: 8,
              }}
            >
              Select a Source advisor to load participants.
            </div>
          ) : (
            <>
              <div className="panel-header">
                <h3>Participants</h3>
                <div
                  className="search-wrap"
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <SearchBar
                    placeholder="Search participants..."
                    debounceMs={250}
                    onChange={(v) => setParticipantSearch(v)}
                  />
                  {selectedFromId && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="update-btn"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #051a36",
                        background: "#051a36",
                        color: "#fff",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Update
                      {selectedParticipantIds.size > 0
                        ? ` (${selectedParticipantIds.size})`
                        : " (All)"}
                    </button>
                  )}
                </div>
              </div>

              <div className="panel-body">
                {loadingParticipants ? (
                  <div className="loader-wrap">
                    <Loader text="Loading participants..." size={45} />
                  </div>
                ) : (
                  <>
                    <Table
                      columns={columns}
                      data={filteredParticipants}
                      showDetailsColumn={false}
                      renderValue={(row, col, idx) => {
                        if (col.key === "__select") {
                          const key = getParticipantKey(row, idx);
                          return (
                            <input
                              type="checkbox"
                              checked={selectedParticipantIds.has(key)}
                              onChange={() =>
                                toggleParticipantSelection(key)
                              }
                            />
                          );
                        }

                        if (col.key === "name") {
                          return row?.ParticipantName || "-";
                        }

                        return row?.[col.key] || "-";
                      }}
                    />

                    {!loadingParticipants &&
                      (!participants || participants.length === 0) && (
                        <div
                          style={{
                            padding: 20,
                            textAlign: "center",
                            color: "#475569",
                          }}
                        >
                          No participants found for the selected Source.
                        </div>
                      )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </form>

      {/* Confirm modal (EXACT SAME) */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,0.5)",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "720px",
              maxHeight: "80vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 10,
              padding: 20,
              boxShadow: "0 6px 24px rgba(15,23,42,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>
              Confirm Transfer
            </h3>

            <div style={{ marginBottom: 12 }}>
              <div>
                <strong>From:</strong>{" "}
                {selectedFromId
                  ? advisorOptions.find(
                      (a) => a.value === String(selectedFromId)
                    )?.label || selectedFromId
                  : "-"}
              </div>
              <div>
                <strong>To:</strong>{" "}
                {selectedToId
                  ? advisorOptions.find(
                      (a) => a.value === String(selectedToId)
                    )?.label || selectedToId
                  : "-"}
              </div>
              <div>
                <strong>End Date:</strong>{" "}
                {endDate
                  ? `${String(endDate.getDate()).padStart(
                      2,
                      "0"
                    )}-${String(endDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    )}-${endDate.getFullYear()}`
                  : "-"}
              </div>
              <div>
                <strong>Type:</strong> {shareType}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <strong>
                Participants (
                {selectedParticipantIds.size === 0
                  ? "All"
                  : selectedParticipantsList.length}
                ):
              </strong>
              {selectedParticipantIds.size > 0 && (
                <div style={{ marginTop: 8 }}>
                  <table
                    style={{ width: "100%", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <th style={{ padding: "6px 8px" }}>#</th>
                        <th style={{ padding: "6px 8px" }}>
                          Participant Number
                        </th>
                        <th style={{ padding: "6px 8px" }}>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParticipantsList.map((p, i) => (
                        <tr
                          key={p.__key || i}
                          style={{ borderBottom: "1px solid #fafafa" }}
                        >
                          <td style={{ padding: "8px" }}>{i + 1}</td>
                          <td style={{ padding: "8px" }}>
                            {p.ParticipantNumber ||
                              p.ParticipantId ||
                              "-"}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {p.ParticipantName ||
                              `${p.FirstName || ""} ${
                                p.LastName || ""
                              }`.trim() ||
                              "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
                disabled={confirming}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmTransfer}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "#051a36",
                  color: "#fff",
                  cursor: "pointer",
                }}
                disabled={confirming}
              >
                {confirming ? "Processing..." : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
