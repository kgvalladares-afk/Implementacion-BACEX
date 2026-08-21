import { useState } from "react";

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.9 18.9 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.9 18.9 0 0 1-3.22 4.44M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function PasswordField({ value, onChange, disabled, autoFocus, placeholder, withIcon = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {withIcon && (
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
          <LockIcon />
        </span>
      )}
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        style={{ paddingRight: "44px", paddingLeft: withIcon ? "42px" : undefined }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
          position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#697386",
          display: "flex", alignItems: "center", padding: "4px"
        }}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
