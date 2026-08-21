import { useMemo, useState } from "react";
import "./App.css";
import { areas } from "./areas/index.js";
import { ToastProvider } from "./components/Toast.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Login from "./auth/Login.jsx";
import AdminUsuarios from "./auth/AdminUsuarios.jsx";

const ADMIN_KEY = "__admin__";

function AppShell() {
  const { usuario, logout, hasPermission } = useAuth();

  const visibleAreas = useMemo(() => {
    const result = {};
    for (const [areaKey, area] of Object.entries(areas)) {
      const visibleModules = Object.fromEntries(
        Object.entries(area.modules).filter(([moduloKey]) => hasPermission(areaKey, moduloKey))
      );
      if (Object.keys(visibleModules).length > 0) {
        result[areaKey] = { ...area, modules: visibleModules };
      }
    }
    return result;
  }, [hasPermission]);

  const areaKeys = Object.keys(visibleAreas);
  const [activeArea, setActiveArea] = useState(() => areaKeys[0] || null);
  const [activeModule, setActiveModule] = useState(null);

  const handleAreaChange = (areaKey) => {
    setActiveArea(areaKey);
    setActiveModule(null);
  };

  const isAdminScreen = activeArea === ADMIN_KEY;
  const currentAreaObj = !isAdminScreen && activeArea ? visibleAreas[activeArea] : null;
  const currentModules = currentAreaObj?.modules || {};
  const moduleKeys = Object.keys(currentModules);
  const mod = activeModule ? currentModules[activeModule] : null;
  const ActiveComponent = mod?.Component;

  return (
    <div className="app">
      <header className="topbar" style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", alignItems: "center", height: "70px" }}>
        <div className="topbar-left" style={{ display: "flex", alignItems: "center", paddingLeft: "20px" }}>
          <span className="mant-label" style={{ fontWeight: "bold" }}>⚙ Mantenimientos</span>
        </div>
        <div className="topbar-center" style={{ justifySelf: "center" }}>
          <span className="brand">Bac<span>-Ex</span></span>
        </div>
        <div className="topbar-right" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", paddingRight: "20px" }}>
          <span style={{ color: "#cbd5e1", fontSize: "13px" }}>{usuario.nombreCompleto}</span>
          <button className="btn ghost" onClick={logout} style={{ padding: "6px 14px", fontSize: "12px" }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="main">
        {/* SIDEBAR NAVEGACIÓN GLOBAL */}
        <aside className="sidebar">
          <div className="sidebar-label">Módulos</div>

          {visibleAreas.cfo && (
            <div className={`mod-item m-cfo${activeArea === "cfo" ? " active" : ""}`} onClick={() => handleAreaChange("cfo")}>
              <div className="mod-icon blue">📊</div>
              <div className="mod-name"><strong>CFO</strong><span>Finanzas</span></div>
            </div>
          )}

          {visibleAreas.red && (
            <div className={`mod-item m-red${activeArea === "red" ? " active" : ""}`} onClick={() => handleAreaChange("red")}>
              <div className="mod-icon green">🔗</div>
              <div className="mod-name"><strong>Análisis de Red</strong><span>Conectividad</span></div>
            </div>
          )}

          {visibleAreas.errores25 && (
            <div className={`mod-item m-err${activeArea === "errores25" ? " active" : ""}`} onClick={() => handleAreaChange("errores25")}>
              <div className="mod-icon red">⚠️</div>
              <div className="mod-name">
                <strong>Errores <span className="badge">25+</span></strong>
                <span>Seguimiento</span>
              </div>
            </div>
          )}

          {usuario.isAdmin && (
            <div className={`mod-item${isAdminScreen ? " active" : ""}`} onClick={() => handleAreaChange(ADMIN_KEY)}>
              <div className="mod-icon amber">👤</div>
              <div className="mod-name"><strong>Administración</strong><span>Usuarios y permisos</span></div>
            </div>
          )}
        </aside>

        <main className="content" style={{ position: "relative" }}>
          {isAdminScreen ? (
            <div className="panel" style={{ position: "relative" }}>
              <AdminUsuarios />
            </div>
          ) : !currentAreaObj ? (
            <div className="panel" style={{ position: "relative" }}>
              <div className="panel-header">
                <h1>Sin módulos asignados</h1>
                <p>Todavía no tienes acceso a ningún módulo. Pídele a un administrador que te asigne permisos.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Breadcrumbs e Historial de navegación dinámico */}
              {activeModule && (
                <div className="subnav">
                  <button className="back-btn" onClick={() => setActiveModule(null)}>← Volver</button>
                  <div className="breadcrumb">{currentAreaObj.label} › <span>{mod.label}</span></div>
                </div>
              )}

              {/* Sub pestañas horizontales basadas en el Área Activa */}
              {activeModule && (
                <div className="sub-tabs">
                  {moduleKeys.map((k) => (
                    <button
                      key={k}
                      className={`sub-tab${k === activeModule ? " active" : ""}`}
                      onClick={() => setActiveModule(k)}
                    >
                      {currentModules[k].label}
                    </button>
                  ))}
                </div>
              )}

              <div className="panel" style={{ position: "relative" }}>
                {/* Watermark */}
                <div style={{
                  position: "absolute", bottom: "15px", right: "25px", zIndex: 0, opacity: 0.15,
                  pointerEvents: "none", userSelect: "none", width: "160px", height: "160px",
                  display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                  <img src="/vesta-logo.png" alt="Vesta Watermark" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "darken" }} />
                </div>

                {!activeModule ? (
                  /* PANEL DE CONTROL DE LA CATEGORÍA SELECCIONADA */
                  <>
                    <div className="panel-header" style={{ position: "relative", zIndex: 1 }}>
                      <h1>Panel de Control: {currentAreaObj.label}</h1>
                      <p>Selecciona una de las herramientas de gestión disponibles</p>
                    </div>

                    <div className="home-grid" style={{ position: "relative", zIndex: 1 }}>
                      {moduleKeys.map((k) => {
                        const m = currentModules[k];
                        return (
                          <div key={k} className={`home-card${m.kind === "danger" ? " danger" : ""}`} onClick={() => setActiveModule(k)}>
                            <div className={`card-icon${m.kind === "danger" ? " red" : ""}`}>{m.icon}</div>
                            <h4>{m.label}</h4>
                            <p>{m.desc}</p>
                            <div className="card-arr">→</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <ActiveComponent />
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function AuthGate() {
  const { usuario } = useAuth();
  return usuario ? <AppShell /> : <Login />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
