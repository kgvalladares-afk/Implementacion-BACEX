import { API_BASE_URL } from "./apiConfig.js";

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Wrapper de fetch que agrega el token de sesión y la URL base automáticamente.
// path debe empezar con "/", ej: apiFetch("/habilitarDocumento", {...})
export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    onUnauthorized?.();
  }
  return response;
}
