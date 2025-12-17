
// api.jsx

const BASE_URL = "https://api-acgfund-dev.azurewebsites.net/v1";
const BASE_SEARCH_URL = `${BASE_URL}/data/search`;
const DATA_ADD_URL = `${BASE_URL}/data/add`;
const SIGNUP_URL = `${BASE_URL}/users/signup`;
const UPDATE_PASSWORD_URL = `${BASE_URL}/users/password`;

/* ------------------------- Core helpers ------------------------- */

async function doFetch(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
    console.warn("[API] response not JSON:", text);
  }

  const result = { body: parsed, status: res.status, ok: res.ok };

  if (!res.ok) {
    if (res.status === 401) {
      result.body = result.body || {};
      result.body.message =
        result.body.message || "Unauthorized - token missing or expired";
    }
    const err = new Error(`API request failed: ${res.status}`);
    err.payload = result;
    throw err;
  }

  return result;
}

// generic JSON POST (used everywhere)
export async function postJson(url, bodyObj, token) {
  console.log("[API] Request:", { url, body: bodyObj, hasToken: !!token });

  const result = await doFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(bodyObj),
  });

  console.log("[API] Response:", {
    status: result.status,
    ok: result.ok,
    body: result.body,
  });

  return result;
}

// PUT JSON (only for password update)
async function putJson(url, bodyObj, token) {
  console.log("[API] PUT Request:", { url, body: bodyObj, hasToken: !!token });

  const result = await doFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(bodyObj),
  });

  console.log("[API] PUT Response:", {
    status: result.status,
    ok: result.ok,
    body: result.body,
  });

  return result;
}

// Extract first array-like property from a response body, with optional priority keys
function extractArray(parsed, preferredKeys = []) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;

  for (const key of preferredKeys) {
    if (Array.isArray(parsed?.[key])) return parsed[key];
  }

  if (parsed && typeof parsed === "object") {
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
  }

  return [];
}

/* ------------------------- Custom Reports ------------------------- */

export async function fetchCustomReportsList(userId, token) {
  if (!userId) return [];

  const body = {
    RequestParamType: "GetDashboardAdminCustomReportsList",
    Filters: { UserID: userId },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    return extractArray(resp.body, ["data", "Data", "Results", "AdminCustomReports"]);
  } catch (err) {
    console.error("[fetchCustomReportsList] error:", err);
    return [];
  }
}

export async function fetchCustomReportData(
  userId,
  reportId,
  token,
  fromDate = null,
  toDate = null
) {
  if (!userId || !reportId) return [];

  const filters = { UserID: userId, AdminCustomReportID: reportId };
  if (fromDate) filters.BeginDate = fromDate;
  if (toDate) filters.EndDate = toDate;

  const body = {
    RequestParamType: "GetDashboardAdminCustomReports",
    Filters: filters,
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    return extractArray(resp.body, ["data", "Data", "Results", "Rows", "ReportRows"]);
  } catch (err) {
    console.error("[fetchCustomReportData] error:", err);
    return [];
  }
}

/* ------------------------- Process helpers ------------------------- */

export async function fetchProcessParamTypes(token, userId) {
  if (!userId) return [];

  const body = {
    RequestParamType: "ProcessDataList",
    Filters: { UserID: userId },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    return extractArray(resp.body, ["data", "result"]);
  } catch (err) {
    console.error("[fetchProcessParamTypes] error:", err);
    return [];
  }
}

export async function fetchProcessData(
  paramId,
  requestParamType,
  token,
  userId,
  fromDate = null,
  toDate = null
) {
  if (!userId) {
    return {
      errorCode: null,
      errorDescription: "",
      status: null,
      data: [],
    };
  }

  const requestType = requestParamType || "ProcessData";
  const filters = { USERID: userId, UserID: userId };

  if (paramId !== undefined && paramId !== null && String(paramId).trim() !== "") {
    filters.ParamID = paramId;
  }
  if (fromDate) filters.BeginDate = fromDate;
  if (toDate) filters.EndDate = toDate;

  const body = {
    RequestParamType: requestType,
    Filters: filters,
  };

  try {
    console.log("[fetchProcessData] request body:", body);
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    console.log("[fetchProcessData] parsed body:", parsed);

    // API sometimes returns error as an array with ErrorDescription on first row
    if (
      Array.isArray(parsed) &&
      parsed.length &&
      parsed[0].ErrorDescription !== undefined
    ) {
      const first = parsed[0];
      return {
        errorCode: first.ErrorCode ?? null,
        errorDescription: first.ErrorDescription ?? "",
        status: resp.status,
        data: [],
      };
    }

    const rows = extractArray(parsed);
    return {
      errorCode: null,
      errorDescription: "",
      status: resp.status,
      data: rows,
    };
  } catch (err) {
    console.error("[fetchProcessData] error:", err);
    const payload = err && err.payload ? err.payload : null;
    let errDesc = "Unexpected API error";
    if (payload?.body?.message) errDesc = payload.body.message;
    return {
      errorCode: 100,
      errorDescription: errDesc,
      status: payload ? payload.status : null,
      data: [],
    };
  }
}

/* ------------------------- Financial Advisor helpers ------------------------- */

export async function fetchAgentNames(userId, token) {
  const body = {
    RequestParamType: "GetAgentNames",
    Filters: userId ? { UserID: userId } : {},
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const rows = extractArray(resp.body, ["data", "Results"]);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error("[fetchAgentNames] error:", err);
    return [];
  }
}

export async function addAgent(agentObj, token) {
  if (!agentObj || typeof agentObj !== "object") {
    throw new Error("Invalid agent payload.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "AddAgent",
    Data: agentObj,
  };

  const resp = await postJson(BASE_SEARCH_URL, body, token);
  return resp.body;
}

/* ------------------------- Add / signup helpers ------------------------- */

export async function addParticipant(participant, token) {
  if (!participant || typeof participant !== "object") {
    throw new Error("Invalid participant payload.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "AddParticipant",
    Data: participant,
  };

  const resp = await postJson(DATA_ADD_URL, body, token);
  return resp.body;
}

export async function signupUser(bodyObj, token = null) {
  if (!bodyObj || typeof bodyObj !== "object") {
    throw new Error("Invalid signup payload.");
  }
  const resp = await postJson(SIGNUP_URL, bodyObj, token);
  return resp.body;
}

export async function addUserDetails(userPayload, token, role = "donor") {
  if (!userPayload || typeof userPayload !== "object") {
    throw new Error("Invalid user payload.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const roleLower = (role || "").toString().toLowerCase();
  let requestParamType = "ADDUserDetails";
  if (roleLower === "advisor") requestParamType = "AddAgents";
      

  const body = {
    RequestParamType: requestParamType,
    "@RequestParamType": requestParamType,
    Data: userPayload,
  };

  const resp = await postJson(DATA_ADD_URL, body, token);
  return resp.body;
}

export async function addFundPrice(fundPricePayload, token) {
  if (!fundPricePayload || typeof fundPricePayload !== "object") {
    throw new Error("Invalid fund price payload.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "AddFundPrice",
    ProcessMessage: "AddFundPrice",
    Data: fundPricePayload,
  };

  const resp = await postJson(DATA_ADD_URL, body, token);
  return resp.body;
}

/* ------------------------- Funds & Dashboard helpers ------------------------- */

export async function fetchFunds(userId, token) {
  if (!userId) return [];

  const body = {
    RequestParamType: "GetFundPriceDetails",
    Filters: { UserID: userId },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    return extractArray(resp.body, ["data", "Data", "Results", "Funds", "Rows"]);
  } catch (err) {
    console.error("[fetchFunds] error:", err);
    return [];
  }
}

/* ------------------------- Participant helper ------------------------- */

export async function fetchUserParticipantDetails(userId = null, token) {
  const body = {
    RequestParamType: "GetDashboardUserParticipantDetails",
    Filters: { UserID: userId },
  };

  console.log("[fetchUserParticipantDetails] request body:", body, "tokenPresent:", !!token);
  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    console.log("[fetchUserParticipantDetails] response parsed:", parsed);
    return extractArray(parsed, ["data", "Results", "Rows"]);
  } catch (err) {
    console.error("[fetchUserParticipantDetails] error:", err);
    return [];
  }
}

/* ------------------------- Participants & Advisors list ------------------------- */

async function fetchList(requestParamType, userId, token) {
  const body = {
    RequestParamType: requestParamType,
    Filters: userId ? { UserID: userId } : {},
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    return extractArray(resp.body, ["data", "Results", "Rows"]);
  } catch (err) {
    console.error(`[${requestParamType}] error:`, err);
    return [];
  }
}

export function fetchParticipants(userId = null, token) {
  return fetchList("GetParticipants", userId, token);
}

export function fetchAdvisors(userId = null, token) {
  return fetchList("GetAdvisors", userId, token);
}

/* ------------------------- Generic addData for updates ------------------------- */

export async function addData(payload, token = null) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload for addData.");
  }

  console.log("[API] addData request:", { payload, hasToken: !!token });
  const resp = await postJson(DATA_ADD_URL, payload, token);
  console.log("[API] addData parsed response:", resp.body);
  return resp;
}

/* ------------------------- Password update ------------------------- */

export async function updateUserPassword(payload, token = null) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload for updateUserPassword.");
  }

  console.log("[API] updateUserPassword request:", {
    payload: { Email: payload.Email },
    hasToken: !!token,
  });

  const resp = await putJson(UPDATE_PASSWORD_URL, payload, token);
  console.log("[API] updateUserPassword parsed response:", resp.body);
  return resp;
}

/*--------------------------GrantStatus---------------------------------*/
export async function fetchGrantStatus(userId, token) {
  const body = {
    RequestParamType: "GrantStatus",
    Filters: {
      UserID: userId,   // ✅ REQUIRED
    },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);

    console.log("[fetchGrantStatus] response:", resp.body);

    // backend returns array directly
    if (Array.isArray(resp.body)) {
      return resp.body;
    }

    // fallback safety
    return [];
  } catch (err) {
    console.error("[fetchGrantStatus] error:", err);
    return [];
  }
}

/*--------------------------Grant Status Update---------------------------------*/
export async function updateGrantStatus(wwwGrantId, updateFields, token) {
  if (!wwwGrantId) throw new Error("WWWGrantID is required for updateGrantStatus");
  if (!updateFields || typeof updateFields !== "object") {
    throw new Error("updateFields must be an object.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "UpdateGrantStatus",
    Data: {
      WWWGrantID: wwwGrantId,
      ...updateFields, // e.g. { GrantStatus, GrantStatusDetails }
    },
  };

  const resp = await postJson(DATA_ADD_URL, body, token);
  return resp.body;
}

/*--------------------------ContributionStatus---------------------------------*/
export async function fetchContributionStatus(userId, token) {
  const body = {
    RequestParamType: "ContributionStatus",
    Filters: {
      UserID: userId,
    },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    console.log("[fetchContributionStatus] response:", resp.body);

    if (Array.isArray(resp.body)) {
      return resp.body;
    }

    return [];
  } catch (err) {
    console.error("[fetchContributionStatus] error:", err);
    return [];
  }
}

/*--------------------------Contribution Status Update---------------------------------*/
export async function updateContributionStatus(wwwContributionId, updateFields, token) {
  if (!wwwContributionId) {
    throw new Error("WWWContributionID is required for updateContributionStatus");
  }
  if (!updateFields || typeof updateFields !== "object") {
    throw new Error("updateFields must be an object.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "UpdateContributionStatus", 
    Data: {
      WWWContributionID: wwwContributionId,
      ...updateFields, // e.g. { ContributionStatus, ContributionStatusDetails }
    },
  };

  const resp = await postJson(DATA_ADD_URL, body, token);
  return resp.body;
}

/*--------------------------Email Existance-------------------*/

export async function checkEmailExists(email, token = null) {
  if (!email) return false;

  const url = `${BASE_URL}/users?PageNumber=1&PageSize=100`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to check email existence");
  }

  const data = await res.json();
  const users = extractArray(data, ["data", "Results"]);

  const lower = email.trim().toLowerCase();
  return users.some(
    (u) =>
      (u.EmailAddress || u.Email || "")
        .toString()
        .toLowerCase() === lower
  );
}
/* ------------------------- Exports ------------------------- */

const api = {
  postJson,
  fetchCustomReportsList,
  fetchCustomReportData,
  fetchProcessParamTypes,
  fetchProcessData,
  fetchAgentNames,
  fetchParticipants,
  fetchGrantStatus,
  fetchContributionStatus, 
  fetchAdvisors,
  addAgent,
  addParticipant,
  addFundPrice,
  fetchFunds,
  fetchUserParticipantDetails,
  signupUser,
  addUserDetails,
  addData,
  updateUserPassword,
  checkEmailExists,
  updateGrantStatus,
  updateContributionStatus, 
};

export default api;
