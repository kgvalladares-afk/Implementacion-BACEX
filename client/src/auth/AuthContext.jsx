import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../apiConfig.js";
import { apiFetch, setAuthToken, setUnauthorizedHandler } from "../apiClient.js";

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

  // Refresca los permisos/estado del usuario contra la BD al cargar la app,
  // para que cambios hechos por un administrador se vean sin tener que reloguearse.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch("/auth/me");
        if (!response.ok || cancelled) return;
        const data = await response.json().catch(() => null);
        if (!data || cancelled) return;
        setSession((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, usuario: { ...prev.usuario, ...data } };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      } catch {
        // Si falla, se sigue usando la sesión en caché sin interrumpir al usuario.
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
