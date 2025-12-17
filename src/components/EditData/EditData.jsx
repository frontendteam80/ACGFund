
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Table from "../Utilites/Table/Table.jsx";
import SlidePanel from "../Utilites/SlidePanel/SlidePanel.jsx";
import DetailsContent from "../Utilites/SlidePanel/DetailsContent.jsx";
import SearchBar from "../Utilites/SearchBar/SearchBar.jsx";
import Loader from "../Utilites/Loader/Loader.jsx";
import api from "../../AuthContext/Api.jsx";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import "./EditData.scss";

/* ---------- helper hook: stable API loader ---------- */
function useApiData(fetcher, deps = [], autoFetch = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoFetch && fetcher));
  const [error, setError] = useState(null);

  const load = useCallback(
    async (...args) => {
      if (!fetcher) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await fetcher(...args);
        setData(Array.isArray(resp) ? resp : resp ? [resp] : []);
      } catch (err) {
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    if (!fetcher || !autoFetch) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload: (...args) => load(...args) };
}

/* ---------------- mapping helpers ---------------- */
const mapParticipantRow = (apiRow) => {
  if (!apiRow) return { __raw: apiRow };
  return {
    ParticipantName: apiRow.ParticipantName ?? "-",
    FirstName: apiRow.FirstName ?? "-",
    MiddleName: apiRow.MiddleName ?? "-",
    LastName: apiRow.LastName ?? apiRow.Last ?? "-",
    ParticipantType: apiRow.ParticipantType ?? "-",
    ParticipantFinancialAdvisor: apiRow.ParticipantFinancialAdvisor ?? "-",
    IsActive: apiRow.IsActive ?? "-",
    OpenDate: apiRow.OpenDate ? String(apiRow.OpenDate).split("T")[0] : "-",
    EmailAddress: apiRow.EmailAddress ?? "-",
    PhoneNumber: apiRow.Phone ?? apiRow.PhoneNumber ?? "-",
    Address1: apiRow.Address1 ?? "-",
    Address2: apiRow.Address2 ?? "-",
    City: apiRow.City ?? "-",
    State: apiRow.State ?? "-",
    Postalcode: apiRow.Postalcode ?? apiRow.Zipcode ?? "-",
    Country: apiRow.Country ?? "-",
    ParticipantNumber:
      apiRow.ParticipantNumber ??
      apiRow.AccountNumber ??
      apiRow.ParticipantID ??
      "-",
    __raw: apiRow,
  };
};

const mapAdvisorRow = (apiRow) => {
  if (!apiRow) return { __raw: apiRow };
  return {
    AgentNumber: apiRow.AgentNumber ?? "-",
    AgentName: apiRow.AgentName ?? apiRow.Agent ?? "-",
    AgentType: apiRow.AgentType ?? "-",
    Agentcompany: apiRow.Agentcompany ?? apiRow.AgentCompany ?? "-",
    AgentRepCode: apiRow.AgentRepCode ?? "-",
    AgentStartDate: apiRow.AgentStartDate ?? "-",
    AgentNotes: apiRow.AgentNotes ?? "-",
    BTCAccountNumber: apiRow.BTCAccountNumber ?? "-",
    BTCAccountName: apiRow.BTCAccountName ?? "-",
    AccountNameShortform: apiRow.AccountNameShortform ?? "-",
    AgentBranchNumber: apiRow.AgentBranchNumber ?? "-",
    AgentOfficeManager: apiRow.AgentOfficeManager ?? "-",
    AgentOfficeManagerEmail: apiRow.AgentOfficeManagerEmail ?? "-",
    AgentOfficeManagerPhone: apiRow.AgentOfficeManagerPhone ?? "-",
    __raw: apiRow,
  };
};

/* Map Users from GetUsers (based on screenshot: FirstName, LastName, EmailAddress, etc.) */
const mapUserRow = (apiRow) => {
  if (!apiRow) return { __raw: apiRow };
  return {
    FirstName: apiRow.FirstName ?? "-",
    LastName: apiRow.LastName ?? "-",
    EmailAddress: apiRow.EmailAddress ?? "-",
    DateOfBirth: apiRow.DateOfBirth
      ? String(apiRow.DateOfBirth).split("T")[0]
      : "-",
    Address1: apiRow.Address1 ?? "-",
    Address2: apiRow.Address2 ?? "-",
    City: apiRow.City ?? "-",
    State: apiRow.State ?? "-",
    PostalCode: apiRow.PostalCode ?? apiRow.Postalcode ?? "-",
    Country: apiRow.Country ?? "-",
    PrimaryPhoneNumberType: apiRow.PrimaryPhoneNumberType ?? "-",
    HomePhone: apiRow.HomePhone ?? "-",
    CellPhone: apiRow.CellPhone ?? "-",
    WorkPhone: apiRow.WorkPhone ?? "-",
    Company: apiRow.Company ?? "-",
    UserID: apiRow.UserID ?? apiRow.UserId ?? apiRow.Id ?? "-",
    __raw: apiRow,
  };
};

function EditModalInline({ open, row, fields = [], onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!row) {
      setForm({});
      setError(null);
      return;
    }
    const base = row.__raw ? { ...row.__raw } : { ...row };
    const nextForm = {};
    fields.forEach((col) => {
      nextForm[col.key] = base[col.key] ?? row[col.key] ?? "";
    });
    setForm(nextForm);
    setError(null);
  }, [row, fields]);

  const handleChange = (key, value) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const chunkPairs = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 2) {
      out.push([arr[i], arr[i + 1] || null]);
    }
    return out;
  };

  const handleSave = async () => {
    setError(null);
    if (!row) return;
    const updatedRaw = row.__raw ? { ...row.__raw, ...form } : { ...(row || {}), ...form };

    if (row && row.__raw) {
      const raw = row.__raw;

      const participantKeys = [
        "ParticipantNumber",
        "ParticipantID",
        "AccountNumber",
        "ParticipantNo",
        "Participant_Id",
      ];
      for (const k of participantKeys) {
        if (raw[k] !== undefined && raw[k] !== null) updatedRaw[k] = raw[k];
      }

      const agentKeys = ["AgentNumber", "AgentNo", "AgentID"];
      for (const k of agentKeys) {
        if (raw[k] !== undefined && raw[k] !== null) updatedRaw[k] = raw[k];
      }

      const userKeys = ["UserID", "UserId", "Id"];
      for (const k of userKeys) {
        if (raw[k] !== undefined && raw[k] !== null) updatedRaw[k] = raw[k];
      }
    }

    setSaving(true);
    try {
      const maybe = onSave && onSave(updatedRaw);
      if (maybe && typeof maybe.then === "function") await maybe;
      onClose && onClose();
    } catch (err) {
      console.error("Edit save failed:", err);
      setError(err?.message ?? (err?.payload?.body?.message ?? String(err)));
    } finally {
      setSaving(false);
    }
  };

  const pairs = chunkPairs(fields);

  if (!open) return null;

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Edit"
      width="560px"
      closeOnOverlayClick={false}
      id="edit-slide-panel"
    >
      <div className="edit-panel-content" style={{ padding: 16 }}>
        <div className="ops-modal-body">
          {pairs.length === 0 && (
            <div className="ops-modal-row">
              <div className="ops-modal-row-label">Primary Key</div>
              <div className="ops-modal-row-value">-</div>
            </div>
          )}

          {pairs.map((pair, idx) => {
            const left = pair[0];
            const right = pair[1];

            const leftVal = left ? (form[left.key] ?? "") : "";
            const rightVal = right ? (form[right.key] ?? "") : "";

            const leftIsPrimary =
              left &&
              (left.key === "ParticipantNumber" ||
                left.key === "AgentNumber" ||
                left.key === "UserID");
            const rightIsPrimary =
              right &&
              (right.key === "ParticipantNumber" ||
                right.key === "AgentNumber" ||
                right.key === "UserID");

            return (
              <div
                className="ops-modal-grid-row"
                key={`pair-${idx}`}
                style={{ display: "flex", gap: 12, marginBottom: 12 }}
              >
                <div className="ops-modal-grid-item" style={{ flex: 1 }}>
                  {left ? (
                    <>
                      <label
                        className="ops-modal-item-label"
                        htmlFor={`edit-${left.key}`}
                      >
                        {left.label || left.key}
                      </label>
                      <input
                        id={`edit-${left.key}`}
                        type="text"
                        value={leftVal}
                        onChange={(e) =>
                          handleChange(left.key, e.target.value)
                        }
                        className={`ops-modal-input${
                          leftIsPrimary ? " ops-modal-input--readonly" : ""
                        }`}
                        readOnly={leftIsPrimary || left.readOnly}
                      />
                    </>
                  ) : (
                    <div style={{ visibility: "hidden" }}>empty</div>
                  )}
                </div>

                <div className="ops-modal-grid-item" style={{ flex: 1 }}>
                  {right ? (
                    <>
                      <label
                        className="ops-modal-item-label"
                        htmlFor={`edit-${right.key}`}
                      >
                        {right.label || right.key}
                      </label>
                      <input
                        id={`edit-${right.key}`}
                        type="text"
                        value={rightVal}
                        onChange={(e) =>
                          handleChange(right.key, e.target.value)
                        }
                        className={`ops-modal-input${
                          rightIsPrimary ? " ops-modal-input--readonly" : ""
                        }`}
                        readOnly={rightIsPrimary || right.readOnly}
                      />
                    </>
                  ) : (
                    <div style={{ visibility: "hidden" }}>empty</div>
                  )}
                </div>
              </div>
            );
          })}

          {error ? (
            <div
              className="ops-modal-error"
              style={{ color: "var(--danger, #c00)", marginBottom: 12 }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            type="button"
            className="ops-btn ops-btn-primary"
            onClick={handleSave}
            disabled={saving || !row}
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            onClick={() => {
              onClose && onClose();
            }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

/* ----------------- Stable constant ----------------- */
const ACTION_COL = { key: "__actions", label: "Actions" };

/* ----------------- Main component ----------------- */
export default function Editdata() {
  const { token, user } = useAuth();
  const userId = user?.id ?? user?.UserID ?? user?.userId ?? null;

  const [activeTab, setActiveTab] = useState("participant");

  const defaultParticipantColumns = useMemo(
    () => [
      { key: "ParticipantName", label: "Participant Name" },
      { key: "FirstName", label: "First Name" },
      { key: "ParticipantType", label: "Participant Type" },
      { key: "ParticipantFinancialAdvisor", label: "Financial Advisor" },
      { key: "IsActive", label: "Active" },
      { key: "OpenDate", label: "Open Date" },
      { key: "EmailAddress", label: "Email Address" },
      { key: "PhoneNumber", label: "Phone Number" },
      { key: "Address1", label: "Address 1" },
      { key: "Address2", label: "Address 2" },
      { key: "City", label: "City" },
      { key: "State", label: "State" },
      { key: "Postalcode", label: "Postal Code" },
      { key: "Country", label: "Country" },
    ],
    []
  );

  const defaultAdvisorColumns = useMemo(
    () => [
      { key: "AgentNumber", label: "Agent Number" },
      { key: "AgentName", label: "Agent Name" },
      { key: "AgentType", label: "Agent Type" },
      { key: "Agentcompany", label: "Agent Company" },
      { key: "AgentRepCode", label: "Rep Code" },
      { key: "AgentStartDate", label: "Start Date" },
      { key: "AgentNotes", label: "Notes" },
      { key: "BTCAccountNumber", label: "BTC Account Number" },
      { key: "BTCAccountName", label: "BTC Account Name" },
      { key: "AccountNameShortform", label: "Account Short Name" },
      { key: "AgentBranchNumber", label: "Branch Number" },
      { key: "AgentOfficeManager", label: "Office Manager" },
      { key: "AgentOfficeManagerEmail", label: "Manager Email" },
      { key: "AgentOfficeManagerPhone", label: "Manager Phone" },
    ],
    []
  );

  /* Default columns for Users tab */
  const defaultUserColumns = useMemo(
    () => [
      { key: "FirstName", label: "First Name" },
      { key: "LastName", label: "Last Name" },
      { key: "EmailAddress", label: "Email Address" },
      { key: "DateOfBirth", label: "DOB" },
      { key: "City", label: "City" },
      { key: "State", label: "State" },
      { key: "PostalCode", label: "Postal Code" },
      { key: "Country", label: "Country" },
      { key: "CellPhone", label: "Cell Phone" },
      { key: "HomePhone", label: "Home Phone" },
      { key: "Company", label: "Company" },
    ],
    []
  );

  const participantEditFields = useMemo(
    () => [
      { key: "ParticipantName", label: "Participant Name" },
      { key: "ParticipantType", label: "Participant Type" },
      { key: "ParticipantNumber", label: "Participant Number" },
      { key: "PhoneNumber", label: "Phone Number" },
      { key: "FirstName", label: "First Name" },
      { key: "LastName", label: "Last Name" },
      { key: "EmailAddress", label: "Email Address" },
      { key: "IsActive", label: "Active" },
      { key: "City", label: "City" },
      { key: "State", label: "State" },
      { key: "Postalcode", label: "Postal Code" },
      { key: "OpenDate", label: "Open Date", readOnly: true },
    ],
    []
  );

  const advisorEditFields = useMemo(
    () => [
      { key: "AgentName", label: "Agent Name" },
      { key: "AgentType", label: "Agent Type" },
      { key: "AgentNumber", label: "Agent Number" },
      { key: "Agentcompany", label: "Agent Company" },
      { key: "AgentRepCode", label: "Rep Code" },
      { key: "AgentOfficeManagerEmail", label: "Manager Email" },
      { key: "AgentBranchNumber", label: "Branch Number" },
      { key: "AgentOfficeManager", label: "Office Manager" },
      { key: "OpenDate", label: "Open Date", readOnly: true },
    ],
    []
  );

  /* Editable fields for Users tab */
  const userEditFields = useMemo(
    () => [
      { key: "UserID", label: "User ID", readOnly: true },
      { key: "FirstName", label: "First Name" },
      { key: "LastName", label: "Last Name" },
      { key: "EmailAddress", label: "Email Address" },
      { key: "DateOfBirth", label: "DOB" },
      { key: "Address1", label: "Address 1" },
      { key: "Address2", label: "Address 2" },
      { key: "City", label: "City" },
      { key: "State", label: "State" },
      { key: "PostalCode", label: "Postal Code" },
      { key: "Country", label: "Country" },
      { key: "PrimaryPhoneNumberType", label: "Primary Phone Type" },
      { key: "HomePhone", label: "Home Phone" },
      { key: "CellPhone", label: "Cell Phone" },
      { key: "WorkPhone", label: "Work Phone" },
      { key: "Company", label: "Company" },
    ],
    []
  );

  const participantFetcher = useCallback(async () => {
    return await api.fetchParticipants(userId, token);
  }, [userId, token]);

  const advisorFetcher = useCallback(async () => {
    return await api.fetchAdvisors(userId, token);
  }, [userId, token]);

  /* NEW: users fetcher using GetUsers RequestParamType */
  const usersFetcher = useCallback(async () => {
    if (!token) return [];
    const body = {
      RequestParamType: "GetUsers",
    };
    const resp = await api.postJson(
      "https://api-acgfund-dev.azurewebsites.net/v1/data/search",
      body,
      token
    );
    return resp.body;
  }, [token]);

  const {
    data: participantApiData,
    loading: loadingParticipants,
    error: participantError,
    reload: reloadParticipants,
    setData: setParticipantApiData,
  } = useApiData(participantFetcher, [participantFetcher]);

  const {
    data: advisorApiData,
    loading: loadingAdvisors,
    error: advisorError,
    reload: reloadAdvisors,
    setData: setAdvisorApiData,
  } = useApiData(advisorFetcher, [advisorFetcher]);

  const {
    data: usersApiData,
    loading: loadingUsers,
    error: usersError,
    reload: reloadUsers,
    setData: setUsersApiData,
  } = useApiData(usersFetcher, [usersFetcher]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [remainingCols, setRemainingCols] = useState([]);

  useEffect(() => {
    if (!userId || !token) return;

    setSelectedRow(null);
    setRemainingCols([]);
    setPanelOpen(false);

    if (activeTab === "participant") {
      setAdvisorApiData([]);
      setUsersApiData([]);
      reloadParticipants();
    } else if (activeTab === "advisor") {
      setParticipantApiData([]);
      setUsersApiData([]);
      reloadAdvisors();
    } else {
      // users
      setParticipantApiData([]);
      setAdvisorApiData([]);
      reloadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId, token]);

  const participants = useMemo(() => {
    if (!Array.isArray(participantApiData)) return [];
    return participantApiData.map((r) => mapParticipantRow(r));
  }, [participantApiData]);

  const advisors = useMemo(() => {
    if (!Array.isArray(advisorApiData)) return [];
    return advisorApiData.map((r) => mapAdvisorRow(r));
  }, [advisorApiData]);

  const users = useMemo(() => {
    if (!Array.isArray(usersApiData)) return [];
    return usersApiData.map((r) => mapUserRow(r));
  }, [usersApiData]);

  const autoColumns = useCallback((rows, fallback) => {
    if (!Array.isArray(rows) || rows.length === 0) return fallback.slice();
    const first = rows[0] || {};
    const detectedKeys = Object.keys(first).filter(
      (k) => k !== "__raw" && typeof first[k] !== "object"
    );
    return [
      ...fallback.filter((c) => detectedKeys.includes(c.key)),
      ...detectedKeys
        .filter((k) => !fallback.some((c) => c.key === k))
        .map((k) => ({
          key: k,
          label: k.replace(/([a-z])([A-Z])/g, "$1 $2"),
        })),
    ];
  }, []);

  const fullColumns = useMemo(() => {
    if (activeTab === "participant") {
      return autoColumns(participants, defaultParticipantColumns);
    }
    if (activeTab === "advisor") {
      return autoColumns(advisors, defaultAdvisorColumns);
    }
    return autoColumns(users, defaultUserColumns);
  }, [
    activeTab,
    participants,
    advisors,
    users,
    autoColumns,
    defaultParticipantColumns,
    defaultAdvisorColumns,
    defaultUserColumns,
  ]);

  const displayColumns = useMemo(() => {
    const cols = fullColumns.filter((c) => c.key !== ACTION_COL.key).slice();
    cols.push(ACTION_COL);
    return cols;
  }, [fullColumns]);

  const VISIBLE_COL_COUNT = 5;
  const [visibleCols, setVisibleCols] = useState([]);

  useEffect(() => {
    if (!Array.isArray(displayColumns) || displayColumns.length === 0) {
      setVisibleCols([]);
      return;
    }

    const pickVisible = () => {
      if (displayColumns.length <= VISIBLE_COL_COUNT)
        return displayColumns.slice();
      const maxMain = Math.max(0, VISIBLE_COL_COUNT - 1);
      const mainCols = displayColumns
        .filter((c) => c.key !== ACTION_COL.key)
        .slice(0, maxMain);
      const actionCol =
        displayColumns.find((c) => c.key === ACTION_COL.key) || ACTION_COL;
      const unique = [...mainCols];
      if (!unique.some((c) => c.key === actionCol.key)) unique.push(actionCol);
      return unique;
    };

    const next = pickVisible();
    setVisibleCols(next);
  }, [displayColumns]);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const openEdit = useCallback((row) => {
    setPanelOpen(false);
    setSelectedRow(null);
    setEditRow(row || null);
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditRow(null);
  }, []);

  /* ---------- handleSaveEdit for participants, advisors, users ---------- */
  const handleSaveEdit = useCallback(
    async (updated) => {
      if (!updated || typeof updated !== "object") {
        throw new Error("No updated data to save.");
      }

      const isParticipant = activeTab === "participant";
      const isAdvisor = activeTab === "advisor";
      const isUser = activeTab === "users";

      let processCode = "";
      if (isParticipant) processCode = "UpdateParticipants";
      else if (isAdvisor) processCode = "UpdateAdvisors";
      else processCode = "UpdateUsers";

      const requestParamType = processCode;

      const getPrimaryKey = (obj) => {
        if (isParticipant) {
          const val =
            obj.ParticipantNumber ??
            obj.ParticipantID ??
            obj.AccountNumber ??
            obj.ParticipantNo ??
            obj.Participant_Id ??
            null;
          const name =
            obj.ParticipantNumber !== undefined
              ? "ParticipantNumber"
              : obj.ParticipantID !== undefined
              ? "ParticipantID"
              : obj.AccountNumber !== undefined
              ? "AccountNumber"
              : null;
          return { name, value: val };
        }
        if (isAdvisor) {
          const val = obj.AgentNumber ?? obj.AgentNo ?? obj.AgentID ?? null;
          const name =
            obj.AgentNumber !== undefined
              ? "AgentNumber"
              : obj.AgentNo !== undefined
              ? "AgentNo"
              : obj.AgentID !== undefined
              ? "AgentID"
              : null;
          return { name, value: val };
        }
        const val = obj.UserID ?? obj.UserId ?? obj.Id ?? null;
        const name =
          obj.UserID !== undefined
            ? "UserID"
            : obj.UserId !== undefined
            ? "UserId"
            : obj.Id !== undefined
            ? "Id"
            : null;
        return { name, value: val };
      };

      const pk = getPrimaryKey(updated);

      if (
        !pk.name ||
        pk.value === null ||
        pk.value === undefined ||
        String(pk.value).trim() === ""
      ) {
        throw new Error(
          `Primary key missing. Ensure ${
            isParticipant
              ? "ParticipantNumber/ParticipantID/AccountNumber"
              : isAdvisor
              ? "AgentNumber"
              : "UserID"
          } is present.`
        );
      }

      const payload = {
        ProcessCode: processCode,
        RequestParamType: requestParamType,
        Data: updated,
      };

      try {
        const resp = await api.addData(payload, token);

        if (!resp || !resp.ok) {
          const msg =
            resp?.body?.message ||
            resp?.body?.Message ||
            resp?.body?.error ||
            `HTTP ${resp?.status}`;
          const err = new Error(msg || "Update failed");
          err.payload = resp;
          throw err;
        }

        if (isParticipant) {
          await reloadParticipants();
        } else if (isAdvisor) {
          await reloadAdvisors();
        } else {
          await reloadUsers();
        }
      } catch (err) {
        console.error("handleSaveEdit failed:", err);
        throw err;
      }
    },
    [activeTab, token, reloadParticipants, reloadAdvisors, reloadUsers]
  );

  const openDetails = useCallback(
    (rowFromTable) => {
      if (!rowFromTable) {
        setSelectedRow(null);
        setRemainingCols([]);
        setPanelOpen(false);
        return;
      }

      const raw = rowFromTable.__raw ?? rowFromTable;

      const mapped =
        activeTab === "participant"
          ? mapParticipantRow(raw)
          : activeTab === "advisor"
          ? mapAdvisorRow(raw)
          : mapUserRow(raw);

      setSelectedRow(mapped);
      setRemainingCols(
        fullColumns.slice(VISIBLE_COL_COUNT).map((c) => c.key)
      );
      setPanelOpen(true);
    },
    [activeTab, fullColumns]
  );

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedRow(null);
    setRemainingCols([]);
  }, []);

  const renderValue = useCallback(
    (row, col) => {
      const key = col.key;
      const v = row?.[key];

      if (key === ACTION_COL.key) {
        return (
          <button
            type="button"
            className="btn btn-small"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            Edit
          </button>
        );
      }

      if (v === null || v === undefined || v === "") return "-";
      return v;
    },
    [openEdit]
  );

  const participantSearchKeys = useMemo(
    () => [
      "ParticipantName",
      "ParticipantType",
      "ParticipantNumber",
      "FirstName",
      "LastName",
      "PhoneNumber",
      "EmailAddress",
    ],
    []
  );
  const advisorSearchKeys = useMemo(
    () => ["AgentNumber", "AgentName", "AgentType", "Agentcompany", "AgentRepCode"],
    []
  );
  const userSearchKeys = useMemo(
    () => [
      "FirstName",
      "LastName",
      "EmailAddress",
      "CellPhone",
      "HomePhone",
      "Company",
    ],
    []
  );

  const [searchQuery, setSearchQuery] = useState("");

  const data = useMemo(() => {
    if (activeTab === "participant") return participants;
    if (activeTab === "advisor") return advisors;
    return users;
  }, [activeTab, participants, advisors, users]);

  const filteredData = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return data;

    const keys =
      activeTab === "participant"
        ? participantSearchKeys
        : activeTab === "advisor"
        ? advisorSearchKeys
        : userSearchKeys;

    return data.filter((row) => {
      for (const k of keys) {
        const raw = row?.[k];
        if (raw && String(raw).toLowerCase().includes(q)) return true;
      }
      const rawObj = row?.__raw ?? {};
      for (const k of keys) {
        const nested = rawObj?.[k];
        if (nested && String(nested).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [
    searchQuery,
    data,
    activeTab,
    participantSearchKeys,
    advisorSearchKeys,
    userSearchKeys,
  ]);

  useEffect(() => {
    return () => {
      setPanelOpen(false);
      setEditOpen(false);
    };
  }, []);

  const isLoading =
    activeTab === "participant"
      ? loadingParticipants
      : activeTab === "advisor"
      ? loadingAdvisors
      : loadingUsers;

  const currentError =
    activeTab === "participant"
      ? participantError
      : activeTab === "advisor"
      ? advisorError
      : usersError;

  return (
    <div className="pa-screen">
      <div className="Operation-form">
        <header className="pa-header">
          <div className="pa-tabs">
            <button
              type="button"
              className={`pa-tab ${
                activeTab === "participant" ? "active" : ""
              }`}
              onClick={() => setActiveTab("participant")}
            >
              Participant
            </button>
            <button
              type="button"
              className={`pa-tab ${
                activeTab === "advisor" ? "active" : ""
              }`}
              onClick={() => setActiveTab("advisor")}
            >
              Advisor
            </button>
            <button
              type="button"
              className={`pa-tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          </div>

          <div
            className="pa-header-controls"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <SearchBar
              placeholder={
                activeTab === "participant"
                  ? "Search participant name, type, number…"
                  : activeTab === "advisor"
                  ? "Search agent name, type, number…"
                  : "Search user name, email, phone…"
              }
              debounceMs={250}
              onChange={(val) => setSearchQuery(String(val || "").trim())}
              onSearch={(val) => setSearchQuery(String(val || "").trim())}
            />
          </div>
        </header>

        <section className="pa-content">
          <div
            className="pa-table-area"
            style={{ minHeight: 220, position: "relative" }}
          >
            {isLoading ? (
              <div
                className="table-loader"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  padding: 24,
                }}
              >
                <Loader />
              </div>
            ) : currentError ? (
              <div className="error" style={{ padding: 16 }}>
                Error loading{" "}
                {activeTab === "participant"
                  ? "participants"
                  : activeTab === "advisor"
                  ? "advisors"
                  : "users"}
                : {String(currentError)}
              </div>
            ) : (
              <Table
                columns={visibleCols}
                data={filteredData}
                showDetailsColumn={true}
                onDetails={(row) => openDetails(row)}
                renderValue={renderValue}
              />
            )}
          </div>
        </section>

        <SlidePanel
          open={panelOpen}
          onClose={closePanel}
          title={`${
            activeTab === "participant"
              ? "Participant"
              : activeTab === "advisor"
              ? "Advisor"
              : "User"
          } Details`}
          width="640px"
          closeOnOverlayClick={true}
          id="operations-details-panel"
        >
          {!selectedRow ? (
            <div style={{ padding: 16 }}>No selection</div>
          ) : (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 8,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {selectedRow[fullColumns[0]?.key] ?? ""}
                </div>
                <button
                  type="button"
                  className="btn btn-small"
                  style={{ position: "relative", zIndex: 9999 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(selectedRow);
                  }}
                >
                  Edit
                </button>
              </div>

              <DetailsContent
                row={selectedRow}
                primaryFields={[
                  fullColumns[0]?.key || null,
                  fullColumns[1]?.key || null,
                ].filter(Boolean)}
                remainingCols={remainingCols}
              />
            </div>
          )}
        </SlidePanel>

        <EditModalInline
          open={editOpen}
          row={editRow}
          fields={
            activeTab === "participant"
              ? participantEditFields
              : activeTab === "advisor"
              ? advisorEditFields
              : userEditFields
          }
          onClose={closeEdit}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
}
