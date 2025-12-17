
// src/components/Operations/Operations.jsx
import React, { useEffect, useMemo, useState, forwardRef, useRef } from "react";
import Table from "../Utilites/Table/Table.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import SelectDropDown from "../Utilites/DropDown/DropDown.jsx";
import Loader from "../Utilites/Loader/Loader.jsx";
import api from "../../AuthContext/Api.jsx";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import DatePicker from "react-datepicker";
import GrantStatus from "../GrantStatus/GrantStatus.jsx";
import ContributionStatus from "../Contribution/Contribution.jsx";
import { Calendar } from "lucide-react";
import "./Operations.scss";

/* ---------------- Helpers ---------------- */
function getAdvisorId(a) {
  return (
    (a &&
      (a.AgentNumber ||
        a.agentNumber ||
        a.AgentID ||
        a.agentId ||
        a.id)) ||
    null
  );
}

function getAdvisorLabel(a) {
  if (!a) return "";
  return a.AgentName || a.agentName || a.name || String(getAdvisorId(a) || "");
}

function getParticipantKey(p, idx) {
  if (!p) return `p-${idx}`;
  const key =
    p.ParticipantNumber ||
    p.ParticipantId ||
    p.ParticipantID ||
    p.id ||
    p.ParticipantName ||
    null;
  return key != null ? String(key) : `p-${idx}`;
}

/* ---------------- Custom Date Input ---------------- */
const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div
    onClick={onClick}
    ref={ref}
    className="custom-date-input"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      border: "1px solid #E6E9EE",
      background: "#FFFFFF",
      borderRadius: 8,
      padding: "6px",
      height: 40,
      cursor: "pointer",
      boxSizing: "border-box",
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
        background: "transparent",
        outline: "none",
        fontSize: "14px",
        color: "#344054",
      }}
    />
    <Calendar size={18} strokeWidth={1.6} color="#667085" />
  </div>
));
CustomDateInput.displayName = "CustomDateInput";

/* ---------------- Component ---------------- */
export default function Operations() {
  const { user, token } = useAuth();
  const userId = user?.id || user?.UserID || null;
  const sourceRef = useRef(null);

  const operationOptions = useMemo(
    () => [
      { value: "transfer", label: "Transfer of Agent" },
      { value: "grantStatus", label: "Grant Status" },
      { value: "contributionStatus", label: "Contribution Status" },
    ],
    []
  );

  const [operationType, setOperationType] = useState(null);

  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  const [selectedFromId, setSelectedFromId] = useState(null);
  const [selectedToId, setSelectedToId] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");

  const [selectedParticipantIds, setSelectedParticipantIds] = useState(
    new Set()
  );
  const [endDate, setEndDate] = useState(null);
  const [shareType, setShareType] = useState("funds");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  /* ---------------- Load advisors ---------------- */
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

  /* ---------------- Load participants when source changes ---------------- */
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
          setLoadingParticipants(false);
          return;
        }

        const rows =
          (await api.fetchParticipants(userId, token, selectedFromId)) || [];

        const strictFiltered = (rows || []).filter((p) => {
          const adv =
            (p &&
              (p.ParticipantFinancialAdvisor ||
                p.participantFinancialAdvisor ||
                p.Advisor)) ||
            null;
          return adv != null && String(adv).trim() === String(selectedFromId);
        });

        const finalList =
          strictFiltered.length > 0
            ? strictFiltered
            : (rows || []).filter((p) =>
                String(
                  (p && p.ParticipantFinancialAdvisor) || ""
                ).includes(String(selectedFromId))
              );

        if (mounted) {
          setParticipants(finalList);
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

  const advisorOptions = useMemo(
    () =>
      (advisors || []).map((a) => ({
        value: String(getAdvisorId(a)),
        label: `${getAdvisorId(a)} — ${getAdvisorLabel(a)}`,
      })),
    [advisors]
  );

  /* ---------------- Selection helpers ---------------- */
  const filteredParticipants = useMemo(() => {
    const q = (participantSearch || "").toLowerCase();
    if (!q) return participants || [];
    return (participants || []).filter((p) => {
      const name = String((p && p.ParticipantName) || "");
      const email = String((p && (p.EmailAddress || p.Email)) || "");
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [participants, participantSearch]);

  const allVisibleSelected =
    (filteredParticipants || []).length > 0 &&
    (filteredParticipants || []).every((p, idx) =>
      selectedParticipantIds.has(getParticipantKey(p, idx))
    );

  const toggleParticipantSelection = (key) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked) => {
    if (checked) {
      setSelectedParticipantIds((prev) => {
        const next = new Set(prev);
        (filteredParticipants || []).forEach((p, idx) =>
          next.add(getParticipantKey(p, idx))
        );
        return next;
      });
    } else {
      setSelectedParticipantIds((prev) => {
        const next = new Set(prev);
        (filteredParticipants || []).forEach((p, idx) =>
          next.delete(getParticipantKey(p, idx))
        );
        return next;
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "__select",
        label: (
          <input
            type="checkbox"
            aria-label="Select all visible"
            checked={allVisibleSelected}
            onChange={(e) => toggleSelectAllVisible(e.target.checked)}
          />
        ),
        width: 48,
      },
      { key: "ParticipantNumber", label: "Participant Number" },
      { key: "name", label: "Name" },
    ],
    [allVisibleSelected, filteredParticipants]
  );

  const selectedParticipantsList = useMemo(() => {
    const all = participants || [];
    const selected = [];
    all.forEach((p, idx) => {
      const k = getParticipantKey(p, idx);
      if (selectedParticipantIds.has(k)) selected.push({ ...p, __key: k });
    });
    return selected;
  }, [participants, selectedParticipantIds]);

  const formatDateForBackend = (d) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  /* ---------------- Validation & submit ---------------- */
  const validateBeforeConfirm = () => {
    if (!selectedFromId) {
      window.alert("Please select a source advisor.");
      return false;
    }
    if (!selectedToId) {
      window.alert("Please select a destination advisor.");
      return false;
    }
    if (String(selectedFromId) === String(selectedToId)) {
      window.alert("Source and destination advisors must be different.");
      return false;
    }
    if (!endDate) {
      window.alert("Please select an End Date.");
      return false;
    }
    if (!shareType) {
      window.alert("Please choose a Type of share (Funds or Shares).");
      return false;
    }
    if (!selectedParticipantIds || selectedParticipantIds.size === 0) {
      window.alert("Please select at least one participant to transfer.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!validateBeforeConfirm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    const payload = {
      fromAdvisor: selectedFromId,
      toAdvisor: selectedToId,
      participants: Array.from(selectedParticipantIds),
      endDate: formatDateForBackend(endDate),
      shareType,
    };

    setConfirming(true);
    try {
      if (api && typeof api.transferParticipants === "function") {
        await api.transferParticipants(userId, token, payload);
      } else {
        console.log("TRANSFER PAYLOAD (no api.transferParticipants):", payload);
      }

      setShowConfirmModal(false);
      setSelectedParticipantIds(new Set());
      window.alert("Participants transferred successfully.");
    } catch (err) {
      console.error("transfer error", err);
      window.alert("Transfer failed. See console for details.");
    } finally {
      setConfirming(false);
    }
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

  /* ---------------- Render rules ---------------- */
  const endDateEnabled = operationType === "transfer" && !!selectedFromId;

  const fixedSelectStyles = {
    container: (base) => ({
      ...base,
      width: 240,
      minWidth: 240,
      maxWidth: 240,
    }),
    control: (base) => ({
      ...base,
      width: 240,
      minWidth: 240,
      maxWidth: 240,
    }),
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
      maxWidth: "100%",
    }),
  };

  // autofocus source when transfer is selected
  useEffect(() => {
    if (operationType === "transfer") {
      if (
        sourceRef &&
        sourceRef.current &&
        typeof sourceRef.current.focus === "function"
      ) {
        sourceRef.current.focus();
      }
    }
  }, [operationType]);

  return (
    <div className="ops-root">
      {/* Top area arranged in rows */}
      <div className="ops-grid">
        {/* Row 1 - Operation Type (full width) */}
        <div className="ops-row ops-row--full">
          <div className="ops-field">
            <label className="select-label">Operation Type</label>
            <div className="select-control">
              <SelectDropDown
                options={operationOptions}
                value={operationOptions.find(
                  (o) => o.value === operationType
                )}
                onChange={(o) => {
                  const val = (o && o.value) || null;
                  setOperationType(val);
                  // reset fields when operation changes
                  setSelectedFromId(null);
                  setSelectedToId(null);
                  setParticipants([]);
                  setSelectedParticipantIds(new Set());
                  setEndDate(null);
                  setShareType("funds");
                  setParticipantSearch("");
                }}
                placeholder="Select operation..."
                isClearable
                isSearchable
                styles={fixedSelectStyles}
              />
            </div>
          </div>
        </div>

        {/* Row 2+ only for transfer */}
        {operationType === "transfer" && (
          <>
            <div className="ops-row">
              <div className="ops-field">
                <label className="select-label">Source(From)</label>
                <div className="select-control">
                  <SelectDropDown
                    ref={sourceRef}
                    options={advisorOptions}
                    value={advisorOptions.find(
                      (o) => o.value === selectedFromId
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
                      (o) => o.value !== selectedFromId
                    )}
                    value={advisorOptions.find(
                      (o) => o.value === selectedToId
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

            {/* Row 3 - End Date & Type of Share */}
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
          </>
        )}
      </div>

      {/* Body */}
      {operationType === "transfer" ? (
        <form onSubmit={handleSubmit}>
          <div className="ops-panel">
            {!selectedFromId ? (
              <div
                className="muted"
                style={{
                  padding: 20,
                  background: "#FBFBFC",
                  borderRadius: 8,
                }}
              >
                <strong>
                  Select a Source advisor to load participants.
                </strong>
              </div>
            ) : (
              <>
                <div className="panel-header">
                  <h3>Participants</h3>
                  <div className="search-wrap">
                    <SearchBar
                      placeholder="Search participants..."
                      debounceMs={250}
                      onChange={(v) => setParticipantSearch(v)}
                    />
                  </div>
                </div>

                <div className="panel-body">
                  {loadingParticipants ? (
                    <div className="loader-wrap">
                      <Loader
                        text="Loading participants..."
                        size={45}
                      />
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
                        (!participants ||
                          participants.length === 0) && (
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
            ) : operationType === "grantStatus" ? (
        <div className="grant-status-fullscreen">
          <GrantStatus userId={userId} />
        </div>
      ) : operationType === "contributionStatus" ? (
        <div className="grant-status-fullscreen">
          <ContributionStatus userId={userId} />
        </div>
      ) : (

        <div style={{ padding: 8, color: "#475569" }}>
          Select an operation type to begin.
        </div>
      )}

      {/* Confirm modal */}
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
                      (a) => a.value === selectedFromId
                    )?.label || selectedFromId
                  : "-"}
              </div>
              <div>
                <strong>To:</strong>{" "}
                {selectedToId
                  ? advisorOptions.find(
                      (a) => a.value === selectedToId
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
                Participants ({selectedParticipantsList.length}):
              </strong>
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
  );
}
