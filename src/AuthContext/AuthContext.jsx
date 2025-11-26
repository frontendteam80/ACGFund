// src/AuthContext/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'myapp_user';

function normalizeAndMapRole(userObj) {
  if (!userObj) return '';
  const read = (o, p) => { try { return p.split('.').reduce((s,k)=>s?.[k], o); } catch(e){return undefined;} };
  const candidates = [
    read(userObj,'role'),
    read(userObj,'roleName'),
    read(userObj,'data.role'),
    read(userObj,'raw.role')
  ]
    .filter(Boolean)
    .map(v => String(v).trim().toLowerCase());

  const rolesArr = userObj.roles ?? userObj.Roles ?? read(userObj,'data.roles');
  if (Array.isArray(rolesArr) && rolesArr.length > 0) {
    const r = rolesArr[0]?.name ?? rolesArr[0]?.role ?? rolesArr[0];
    if (r) candidates.push(String(r).trim().toLowerCase());
  }

  let normalized = candidates[0] || '';
  try {
    const s = JSON.stringify(userObj).toLowerCase();
    if (!normalized && s.includes('admin')) normalized = 'admin';
    if (!normalized && (s.includes('op') || s.includes('operation'))) normalized = 'ops';
    if (!normalized && (s.includes('advisor') || s.includes('advis'))) normalized = 'advisor';
  } catch(e){}
  normalized = (normalized||'').toLowerCase();
  if (!normalized) return '';
  if (['admin','administrator','acg admin'].includes(normalized)) return 'admin';
  if (['ops','opp','operation','operations','opps'].includes(normalized)) return 'ops';
  if (['advisor','adviser','advisors','Advisor'].includes(normalized)) return 'advisor';
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('op') || normalized.includes('oper')) return 'ops';
  if (normalized.includes('advisor') || normalized.includes('advis')) return 'advisor';
  return normalized;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && !parsed.normalizedRole) parsed.normalizedRole = normalizeAndMapRole(parsed);
      return parsed;
    } catch(e) { return null; }
  });

  useEffect(() => {
    if (user) {
      const toStore = { ...user, normalizedRole: user.normalizedRole ?? normalizeAndMapRole(user) };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const login = (userInfo) => {
    if (!userInfo || typeof userInfo !== 'object') { setUser(null); return; }

    // --- KEY UPDATE SECTION ---
    const token = userInfo.BearerToken || null;
    console.log(token);

    const id =
      userInfo.id ||
      userInfo.UserID ||   // Handles UserID key
      userInfo.userId ||
      userInfo.UserId ||
      (userInfo.data && (userInfo.data.id || userInfo.data.userId)) ||
      (userInfo.raw && (userInfo.raw.id || userInfo.raw.userId)) ||
      null;
    // --------------------------

    const base = { ...userInfo, token, id };
    const normalizedRole = normalizeAndMapRole(base);
    const out = { ...base, normalizedRole };

    setUser(out);
  };

  const logout = () => setUser(null);
  //  window.location.href ='/login';

   return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
