const BASE_URL = "https://api-acgfund-dev.azurewebsites.net/v1/data/search";

async function postJson(bodyObj, token) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(bodyObj),
  });

  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.warn("[API] response not JSON:", text);
    return { raw: text, status: res.status };
  }
}

// Fetch list of custom reports
export async function fetchCustomReportsList(userId, token) {
  if (!userId) return [];
  const body = {
    RequestParamType: "GetDashboardAdminCustomReportsList",
    Filters: { UserID: userId },
  };
  try {
    const parsed = await postJson(body, token);
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;
    const candidates =
      parsed.data ||
      parsed.Data ||
      parsed.Results ||
      parsed.AdminCustomReports;
    if (Array.isArray(candidates)) return candidates;
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
  } catch (err) {
    console.error("[fetchCustomReportsList] error:", err);
    return [];
  }
}

// Fetch report data
export async function fetchCustomReportData(userId, reportId, token, fromDate = null, toDate = null) {
  if (!userId || !reportId) return [];
  const filters = { UserID: userId, AdminCustomReportID: reportId };
  if (fromDate) filters.BeginDate = fromDate;
  if (toDate) filters.EndDate = toDate;
  const body = {
    RequestParamType: "GetDashboardAdminCustomReports",
    Filters: filters,
  };
  try {
    const parsed = await postJson(body, token);
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;
    const candidates =
      parsed.data ||
      parsed.Data ||
      parsed.Results ||
      parsed.Rows ||
      parsed.ReportRows;
    if (Array.isArray(candidates)) return candidates;
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
  } catch (err) {
    console.error("[fetchCustomReportData] error:", err);
    return [];
  }
}

export async function addParticipant(participant, token) {
  if (!participant || typeof participant !== "object") {
    return { error: true, message: "Invalid participant payload." };
  }

  const body = {
    RequestParamType: "AddParticipant",
    ...participant
  };

  try {
    const parsed = await postJson(body, token);
    // Some backends return { Success: true, Data: {...} } or { error: false, message: 'OK' }
    return parsed;
  } catch (err) {
    console.error("[addParticipant] error:", err);
    return { error: true, message: "Failed to add participant (network error)." };
  }
}

export default {
  fetchCustomReportsList,
  fetchCustomReportData,
  addParticipant
};

export async function fetchProcessParamTypes(token, userId,paramType) {
  try {
    const body = {
      RequestParamType: 'ProcessProcedures',
      Filters: { UserID: userId, ParamType: 'DropDown' },
     
    };
    const res = await fetch('https://api-acgfund-dev.azurewebsites.net/v1/data/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const raw = await res.text();
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : [];
    } catch (e) {
      parsed = raw;
    }
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.data)) return parsed.data;
    if (Array.isArray(parsed?.result)) return parsed.result;
    return [];
  } catch (err) {
    console.error('[API] fetchProcessParamTypes error:', err);
    return [];
  }
}

 // Now use selected paramType when fetching process data:
export async function fetchProcessData(paramType, token, userId) {
  try {
    const body = {
      RequestParamType: 'ProcessProcedures',
      Filters: { UserID: userId, ParamType: paramType }
    };
    const res = await fetch('https://api-acgfund-dev.azurewebsites.net/v1/data/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const raw = await res.text();
    let parsed;
    try { parsed = raw ? JSON.parse(raw) : []; } catch (e) { parsed = raw; }
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.data)) return parsed.data;
    if (Array.isArray(parsed?.result)) return parsed.result;
    return [];
  } catch (err) {
    console.error('[API] fetchProcessData error:', err);
    return [];
  }
}

