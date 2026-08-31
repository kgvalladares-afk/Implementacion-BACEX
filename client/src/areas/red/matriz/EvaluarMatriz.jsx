import { useState } from "react";
import { useToast } from "../../../components/Toast.jsx";
import { apiFetch } from "../../../apiClient.js";
import { useAutorizadorActual } from "../../cfo/useAutorizadorActual.js";

export const meta = {
  label: "Evaluar Matriz",
  icon: "🔁",
  desc: "Reiniciar (marcar Vigente/No vigente) y volver a evaluar la solicitud seleccionada en Json Solicitud",
};

export default function EvaluarMatriz({ solicitudes = [], tipoSolicitudId, onEvaluado }) {
  const [vigente, setVigente] = useState("true");
  const autorizadorActual = useAutorizadorActual();
  const autorizador = autorizadorActual?.id || "";
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const showToast = useToast();

  const solicitud = solicitudes.find((s) => s.TipoSolicitudId === tipoSolicitudId) || null;
  const gestionId = solicitudes[0]?.GestionId || "";

  if (!tipoSolicitudId || !solicitud) {
    return <p style={{ color: "#697386", fontSize: "14px" }}>Seleccione un Tipo de Solicitud en "Json Solicitud" para poder reiniciarla.</p>;
  }

  const handleEjecutar = async () => {
    if (!autorizador) {
      showToast("Seleccione quién autoriza antes de continuar", "warn");
      return;
    }
    if (!window.confirm(`¿Confirma marcar este análisis como Vigente = ${vigente === "true" ? "Sí" : "No"} y reevaluarlo?`)) {
      return;
    }

    setProcesando(true);
    setResultado(null);
    try {
      const respActualizar = await apiFetch(`/actualizarAnalisisVigente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analisisId: solicitud.AnalisisId,
          usuarioId: autorizador,
          vigente: vigente === "true"
        })
      });
      const dataActualizar = await respActualizar.json().catch(() => null);
      if (!respActualizar.ok) {
        showToast(dataActualizar?.Message || "Error al actualizar el análisis", "warn");
        return;
      }
      showToast(dataActualizar?.Message || "✓ Análisis actualizado", "ok");

      const respEvaluar = await apiFetch(`/evaluarAnalisis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestionId, tipoSolicitudId })
      });
      const dataEvaluar = await respEvaluar.json().catch(() => null);
      if (!respEvaluar.ok) {
        showToast(dataEvaluar?.Message || "Error al evaluar el análisis", "warn");
        return;
      }
      setResultado(dataEvaluar?.Data ?? dataEvaluar);
      showToast("✓ Análisis reevaluado con éxito", "ok");
      await onEvaluado?.();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <div style={{ background: "#f8f9fa", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "16px", fontSize: "13px", color: "#475569" }}>
        <div><strong>Tipo de Solicitud:</strong> {solicitud.TipoSolicitud}</div>
        <div><strong>AnalisisId:</strong> {solicitud.AnalisisId}</div>
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
            Vigente
          </label>
          <select
            value={vigente}
            onChange={(e) => setVigente(e.target.value)}
            disabled={procesando}
            style={{ padding: "8px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "140px" }}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
            Autorizado por
          </label>
          <div style={{ padding: "8px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#f1f5f9", minWidth: "200px", color: autorizadorActual ? "#1a1f36" : "#b42318" }}>
            {autorizadorActual?.name || "Tu usuario no está habilitado como autorizador"}
          </div>
        </div>

        <button className="btn soft" onClick={handleEjecutar} disabled={procesando} style={{ padding: "9px 18px", fontSize: "13px" }}>
          {procesando ? "Procesando..." : "Actualizar y Evaluar"}
        </button>
      </div>

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
