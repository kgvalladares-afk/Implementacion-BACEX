import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import PasswordField from "../components/PasswordField.jsx";

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !password) {
      setError("Ingrese usuario y contraseña");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(nombreUsuario.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #dce8f8 0%, #eef3fb 100%)", padding: "32px"
    }}>
      <div style={{
        position: "relative", display: "flex", width: "100%", maxWidth: "1100px",
        borderRadius: "28px", overflow: "hidden", boxShadow: "0 30px 80px rgba(15, 23, 42, 0.22)"
      }}>
        {/* Línea curva con brillo, sobre la división de los dos paneles */}
        <svg
          style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: "160px", transform: "translateX(-50%)", zIndex: 2, pointerEvents: "none" }}
          viewBox="0 0 160 1000"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="loginCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="loginCurveGlow" x="-100%" y="-20%" width="300%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 80 0 C 30 260, 130 500, 70 1000"
            fill="none"
            stroke="url(#loginCurveGrad)"
            strokeWidth="3"
            filter="url(#loginCurveGlow)"
          />
        </svg>

        {/* Panel de marca: la imagen ya trae logo, texto y módulos armados */}
        <div className="login-split-brand" style={{
          flex: "0 0 50%",
          backgroundColor: "#f4f7fb",
          backgroundImage: "url(/logo2.png)",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center"
        }} />

        {/* Panel del formulario, con tinte azul */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px",
          background: "linear-gradient(160deg, #eaf1fb 0%, #dbe8f9 100%)"
        }}>
          <div style={{
            width: "100%", maxWidth: "380px",
            background: "#fff", borderRadius: "22px",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.1)",
            padding: "40px 36px"
          }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
            <img src="/vesta-logo.png" alt="Vesta" style={{ height: "120px", objectFit: "contain" }} />
          </div>

          <h2 style={{
            textAlign: "center", fontSize: "27px", fontWeight: 300, color: "#0f172a", marginBottom: "4px",
            letterSpacing: "0.04em"
          }}>
            Iniciar Sesión
          </h2>
          <p style={{ textAlign: "center", color: "#697386", fontSize: "14px", marginBottom: "28px" }}>
            Mantenimientos
          </p>

          {error && <div className="login-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Usuario</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <UserIcon />
                </span>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  disabled={loading}
                  autoFocus
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>
            <div className="field">
              <label>Contraseña</label>
              <PasswordField
                withIcon
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #1e2a5e, #5b3fae)", border: "none"
              }}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
