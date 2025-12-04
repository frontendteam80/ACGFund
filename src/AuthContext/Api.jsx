
// // src/AuthContext/Api.jsx
// const BASE_SEARCH_URL = "https://api-acgfund-dev.azurewebsites.net/v1/data/search";
// const ADD_PARTICIPANT_URL = "https://api-acgfund-dev.azurewebsites.net/v1/data/add";


// export async function postJson(url, bodyObj, token) {
//   console.log("[API] Request:", { url, body: bodyObj, hasToken: !!token });

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//     body: JSON.stringify(bodyObj),
//   });

//   const text = await res.text();
//   console.log("[API] Response:", { status: res.status, ok: res.ok, bodyText: text });

//   let parsed = null;
//   try {
//     parsed = text ? JSON.parse(text) : {};
//   } catch (err) {
//     parsed = { raw: text };
//     console.warn("[API] response not JSON:", text);
//   }

//   const payload = { body: parsed, status: res.status, ok: res.ok };

//   if (!res.ok) {
//     // friendly message for 401
//     if (res.status === 401) {
//       payload.body = payload.body || {};
//       payload.body.message = payload.body.message || "Unauthorized - token missing or expired";
//     }
//     const err = new Error(`API request failed: ${res.status}`);
//     err.payload = payload;
//     throw err;
//   }

//   return payload;
// }

// /* ------------------------- Custom Reports ------------------------- */

// export async function fetchCustomReportsList(userId, token) {
//   if (!userId) return [];
//   const body = {
//     RequestParamType: "GetDashboardAdminCustomReportsList",
//     Filters: { UserID: userId },
//   };

//   try {
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     if (!parsed) return [];
//     if (Array.isArray(parsed)) return parsed;

    
//     const candidates = parsed.data || parsed.Data || parsed.Results || parsed.AdminCustomReports;
//     if (Array.isArray(candidates)) return candidates;

//     // fallback: first array-valued property
//     for (const key of Object.keys(parsed)) {
//       if (Array.isArray(parsed[key])) return parsed[key];
//     }
//     return [];
//   } catch (err) {
//     console.error("[fetchCustomReportsList] error:", err);
//     return [];
//   }
// }


// export async function fetchCustomReportData(userId, reportId, token, fromDate = null, toDate = null) {
//   if (!userId || !reportId) return [];
//   const filters = { UserID: userId, AdminCustomReportID: reportId };
//   if (fromDate) filters.BeginDate = fromDate;
//   if (toDate) filters.EndDate = toDate;

//   const body = {
//     RequestParamType: "GetDashboardAdminCustomReports",
//     Filters: filters,
//   };

//   try {
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     if (!parsed) return [];
//     if (Array.isArray(parsed)) return parsed;

//     const candidates = parsed.data || parsed.Data || parsed.Results || parsed.Rows || parsed.ReportRows;
//     if (Array.isArray(candidates)) return candidates;

//     for (const key of Object.keys(parsed)) {
//       if (Array.isArray(parsed[key])) return parsed[key];
//     }
//     return [];
//   } catch (err) {
//     console.error("[fetchCustomReportData] error:", err);
//     return [];
//   }
// }

// /* ------------------------- Process helpers ------------------------- */

// export async function fetchProcessParamTypes(token, userId) {
//   if (!userId) return [];
//   try {
//     const body = {
//       RequestParamType: "ProcessDataList",
//       Filters: { UserID: userId },
//     };
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     if (!parsed) return [];
//     if (Array.isArray(parsed)) return parsed;
//     if (Array.isArray(parsed.data)) return parsed.data;
//     if (Array.isArray(parsed.result)) return parsed.result;

//     for (const key of Object.keys(parsed)) {
//       if (Array.isArray(parsed[key])) return parsed[key];
//     }
//     return [];
//   } catch (err) {
//     console.error("[fetchProcessParamTypes] error:", err);
//     return [];
//   }
// }


// export async function fetchProcessData(paramId, requestParamType, token, userId, fromDate = null, toDate = null) {
//   if (!userId) {
//     return {
//       errorCode: null,
//       errorDescription: "",
//       status: null,
//       data: [],
//     };
//   }

//   const requestType = requestParamType || "ProcessData";
//   const body = {
//     RequestParamType: requestType,
//     Filters: { USERID: userId, UserID: userId },
//   };

//   // use ParamID only when provided
//   if (paramId !== undefined && paramId !== null && String(paramId).trim() !== "") {
//     body.Filters.ParamID = paramId;
//   }
//   if (fromDate) body.Filters.BeginDate = fromDate;
//   if (toDate) body.Filters.EndDate = toDate;

//   try {
//     console.log("[fetchProcessData] request body:", body);
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     console.log("[fetchProcessData] parsed body:", parsed);

//     // Case: API returns standard error object array
//     if (Array.isArray(parsed) && parsed.length && parsed[0].ErrorDescription !== undefined) {
//       const first = parsed[0];
//       return {
//         errorCode: first.ErrorCode ?? null,
//         errorDescription: first.ErrorDescription ?? "",
//         status: resp.status,
//         data: [],
//       };
//     }

//     // Extract rows from a variety of shapes
//     let rows = [];
//     if (Array.isArray(parsed)) {
//       rows = parsed;
//     } else if (Array.isArray(parsed?.data)) {
//       rows = parsed.data;
//     } else if (Array.isArray(parsed?.Results)) {
//       rows = parsed.Results;
//     } else if (parsed && typeof parsed === "object") {
//       for (const key of Object.keys(parsed)) {
//         if (Array.isArray(parsed[key])) {
//           rows = parsed[key];
//           break;
//         }
//       }
//     }

//     return {
//       errorCode: null,
//       errorDescription: "",
//       status: resp.status,
//       data: rows,
//     };
//   } catch (err) {
//     console.error("[fetchProcessData] error:", err);
//     // If the API threw an error with payload, try to extract message
//     const payload = err && err.payload ? err.payload : null;
//     let errDesc = "Unexpected API error";
//     if (payload && payload.body && payload.body.message) errDesc = payload.body.message;
//     return {
//       errorCode: 100,
//       errorDescription: errDesc,
//       status: payload ? payload.status : null,
//       data: [],
//     };
//   }
// }

// /* ------------------------- Financial Advisor helpers ------------------------- */

// export async function fetchAgentNames(userId, token) {
//   const body = {
//     RequestParamType: "GetAgentNames",
//     Filters: {},
//   };
//   if (userId) body.Filters.UserID = userId;

//   try {
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     if (!parsed) return [];

//     // Try multiple shapes: array, parsed.data, parsed.Results, etc.
//     let rows = [];
//     if (Array.isArray(parsed)) {
//       rows = parsed;
//     } else if (Array.isArray(parsed.data)) {
//       rows = parsed.data;
//     } else if (Array.isArray(parsed.Results)) {
//       rows = parsed.Results;
//     } else {
//       // pick first array-valued property as fallback
//       for (const k of Object.keys(parsed)) {
//         if (Array.isArray(parsed[k])) {
//           rows = parsed[k];
//           break;
//         }
//       }
//     }

//     if (!Array.isArray(rows)) return [];

//     // map to consistent react-select friendly shape; support various casings
//     return rows.map((r) => {
//       const id = r.AgentId ?? r.AgentID ?? r.agentId ?? r.Id ?? r.id ?? null;
//       const name =
//         r.FinancialAdvisor ??
//         r.FinancialAdvisorName ??
//         r.Financialadvisor ??
//         r.Name ??
//         r.name ??
//         (typeof r === "string" ? r : "");
//       return { value: id !== null && id !== undefined ? String(id) : null, label: String(name ?? "") };
//     });
//   } catch (err) {
//     console.error("[fetchAgentNames] error:", err);
//     return [];
//   }
// }


// export async function addAgent(agentObj, token) {
//   if (!agentObj || typeof agentObj !== "object") {
//     throw new Error("Invalid agent payload.");
//   }
//   if (!token) throw new Error("Authentication token is required.");

//   const body = {
//     RequestParamType: "AddAgent", // change if backend expects another string
//     Data: agentObj,
//   };

//   // Using BASE_SEARCH_URL by default; if you have a separate add-agent endpoint, change it here.
//   const resp = await postJson(BASE_SEARCH_URL, body, token);
//   return resp.body;
// }

// /* ------------------------- Add / other helpers ------------------------- */


// export async function addParticipant(participant, token) {
//   if (!participant || typeof participant !== "object") {
//     throw new Error("Invalid participant payload.");
//   }
//   if (!token) throw new Error("Authentication token is required.");

//   const body = {
//     RequestParamType: "AddParticipant",
//     Data: participant,
//   };

//   const resp = await postJson(ADD_PARTICIPANT_URL, body, token);
//   return resp.body;
// }

// /**
//  * addFundPrice
//  */
// // Replace your existing addFundPrice with this
// export async function addFundPrice(fundPricePayload, token) {
//   if (!fundPricePayload || typeof fundPricePayload !== "object") {
//     throw new Error("Invalid fund price payload.");
//   }
//   if (!token) throw new Error("Authentication token is required.");

//   const body = {
//     RequestParamType: "AddFundPrice",
//     ProcessMessage: "AddFundPrice",    // <<-- ADDED
//     Data: fundPricePayload,
//   };

//   const resp = await postJson(ADD_PARTICIPANT_URL, body, token);
//   return resp.body;
// }



// export async function fetchFunds(userId, token) {
//   if (!userId) return [];
//   const body = {
//     RequestParamType: "GetFundPriceDetails",
//     Filters: { UserID: userId },
//   };

//   try {
//     const resp = await postJson(BASE_SEARCH_URL, body, token);
//     const parsed = resp.body;
//     if (!parsed) return [];
//     if (Array.isArray(parsed)) return parsed;
//     const candidates = parsed.data || parsed.Data || parsed.Results || parsed.Funds || parsed.Rows;
//     if (Array.isArray(candidates)) return candidates;
//     for (const key of Object.keys(parsed)) {
//       if (Array.isArray(parsed[key])) return parsed[key];
//     }
//     return [];
//   } catch (err) {
//     console.error("[fetchFunds] error:", err);
//     return [];
//   }
// }

// /* ------------------------- Exports ------------------------- */

// const api = {
//   postJson,
//   fetchCustomReportsList,
//   fetchCustomReportData,
//   fetchProcessParamTypes,
//   fetchProcessData,
//   fetchAgentNames,
//   addAgent,       
//   addParticipant,
//   addFundPrice,
//   fetchFunds,
// };

// export default api;
// src/AuthContext/Api.jsx
const BASE_SEARCH_URL = "https://api-acgfund-dev.azurewebsites.net/v1/data/search";
const ADD_PARTICIPANT_URL = "https://api-acgfund-dev.azurewebsites.net/v1/data/add";

export async function postJson(url, bodyObj, token) {
  console.log("[API] Request:", { url, body: bodyObj, hasToken: !!token });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(bodyObj),
  });

  const text = await res.text();
  console.log("[API] Response:", { status: res.status, ok: res.ok, bodyText: text });

  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
    console.warn("[API] response not JSON:", text);
  }

  const payload = { body: parsed, status: res.status, ok: res.ok };

  if (!res.ok) {
    if (res.status === 401) {
      payload.body = payload.body || {};
      payload.body.message = payload.body.message || "Unauthorized - token missing or expired";
    }
    const err = new Error(`API request failed: ${res.status}`);
    err.payload = payload;
    throw err;
  }

  return payload;
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
    const parsed = resp.body;
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;

    const candidates =
      parsed.data || parsed.Data || parsed.Results || parsed.AdminCustomReports;
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
    const parsed = resp.body;
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;

    const candidates =
      parsed.data || parsed.Data || parsed.Results || parsed.Rows || parsed.ReportRows;
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

/* ------------------------- Process helpers ------------------------- */

export async function fetchProcessParamTypes(token, userId) {
  if (!userId) return [];
  try {
    const body = {
      RequestParamType: "ProcessDataList",
      Filters: { UserID: userId },
    };
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.data)) return parsed.data;
    if (Array.isArray(parsed.result)) return parsed.result;

    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
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
  const body = {
    RequestParamType: requestType,
    Filters: { USERID: userId, UserID: userId },
  };

  if (paramId !== undefined && paramId !== null && String(paramId).trim() !== "") {
    body.Filters.ParamID = paramId;
  }
  if (fromDate) body.Filters.BeginDate = fromDate;
  if (toDate) body.Filters.EndDate = toDate;

  try {
    console.log("[fetchProcessData] request body:", body);
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    console.log("[fetchProcessData] parsed body:", parsed);

    if (Array.isArray(parsed) && parsed.length && parsed[0].ErrorDescription !== undefined) {
      const first = parsed[0];
      return {
        errorCode: first.ErrorCode ?? null,
        errorDescription: first.ErrorDescription ?? "",
        status: resp.status,
        data: [],
      };
    }

    let rows = [];
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (Array.isArray(parsed?.data)) {
      rows = parsed.data;
    } else if (Array.isArray(parsed?.Results)) {
      rows = parsed.Results;
    } else if (parsed && typeof parsed === "object") {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          rows = parsed[key];
          break;
        }
      }
    }

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
    if (payload && payload.body && payload.body.message) errDesc = payload.body.message;
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
    Filters: {},
  };
  if (userId) body.Filters.UserID = userId;

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    if (!parsed) return [];

    let rows = [];
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (Array.isArray(parsed.data)) {
      rows = parsed.data;
    } else if (Array.isArray(parsed.Results)) {
      rows = parsed.Results;
    } else {
      for (const k of Object.keys(parsed)) {
        if (Array.isArray(parsed[k])) {
          rows = parsed[k];
          break;
        }
      }
    }

    if (!Array.isArray(rows)) return [];

    return rows.map((r) => {
      const id = r.AgentId ?? r.AgentID ?? r.agentId ?? r.Id ?? r.id ?? null;
      const name =
        r.FinancialAdvisor ??
        r.FinancialAdvisorName ??
        r.Financialadvisor ??
        r.Name ??
        r.name ??
        (typeof r === "string" ? r : "");
      return {
        value: id !== null && id !== undefined ? String(id) : null,
        label: String(name ?? ""),
      };
    });
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

/* ------------------------- Add / other helpers ------------------------- */

export async function addParticipant(participant, token) {
  if (!participant || typeof participant !== "object") {
    throw new Error("Invalid participant payload.");
  }
  if (!token) throw new Error("Authentication token is required.");

  const body = {
    RequestParamType: "AddParticipant",
    Data: participant,
  };

  const resp = await postJson(ADD_PARTICIPANT_URL, body, token);
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

  const resp = await postJson(ADD_PARTICIPANT_URL, body, token);
  return resp.body;
}

export async function fetchFunds(userId, token) {
  if (!userId) return [];
  const body = {
    RequestParamType: "GetFundPriceDetails",
    Filters: { UserID: userId },
  };

  try {
    const resp = await postJson(BASE_SEARCH_URL, body, token);
    const parsed = resp.body;
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;

    const candidates =
      parsed.data || parsed.Data || parsed.Results || parsed.Funds || parsed.Rows;
    if (Array.isArray(candidates)) return candidates;

    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
  } catch (err) {
    console.error("[fetchFunds] error:", err);
    return [];
  }
}

/* ------------------------- Exports ------------------------- */

const api = {
  postJson,
  fetchCustomReportsList,
  fetchCustomReportData,
  fetchProcessParamTypes,
  fetchProcessData,
  fetchAgentNames,
  addAgent,
  addParticipant,
  addFundPrice,
  fetchFunds,
};

export default api;
