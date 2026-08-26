import { useRef, useState } from "react";
import { useToast } from "../../../components/Toast.jsx";
import { apiFetch } from "../../../apiClient.js";

export const meta = {
  label: "Json Solicitud",
  icon: "🧾",
  desc: "Consultar el JSON del Tipo de Solicitud para la Gestión filtrada",
};

export default function JsonSolicitud({ solicitudes = [], tipoSolicitudId, onChangeTipoSolicitud }) {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const controllerRef = useRef(null);

  const gestionId = solicitudes[0]?.GestionId || "";
  const opciones = Array.from(
    new Map(solicitudes.map((s) => [s.TipoSolicitudId, s.TipoSolicitud])).entries()
  );

  const handleConsultar = async () => {
    if (!gestionId) {
      showToast("Primero busque una Gestión en Solicitudes Asociadas", "warn");
      return;
    }
    if (!tipoSolicitudId) {
      showToast("Seleccione un Tipo de Solicitud", "warn");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setResultado(null);
    try {
      const response = await apiFetch(`/jsonSolicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestionId, tipoSolicitudId }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al consultar`, "warn");
        setResultado(null);
        return;
      }
      setResultado(data?.Data ?? data);
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("Consulta cancelada", "warn");
      } else {
        showToast("⚠️ Error de conexión con el servidor", "warn");
      }
      setResultado(null);
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const handleCancelar = () => {
    controllerRef.current?.abort();
  };

  if (opciones.length === 0) {
    return <p style={{ color: "#697386", fontSize: "14px" }}>Busque una Gestión en "Solicitudes Asociadas" para habilitar esta consulta.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "12px", color: "#697386" }}>
          <strong>Gestión:</strong> {gestionId}
        </div>
        <select
          value={tipoSolicitudId}
          onChange={(e) => onChangeTipoSolicitud?.(e.target.value)}
          disabled={loading}
          style={{ padding: "8px 10px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "260px" }}
        >
          <option value="">Seleccionar Tipo de Solicitud...</option>
          {opciones.map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
        <button className="btn primary" onClick={handleConsultar} disabled={loading} style={{ padding: "8px 16px", fontSize: "13px" }}>
          {loading ? "Consultando..." : "Consultar JSON"}
        </button>
        {loading && (
          <button className="btn ghost" onClick={handleCancelar} style={{ padding: "8px 16px", fontSize: "13px" }}>
            Cancelar
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px", background: "#f8f9fa", border: "1px solid #e3e8ee", borderRadius: "8px", marginBottom: "14px" }}>
          <span className="spinner-ring" />
          <span style={{ fontSize: "13px", color: "#4f5b66" }}>
            Consultando el servicio externo... esto puede tardar <strong>hasta 10-15 segundos</strong>.
          </span>
        </div>
      )}

      {resultado !== null && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setResultado(null)}
            title="Quitar JSON de la pantalla"
            style={{
              position: "absolute", top: "8px", right: "8px", zIndex: 1,
              background: "rgba(255,255,255,0.1)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer", fontSize: "14px", lineHeight: 1
            }}
          >
            ✕
          </button>
          <pre style={{
            background: "#0f172a", color: "#e2e8f0", padding: "14px", borderRadius: "8px",
            fontSize: "12px", overflow: "auto", maxHeight: "420px", whiteSpace: "pre-wrap", wordBreak: "break-word"
          }}>
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
