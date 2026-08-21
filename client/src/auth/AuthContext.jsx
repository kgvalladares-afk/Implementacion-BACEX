import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../apiConfig.js";
import { setAuthToken, setUnauthorizedHandler } from "../apiClient.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "bacex_session";

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  useEffect(() => {
    setAuthToken(session?.token || null);
  }, [session]);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (nombreUsuario, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreUsuario, password })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.Message || "No se pudo iniciar sesión");
    }
    const newSession = { token: data.Token, usuario: data.Usuario };
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  }, []);

  const hasPermission = useCallback((area, modulo) => {
    if (!session) return false;
    if (session.usuario.isAdmin) return true;
    return session.usuario.permisos.some((p) => p.area === area && p.modulo === modulo);
  }, [session]);

  return (
    <AuthContext.Provider value={{ usuario: session?.usuario || null, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
