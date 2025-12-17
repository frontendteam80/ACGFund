
// src/components/FundPrice/FundPrice.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../../AuthContext/AuthContext.jsx";
import { fetchFunds, addFundPrice } from "../../AuthContext/Api.jsx";
import Table from "../Utilites/Table/Table.jsx";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import "../CustomReports/CustomReports.css";
import "./FundPrice.scss";

/* ---------------------- helpers ---------------------- */

function getLatestPerFund(rows) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const id = row.FundID;
    if (!id) return;
    const currentDate = row.LastFundPriceDate
      ? new Date(String(row.LastFundPriceDate).split("T")[0])
      : null;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, row);
      return;
    }
    const existingDate = existing.LastFundPriceDate
      ? new Date(String(existing.LastFundPriceDate).split("T")[0])
      : null;
    if (!existingDate || (currentDate && currentDate > existingDate)) {
      map.set(id, row);
    }
  });
  return Array.from(map.values());
}

function formatMoney(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateOnly(iso) {
  if (!iso) return "";
  const datePart = String(iso).split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  return `${m}-${d}-${y}`;
}

function isoDateStringFromDate(d) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateFromIso(iso) {
  if (!iso) return null;
  return new Date(String(iso));
}

/* ------------------- Component ------------------- */

export default function FundPrice() {
  const { user } = useAuth();
  const userId = user?.id || user?.UserID;

  const token =
    user?.token ??
    user?.accessToken ??
    user?.authToken ??
    localStorage.getItem("authToken") ??
    null;

  const rawRole =
    (user &&
      (user.role ||
        user.Role ||
        user.normalizedRole ||
        user.normalized_role ||
        user.userRole)) ||
    "";
  const roleLower = String(rawRole).toLowerCase().trim();

  const allowedRoles = new Set([
    "admin",
    "administrator",
    "advisor",
    "adviser",
    "operational",
    "operations",
    "operation",
    "op",
  ]);
  const isAuthorized = allowedRoles.has(roleLower);

  const [funds, setFunds] = useState([]);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [activeOption, setActiveOption] = useState("");
  const [marketValueInput, setMarketValueInput] = useState("");
  const [fundPriceInput, setFundPriceInput] = useState("");
  const marketRef = useRef(null);
  const fundRef = useRef(null);
  const [nextPriceDate, setNextPriceDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pending, setPending] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // load funds
  useEffect(() => {
    if (!isAuthorized) {
      setFunds([]);
      setLoading(false);
      return;
    }
    if (!userId || !token) return;

    let aborted = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const rows = await fetchFunds(userId, token, {
          signal: controller.signal,
          timeoutMs: 15000,
        });
        if (aborted) return;
        const latest = getLatestPerFund(rows || []).map((row) => {
          const lastRaw =
            row.LastFundPrice ??
            row.LastPrice ??
            row.LastFundPriceRaw ??
            "";
          const marketRaw = row.MarketValue ?? row.MarketValueRaw ?? "";
          const nextRawIso = row.NextFundPriceDate
            ? String(row.NextFundPriceDate).split("T")[0]
            : "";
          const nextRawDate = nextRawIso ? new Date(nextRawIso) : null;
          const lastRawIso = row.LastFundPriceDate
            ? String(row.LastFundPriceDate).split("T")[0]
            : "";
          return {
            ...row,
            LastFundPriceDateIso: lastRawIso,
            LastFundPriceDate: formatDateOnly(lastRawIso),
            NextFundPriceDateIso: nextRawIso,
            NextFundPriceDate: formatDateOnly(nextRawIso),
            NextFundPriceDateObj: nextRawDate,
            LastFundPriceRaw: lastRaw,
            LastFundPriceFormatted:
              lastRaw !== "" ? formatMoney(lastRaw) : "",
            MarketValueRaw: marketRaw,
            MarketValueFormatted:
              marketRaw !== "" ? formatMoney(marketRaw) : "",
          };
        });
        setFunds(latest);
      } catch (e) {
        if (!(e && e.payload && e.payload.aborted)) {
          if (!aborted) setErrorMessage("Failed to load funds.");
          console.error(e);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [userId, token, isAuthorized]);

  const fundOptions = useMemo(
    () =>
      funds.map((f) => ({
        value: f.FundID,
        label: `${f.Fund ?? ""} - ${f.FundName ?? ""}`.trim(),
        data: f,
      })),
    [funds]
  );

  const selectedFund = useMemo(
    () =>
      funds.find((f) => String(f.FundID) === String(selectedFundId)) || null,
    [funds, selectedFundId]
  );

  useEffect(() => {
    if (selectedFund && selectedFund.NextFundPriceDateObj) {
      setNextPriceDate(new Date(selectedFund.NextFundPriceDateObj));
    } else {
      setNextPriceDate(null);
    }
    setMarketValueInput("");
    setFundPriceInput("");
    setActiveOption(selectedFund ? "market" : "");
  }, [selectedFundId, selectedFund]);

  const filteredFunds = useMemo(() => {
    if (!searchTerm.trim()) return funds;
    const term = searchTerm.toLowerCase();
    return funds.filter((r) =>
      [
        "Fund",
        "FundName",
        "LastFundPriceDate",
        "NextFundPriceDate",
        "MarketValueFormatted",
        "LastFundPriceFormatted",
      ].some((c) => String(r[c] ?? "").toLowerCase().includes(term))
    );
  }, [funds, searchTerm]);

  const activateOption = (opt) => {
    setActiveOption(opt);
    setTimeout(() => {
      if (opt === "market") marketRef.current?.focus?.();
      if (opt === "fund") fundRef.current?.focus?.();
    }, 0);
  };

  const handleAddClick = () => {
    setErrorMessage("");
    if (!selectedFundId) {
      setErrorMessage("Select a fund.");
      return;
    }
    if (!activeOption) {
      setErrorMessage("Select Market Value or Fund Price.");
      return;
    }
    const activeValue =
      activeOption === "market" ? marketValueInput : fundPriceInput;
    if (activeValue === "" || activeValue == null) {
      setErrorMessage("Enter the selected value.");
      return;
    }

    const nextISO = nextPriceDate
      ? isoDateStringFromDate(nextPriceDate)
      : selectedFund?.NextFundPriceDateIso || "";

    const lastIso = selectedFund?.LastFundPriceDateIso || "";
    if (nextISO && lastIso) {
      const dNext = dateFromIso(nextISO);
      const dLast = dateFromIso(lastIso);
      if (dNext && dLast) {
        dNext.setHours(0, 0, 0, 0);
        dLast.setHours(0, 0, 0, 0);
        if (dNext < dLast) {
          setErrorMessage(
            `Next Price Date cannot be earlier than Last Price Date (${formatDateOnly(
              lastIso
            )}).`
          );
          return;
        }
      }
    }

    setPending({
      FundID: selectedFundId,
      FundName:
        selectedFund?.FundName ||
        selectedFund?.Fund ||
        `Fund ${selectedFundId}`,
      ValueType: activeOption === "market" ? "Market Value" : "Fund Price",
      Value: Number(activeValue),
      NextFundPriceDateIso: nextISO,
    });

    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!pending || !selectedFund) return;

    setErrorMessage("");
    setSuccessMessage("");
    setSaving(true);

    const lastPriceDateIso = selectedFund.LastFundPriceDateIso || "";
    const nextPriceDateIso = pending.NextFundPriceDateIso || "";

    const payload = {
      FundID: Number(pending.FundID),
      FundName:
        selectedFund.FundName ||
        selectedFund.Fund ||
        pending.FundName,
      LastFundPriceDate: lastPriceDateIso,
      NextFundPriceDate: nextPriceDateIso,
      FundPriceType:
        pending.ValueType === "Market Value" ? "MarketValue" : "FundPrice",
      MarketValue:
        pending.ValueType === "Market Value" ? Number(pending.Value) : 0,
      FundValue:
        pending.ValueType === "Fund Price" ? Number(pending.Value) : 0,
      LastFundPrice:
        selectedFund.LastFundPriceRaw !== undefined &&
        selectedFund.LastFundPriceRaw !== ""
          ? Number(selectedFund.LastFundPriceRaw)
          : 0,
      UserID: userId,
    };

    try {
      const result = await addFundPrice(payload, token);
      console.log("[FundPrice] addFundPrice payload:", payload);
      console.log("[FundPrice] addFundPrice result:", result);

      if (result?.ProcessCode && result.ProcessCode !== 0) {
        setErrorMessage(
          result.processMessage ||
            result.ProcessMessage ||
            `Save failed (code ${result.ProcessCode}).`
        );
        return;
      }

      const successMsg =
        result?.processMessage ||
        result?.ProcessMessage ||
        "Saved successfully.";
      setSuccessMessage(successMsg);

      const newRow = {
        FundID: pending.FundID,
        Fund: selectedFund.Fund ?? pending.FundID,
        FundName:
          selectedFund.FundName ||
          selectedFund.Fund ||
          pending.FundName,
        LastFundPriceDateIso: lastPriceDateIso,
        LastFundPriceDate: formatDateOnly(lastPriceDateIso),
        NextFundPriceDateIso: nextPriceDateIso,
        NextFundPriceDate: nextPriceDateIso
          ? formatDateOnly(nextPriceDateIso)
          : "",
        NextFundPriceDateObj: nextPriceDateIso
          ? dateFromIso(nextPriceDateIso)
          : null,
      };

      if (pending.ValueType === "Market Value") {
        newRow.MarketValue = Number(pending.Value);
        newRow.MarketValueFormatted = formatMoney(Number(pending.Value));
      } else {
        newRow.FundValue = Number(pending.Value);
        newRow.FundValueFormatted = formatMoney(Number(pending.Value));
      }

      if (
        selectedFund.LastFundPriceRaw !== undefined &&
        selectedFund.LastFundPriceRaw !== ""
      ) {
        newRow.LastFundPrice = Number(selectedFund.LastFundPriceRaw);
        newRow.LastFundPriceFormatted = formatMoney(
          Number(selectedFund.LastFundPriceRaw)
        );
      }

      setFunds((prev) => {
        const map = new Map(prev.map((r) => [String(r.FundID), r]));
        map.set(String(newRow.FundID), newRow);
        return Array.from(map.values());
      });

      setShowModal(false);
      setPending(null);
      setActiveOption("");
      setMarketValueInput("");
      setFundPriceInput("");
      setNextPriceDate(null);
      setSelectedFundId("");

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("[handleConfirm] save failed:", err);
      let errorMsg = "Failed to save fund price.";
      if (err.payload?.body?.message) errorMsg = err.payload.body.message;
      else if (err.message) errorMsg = err.message;
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setShowModal(false);
  };

  const handleReset = () => {
    setSelectedFundId("");
    setActiveOption("");
    setMarketValueInput("");
    setFundPriceInput("");
    setNextPriceDate(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const renderNextPriceDateCell = (row) => {
    return (
      <div style={{ position: "relative", width: 140 }}>
        <DatePicker
          selected={
            row.NextFundPriceDateObj
              ? new Date(row.NextFundPriceDateObj)
              : row.NextFundPriceDateIso
              ? dateFromIso(row.NextFundPriceDateIso)
              : null
          }
          onChange={(date) => {
            const iso = date ? isoDateStringFromDate(date) : "";
            setFunds((prev) =>
              prev.map((r) =>
                String(r.FundID) === String(row.FundID)
                  ? {
                      ...r,
                      NextFundPriceDateIso: iso,
                      NextFundPriceDate: iso ? formatDateOnly(iso) : "",
                      NextFundPriceDateObj: date || null,
                    }
                  : r
              )
            );
            if (String(row.FundID) === String(selectedFundId)) {
              setNextPriceDate(date || null);
            }
          }}
          dateFormat="MM-dd-yyyy"
          className="fundprice-input"
          placeholderText="Next Price Date"
          isClearable
          minDate={
            row.LastFundPriceDateIso ? dateFromIso(row.LastFundPriceDateIso) : null
          }
        />
        <Calendar
          size={16}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#6b7280",
          }}
        />
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <main className="maincontent-container">
        <div
          className="maincontent-card"
          style={{ padding: 20, textAlign: "center" }}
        >
          <h2>Access denied</h2>
          <p>
            You do not have permission to view or edit fund prices. If you
            believe this is an error, contact your administrator.
          </p>
          <div style={{ marginTop: 8, color: "#555" }}>
            <small>
              Detected role: <strong>{rawRole || "unknown"}</strong>
            </small>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="maincontent-container">
      <div className="fundprice-wrapper">
        {/* LEFT: form */}
        <form
          className="fundprice-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddClick();
          }}
        >
          <div className="fundprice-messages">
            {errorMessage && (
              <div style={{ color: "crimson", marginTop: 8 }}>{errorMessage}</div>
            )}
            {successMessage && (
              <div style={{ color: "green", marginTop: 8 }}>{successMessage}</div>
            )}
          </div>

          {/* Select Fund */}
          <div className="fundprice-form-field">
            <label className="fundprice-label" style={{ paddingLeft: 0 }}>
              Select Fund
            </label>
            <span className="fundprice-colon">:</span>
            <div className="fundprice-select" style={{ paddingLeft: 0 }}>
              <Select
                options={fundOptions}
                value={
                  fundOptions.find(
                    (o) => String(o.value) === String(selectedFundId)
                  ) || null
                }
                onChange={(opt) => {
                  setSelectedFundId(opt ? opt.value : "");
                }}
                isClearable
                isSearchable
                placeholder="Select Fund - FundName"
                classNamePrefix="react-select"
                isDisabled={loading || fundOptions.length === 0}
                styles={{
                  dropdownIndicator: (base) => ({ ...base, padding: 0 }),
                  clearIndicator: (base) => ({ ...base, padding: 0 }),
                  indicatorsContainer: (base) => ({ ...base, padding: 0 }),
                }}
              />
            </div>
          </div>

          {/* Last Price Date + Last Fund Price */}
          {selectedFund && (
            <div className="fundprice-form-field">
              <div className="LastPrice-row">
                <div className="LastPriceDate">
                  <label className="fundprice-label">Last Price Date</label>
                  <span className="fundprice-colon">:</span>
                  <div
                    className="fundprice-label-value"
                    style={{ paddingLeft: "10px" }}
                  >
                    {selectedFund.LastFundPriceDate || ""}
                  </div>
                </div>
                <div className="LastPrice">
                  <label className="fundprice-label">Last Fund Price</label>
                  <span className="fundprice-colon">:</span>
                  <div className="fundprice-label-value">
                    {formatMoney(selectedFund.LastFundPriceRaw)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Price Date + Type Value */}
          {selectedFund && (
            <div className="fundprice-form-field">
              <div className="NextPrice-row">
                <div className="Next-Price">
                  <label className="fundprice-label">Next Price Date</label>
                  <span className="fundprice-colon">:</span>
                  <div style={{ width: 200, position: "relative" }}>
                    <DatePicker
                      selected={nextPriceDate}
                      onChange={(date) => setNextPriceDate(date)}
                      dateFormat="MM-dd-yyyy"
                      className="fundprice-input"
                      placeholderText="Next Price date"
                      isClearable
                      minDate={
                        selectedFund?.LastFundPriceDateIso
                          ? dateFromIso(selectedFund.LastFundPriceDateIso)
                          : null
                      }
                    />
                    <Calendar
                      size={18}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "45%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#6b7280",
                      }}
                    />
                  </div>
                </div>
                <div className="ValueType">
                  <label className="fundprice-label">Value Type</label>
                  <span className="fundprice-colon" style={{ gap: 0 }}>
                    :
                  </span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        gap: 5,
                      }}
                    >
                      <input
                        type="radio"
                        name="valueOption"
                        checked={activeOption === "market"}
                        onChange={() => activateOption("market")}
                      />
                      <span style={{ fontSize: 13 }}>Market Value</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        gap: 5,
                      }}
                    >
                      <input
                        type="radio"
                        name="valueOption"
                        checked={activeOption === "fund"}
                        onChange={() => activateOption("fund")}
                      />
                      <span style={{ fontSize: 13 }}>Fund Price</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input for selected value type */}
          {selectedFund && activeOption && (
            <div className="fundprice-form-field">
              <label className="fundprice-label">
                {activeOption === "market" ? "Market Value" : "Fund Price"}
              </label>
              <span className="fundprice-colon">:</span>
              <input
                ref={activeOption === "market" ? marketRef : fundRef}
                type="number"
                className="fundprice-input usd-input"
                placeholder={
                  activeOption === "market" ? " Market Value" : " Fund Price"
                }
                value={
                  activeOption === "market" ? marketValueInput : fundPriceInput
                }
                onChange={(e) => {
                  if (activeOption === "market") {
                    setMarketValueInput(e.target.value);
                  } else {
                    setFundPriceInput(e.target.value);
                  }
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="fundprice-form-actions">
            <button
              type="submit"
              className="maincontent-btn maincontent-primary"
            >
              Submit
            </button>
            <button
              type="button"
              className="maincontent-btn maincontent-reset"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        {/* Modal */}
        {showModal && pending && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Confirm update
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <div style={{ minWidth: 140, fontWeight: 600 }}>Fund</div>
                <div>{pending.FundName}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <div style={{ minWidth: 140, fontWeight: 600 }}>Value Type</div>
                <div>{pending.ValueType}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <div style={{ minWidth: 140, fontWeight: 600 }}>Value</div>
                <div>{formatMoney(pending.Value)}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ minWidth: 140, fontWeight: 600 }}>
                  Next Price Date
                </div>
                <div>
                  {pending.NextFundPriceDateIso
                    ? formatDateOnly(pending.NextFundPriceDateIso)
                    : "—"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="maincontent-btn maincontent-primary"
                  onClick={handleConfirm}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>

                <button
                  className="maincontent-btn maincontent-secondary"
                  onClick={handleEdit}
                  disabled={saving}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="maincontent-card">
        <div
          className="maincontent-title-row"
          style={{ marginBottom: "10px" }}
        >
          <div style={{ fontWeight: 700 }}>Fund Prices</div>
          <div style={{ marginLeft: "auto" }}>
            <input
              className="maincontent-search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search funds"
            />
          </div>
        </div>

        <div>
          <Table
            columns={[
              "FundID",
              "Fund",
              "FundName",
              "LastFundPriceDate",
              "NextFundPriceDate",
              "LastFundPrice",
              "MarketValue",
              "Cusip",
            ]}
            data={filteredFunds}
            showDetailsColumn={false}
            renderCell={(columnKey, row) => {
              if (columnKey === "NextFundPriceDate") {
                return renderNextPriceDateCell(row);
              }
              return null;
            }}
          />
        </div>
      </div>
    </main>
  );
}
