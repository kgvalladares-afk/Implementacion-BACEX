import { useState } from "react";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch } from "../../apiClient.js";
import SolicitudesAsociadas, { meta as solicitudesMeta } from "./matriz/SolicitudesAsociadas.jsx";
import JsonSolicitud, { meta as jsonSolicitudMeta } from "./matriz/JsonSolicitud.jsx";
import EvaluarMatriz, { meta as evaluarMatrizMeta } from "./matriz/EvaluarMatriz.jsx";

export const meta = {
  label: "Matriz de Acción",
  icon: "🧮",
  desc: "Herramientas de gestión sobre la matriz de acción",
  kind: "primary",
};

export default function Matriz() {
  const [gestion, setGestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [referenciasOperativas, setReferenciasOperativas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [tipoSolicitudId, setTipoSolicitudId] = useState("");
  const showToast = useToast();

  const fetchSolicitudes = async (valorGestion, { resetSeleccion = true } = {}) => {
    try {
      const response = await apiFetch(`/solicitudesAsociadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestion: valorGestion })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al buscar`, "warn");
        setReferenciasOperativas([]);
        setSolicitudes([]);
        setSearched(true);
        return;
      }
      setReferenciasOperativas(Array.isArray(data?.referenciasOperativas) ? data.referenciasOperativas : []);
      setSolicitudes(Array.isArray(data?.solicitudes) ? data.solicitudes : []);
      if (resetSeleccion) setTipoSolicitudId("");
      setSearched(true);
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
      setReferenciasOperativas([]);
      setSolicitudes([]);
      setSearched(true);
    }
  };

  const handleBuscar = async () => {
    if (!gestion.trim()) {
      showToast("Ingrese una Gestión para buscar", "warn");
      return;
    }
    setLoading(true);
    try {
      await fetchSolicitudes(gestion.trim());
    } finally {
      setLoading(false);
    }
  };

  // Después de reiniciar/reevaluar una solicitud en "Evaluar Matriz", se refresca
  // "Solicitudes Asociadas" con los mismos filtros para reflejar el nuevo estado,
  // sin perder la selección de Tipo de Solicitud que se estaba evaluando.
  const handleSolicitudEvaluada = async () => {
    if (!gestion.trim()) return;
    await fetchSolicitudes(gestion.trim(), { resetSeleccion: false });
  };

  const handleClear = () => {
    setGestion("");
    setReferenciasOperativas([]);
    setSolicitudes([]);
    setTipoSolicitudId("");
    setSearched(false);
  };

  const renderCuadro = (c) => (
    <div className="cuadro-box" style={c.full ? { gridColumn: "1 / -1" } : undefined} key={c.key}>
      <div className="cuadro-box-header">
        <div className="cuadro-box-icon">{c.icon}</div>
        <div>
          <div className="cuadro-box-title">{c.label}</div>
          <div className="cuadro-box-desc">{c.desc}</div>
        </div>
      </div>
      <c.Component loading={loading} searched={searched} {...c.extraProps} />
    </div>
  );

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px", marginBottom: "14px" }}>
        <div className="form-title" style={{ fontSize: "19px", fontWeight: "700", color: "#1a1f36" }}>{meta.label}</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "2px", fontSize: "12px" }}>{meta.desc}</div>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#f8f9fa", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "16px" }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#4f5b66", whiteSpace: "nowrap", paddingLeft: "4px" }}>
          🔍 Gestión / Hoja de Ruta
        </span>
        <input
          type="text"
          placeholder="Ej: UH-UH-H26-126"
          title="Puede ingresar el número de Gestión o de Hoja de Ruta / Referencia Operativa"
          value={gestion}
          onChange={(e) => setGestion(e.target.value)}
          style={{ width: "220px", padding: "7px 10px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px" }}
          disabled={loading}
        />
        <button className="btn primary" onClick={handleBuscar} disabled={loading} style={{ padding: "6px 16px", fontSize: "13px" }}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
        <button className="btn ghost" onClick={handleClear} disabled={loading} style={{ padding: "6px 16px", fontSize: "13px" }}>
          Limpiar
        </button>
      </div>

      <div className="cuadro-grid">
        {renderCuadro({
          key: "solicitudesAsociadas",
          ...solicitudesMeta,
          Component: SolicitudesAsociadas,
          full: true,
          extraProps: { referenciasOperativas, solicitudes },
        })}
        {renderCuadro({
          key: "jsonSolicitud",
          ...jsonSolicitudMeta,
          Component: JsonSolicitud,
          full: true,
          extraProps: { solicitudes, tipoSolicitudId, onChangeTipoSolicitud: setTipoSolicitudId },
        })}
        {renderCuadro({
          key: "evaluarMatriz",
          ...evaluarMatrizMeta,
          Component: EvaluarMatriz,
          full: true,
          extraProps: { solicitudes, tipoSolicitudId, onEvaluado: handleSolicitudEvaluada },
        })}
      </div>
    </div>
  );
}
