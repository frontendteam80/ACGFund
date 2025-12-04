
// src/AuthContext/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const USER_STORAGE_KEY = "myapp_user";
const TOKEN_KEYS_TO_PERSIST = ["acg_token", "authToken", "token", "access_token"];

function normalizeAndMapRole(userObj) {
  if (!userObj) return "";
  const read = (o, p) => {
    try {
      return p.split(".").reduce((s, k) => s?.[k], o);
    } catch (e) {
      return undefined;
    }
  };
  const candidates = [
    read(userObj, "role"),
    read(userObj, "roleName"),
    read(userObj, "data.role"),
    read(userObj, "raw.role"),
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  const rolesArr = userObj.roles ?? userObj.Roles ?? read(userObj, "data.roles");
  if (Array.isArray(rolesArr) && rolesArr.length > 0) {
    const r = rolesArr[0]?.name ?? rolesArr[0]?.role ?? rolesArr[0];
    if (r) candidates.push(String(r).trim().toLowerCase());
  }

  let normalized = candidates[0] || "";
  try {
    const s = JSON.stringify(userObj).toLowerCase();
    if (!normalized && s.includes("admin")) normalized = "admin";
    if (!normalized && (s.includes("op") || s.includes("operation"))) normalized = "ops";
    if (!normalized && (s.includes("advisor") || s.includes("advis"))) normalized = "advisor";
  } catch (e) {}
  normalized = (normalized || "").toLowerCase();
  if (!normalized) return "";
  if (["admin", "administrator", "acg admin"].includes(normalized)) return "admin";
  if (["ops", "opp", "operation", "operations", "opps"].includes(normalized)) return "ops";
  if (["advisor", "adviser", "advisors", "Advisor"].includes(normalized)) return "advisor";
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("op") || normalized.includes("oper")) return "ops";
  if (normalized.includes("advisor") || normalized.includes("advis")) return "advisor";
  return normalized;
}

function readTokenFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  // check many common variants
  return (
    payload.BearerToken ||
    payload.bearerToken ||
    payload.access_token ||
    payload.accessToken ||
    payload.token ||
    payload.authToken ||
    payload.AuthToken ||
    payload.idToken ||
    null
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && !parsed.normalizedRole) parsed.normalizedRole = normalizeAndMapRole(parsed);
      return parsed;
    } catch (e) {
      return null;
    }
  });

  // keep a separate token state for quick access via useAuth().token
  const [token, setToken] = useState(() => {
    try {
      return (
        localStorage.getItem("acg_token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        null
      );
    } catch {
      return null;
    }
  });

  // Persist user (with normalizedRole) to localStorage
  useEffect(() => {
    try {
      if (user) {
        const toStore = { ...user, normalizedRole: user.normalizedRole ?? normalizeAndMapRole(user) };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toStore));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("AuthProvider: failed to persist user", e);
    }
  }, [user]);

  // Persist token to localStorage under common keys so other parts read it
  useEffect(() => {
    try {
      if (token) {
        for (const k of TOKEN_KEYS_TO_PERSIST) {
          localStorage.setItem(k, token);
        }
      } else {
        for (const k of TOKEN_KEYS_TO_PERSIST) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn("AuthProvider: failed to persist token", e);
    }
  }, [token]);

  // login accepts a full user/payload object (whatever your backend returns)
  const login = (userInfo) => {
    if (!userInfo || typeof userInfo !== "object") {
      setUser(null);
      setToken(null);
      return;
    }

    // Extract token from a variety of possible fields
    const extractedToken = readTokenFromPayload(userInfo);

    // Also check nested shapes commonly returned by some APIs
    const possibleNested = userInfo.data ?? userInfo.result ?? userInfo.body ?? userInfo.raw ?? null;
    const extractedNested = readTokenFromPayload(possibleNested);

    const finalToken = extractedToken || extractedNested || null;

    // Extract id from several possible keys
    const id =
      userInfo.id ||
      userInfo.UserID ||
      userInfo.userId ||
      userInfo.UserId ||
      (userInfo.data && (userInfo.data.id || userInfo.data.userId)) ||
      (userInfo.raw && (userInfo.raw.id || userInfo.raw.userId)) ||
      null;

    // Build user object — ensure `.token` field exists for compatibility
    const base = { ...userInfo, token: finalToken, id };
    const normalizedRole = normalizeAndMapRole(base);
    const out = { ...base, normalizedRole };

    setUser(out);
    setToken(finalToken);

    // (Optional) return the user + token
    return { user: out, token: finalToken };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
