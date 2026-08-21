import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 24px", borderRadius: "8px", color: "#fff",
          backgroundColor: toast.type === "warn" ? "#d97706" : "#059669",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontWeight: "500", fontSize: "14px"
        }}>
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return showToast;
}
