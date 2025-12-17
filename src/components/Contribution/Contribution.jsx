// src/components/Operations/ContributionStatus.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import api from "../../AuthContext/Api.jsx";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import Table from "../Utilites/Table/Table.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import SlidePanel from "../Utilites/SlidePanel/SlidePanel.jsx";
import DetailsContent from "../Utilites/SlidePanel/DetailsContent.jsx";
import { Eye, Pencil } from "lucide-react";
import "./Contribution.scss";

export default function ContributionStatus({ userId }) {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // slide panel state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editStatusDetails, setEditStatusDetails] = useState("");

  // BULK update dropdown state (header)
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkStatusDetails, setBulkStatusDetails] = useState("");

  // load data
  useEffect(() => {
    if (!userId || !token) return;

    async function load() {
      setLoading(true);
      try {
        const data = await api.fetchContributionStatus(userId, token);
        setRows(Array.isArray(data) ? data : []);
        setSelectedIds([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, token]);

  // search filter
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const name = String(r.ParticipantName || "").toLowerCase();
      const status = String(r.ContributionStatus || "").toLowerCase();
      const fund = String(r.ParticipantNumber || "").toLowerCase();
      return (
        name.includes(q) ||
        status.includes(q) ||
        fund.includes(q)
      );
    });
  }, [rows, search]);

  // Select all logic
  const isAllSelected = useMemo(
    () => filtered.length > 0 && selectedIds.length === filtered.length,
    [filtered.length, selectedIds.length]
  );

  const isIndeterminate = useMemo(
    () =>
      selectedIds.length > 0 &&
      selectedIds.length < filtered.length,
    [filtered.length, selectedIds.length]
  );

  // Bulk select handlers
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((row) => row.WWWContributionID));
    }
  }, [filtered, isAllSelected]);

  const handleRowSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // columns
  const columns = useMemo(
    () => [
      { key: "__select", label: "" },
      { key: "WWWContributionID", label: "Contribution ID" },
      { key: "ParticipantNumber", label: "Participant Number" },
      { key: "ParticipantName", label: "Participant Name" },
      { key: "CreatedDate", label: "Created Date" },
      { key: "TransactionAmount", label: "Amount" },
      { key: "ContributionStatus", label: "Status" },
      { key: "ContributionStatusDetails", label: "Status Details" },
    //   { key: "CreatedBy", label: "Created By" },
    //   { key: "ApprovedBy", label: "Approved By" },
    ],
    []
  );

  const alignMap = {
    TransactionAmount: "right",
    WWWContributionID: "center",
  };

  // BULK update status + status details
  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !token) return;
    if (!bulkStatus && !bulkStatusDetails) return;

    try {
      setLoading(true);

      await Promise.all(
        selectedIds.map((id) =>
          api.updateContributionStatus(
            id,
            {
              ...(bulkStatus && { ContributionStatus: bulkStatus }),
              ...(bulkStatusDetails && {
                ContributionStatusDetails: bulkStatusDetails,
              }),
            },
            token
          )
        )
      );

      const data = await api.fetchContributionStatus(userId, token);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error bulk updating contributions:", err);
    } finally {
      setLoading(false);
    }
  };

  // details slide panel handlers
  const openDetails = useCallback((row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setDetailsRow(null);
  }, []);

  // edit slide panel handlers
  const openEdit = useCallback((row) => {
    setEditRow(row);
    setEditStatus(row.ContributionStatus || "");
    setEditStatusDetails(row.ContributionStatusDetails || "");
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditRow(null);
    setEditStatus("");
    setEditStatusDetails("");
  }, []);

  const handleSaveEdit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editRow || !token) return;

      try {
        setLoading(true);
        await api.updateContributionStatus(
          editRow.WWWContributionID,
          {
            ContributionStatus: editStatus,
            ContributionStatusDetails: editStatusDetails,
          },
          token
        );
        const data = await api.fetchContributionStatus(userId, token);
        setRows(Array.isArray(data) ? data : []);
        closeEdit();
      } catch (err) {
        console.error("Error updating contribution:", err);
      } finally {
        setLoading(false);
      }
    },
    [editRow, editStatus, editStatusDetails, token, userId, closeEdit]
  );

  return (
    <div className="Contribution-Panel">
      <div className="Contribution-header">
        <h3>Contribution Status</h3>

        <div
          className="search-wrap"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <SearchBar
            placeholder="Search by participant ..."
            debounceMs={250}
            onChange={setSearch}
          />

          {selectedIds.length > 1 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{
                  padding: "8px 8px",
                  borderRadius: 8,
                  border: "1px solid #e0e2e4ff",
                }}
              >
                <option value="">Contribution Status</option>
                <option value="InProcess">InProcess</option>
                <option value="Posted">Posted</option>
                <option value="Reversed">Reversed</option>
              </select>

              <select
                value={bulkStatusDetails}
                onChange={(e) => setBulkStatusDetails(e.target.value)}
                style={{
                  padding: "8px 8px",
                  borderRadius: 8,
                  border: "1px solid #e0e2e4ff",
                }}
              >
                <option value="">Status Details</option>
                <option value="Cash Settled">Cash Settled</option>
                <option value="Cash Received">Cash Received</option>
              </select>

              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={loading || (!bulkStatus && !bulkStatusDetails)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#051a39",
                  color: "#fff",
                  fontWeight: 500,
                  cursor:
                    loading || (!bulkStatus && !bulkStatusDetails)
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="Contribution-body">
        {loading ? (
          <div className="loader-wrap">Loading contributions...</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filtered}
              alignMap={alignMap}
              showDetailsColumn={false}
              onDetails={undefined}
              renderRowActions={(row) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openDetails(row)}
                    className="details-btn"
                    title="View details"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="edit-btn"
                    title="Edit contribution"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              )}
              renderValue={(row, col) => {
                if (col.key === "__select") {
                  return (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.WWWContributionID)}
                      onChange={() =>
                        handleRowSelect(row.WWWContributionID)
                      }
                      style={{ transform: "scale(1.1)" }}
                    />
                  );
                }

                if (col.key === "TransactionAmount") {
                  return row.TransactionAmount != null
                    ? row.TransactionAmount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "-";
                }

                if (col.key === "CreatedDate" && row.CreatedDate) {
                  return row.CreatedDate.split("T")[0];
                }

                return row[col.key];
              }}
              renderHeader={(col) => {
                if (col.key === "__select") {
                  return (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      style={{
                        transform: "scale(1.2)",
                        marginRight: "8px",
                      }}
                    />
                  );
                }
                return col.label;
              }}
            />

            {!loading && filtered.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#475569",
                }}
              >
                No contribution rows found.
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Slide Panel */}
      <SlidePanel
        open={detailsOpen}
        onClose={closeDetails}
        title="Contribution Details"
        width="720px"
      >
        {detailsRow && (
          <DetailsContent
            row={{
              WWWContributionID: detailsRow.WWWContributionID,
              ParticipantNumber: detailsRow.ParticipantNumber,
              ParticipantName: detailsRow.ParticipantName,
             CreatedDate: detailsRow.CreatedDate,
             TransactionAmount: detailsRow.TransactionAmount,
              ContributionStatus: detailsRow.ContributionStatus,
              CreatedBy: detailsRow.CreatedBy,
              ApprovedBy: detailsRow.ApprovedBy,
            }}
            primaryFields={[
              "WWWContributionID",
              "ParticipantNumber",
              "ParticipantName",
            ]}
            remainingCols={[
            //   "CREATEDDATE",
              "TransactionAmount",
              "ContributionStatus",
              "CreatedBy",
              "ApprovedBy",
            ]}
          />
        )}
      </SlidePanel>

      {/* Edit Slide Panel – per-row update */}
      <SlidePanel
        open={editOpen}
        onClose={closeEdit}
        title="Edit Contribution"
        width="720px"
      >
        {editRow && (
          <form
            onSubmit={handleSaveEdit}
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div className="Sp-ContributionsUpdatestatus">
                <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 4,
                  color:"#374151",
                }}
              >
                Contribution Status
              </label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{
                  width: "320Px",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #e0e2e4ff",
                  fontSize:14,
                }}
              >
                <option value="">Select status</option>
                <option value="InProcess">InProcess</option>
                <option value="Posted">Checkreceived</option>
                <option value="Reversed">CheckCashed</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 4,
                  color:"#374151",
                }}
              >
                Status Details
              </label>
              <select
                value={editStatusDetails}
                onChange={(e) => setEditStatusDetails(e.target.value)}
                style={{
                  width: "320px",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #e0e2e4ff",
                  fontSize:14,
                }}
              >
                <option value="">InProcess</option>
                <option value="Cash Settled">CashSent</option>
                <option value="Cash Received">CashReconciled</option>
              </select>
            </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#051a39",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Updating..." : "Update"}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </SlidePanel>
    </div>
  );
}
