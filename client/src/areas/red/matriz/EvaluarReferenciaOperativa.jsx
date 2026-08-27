import { useState } from "react";
import { useToast } from "../../../components/Toast.jsx";
import { apiFetch } from "../../../apiClient.js";
import { AUTORIZADORES } from "../../cfo/autorizadores.js";

export const meta = {
  label: "Evaluar Referencia Operativa",
  icon: "🧭",
  desc: "Reiniciar y volver a evaluar directamente una Referencia Operativa, marcando HaSidoEvaluado Sí/No",
};

export default function EvaluarReferenciaOperativa({ referenciasOperativas = [], onEvaluado }) {
  const [referenciaOperativaId, setReferenciaOperativaId] = useState("");
  const [haSidoEvaluado, setHaSidoEvaluado] = useState("false");
  const [autorizador, setAutorizador] = useState("");
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const showToast = useToast();

  if (referenciasOperativas.length === 0) {
    return <p style={{ color: "#697386", fontSize: "14px" }}>No hay Referencias Operativas para esta Gestión.</p>;
  }

  const seleccionada = referenciasOperativas.find((r) => r.ReferenciaOperativaId === referenciaOperativaId) || null;

  const handleActualizar = async () => {
    if (!seleccionada) {
      showToast("Seleccione una Referencia Operativa", "warn");
      return;
    }
    if (!autorizador) {
      showToast("Seleccione quién autoriza antes de continuar", "warn");
      return;
    }
    if (!window.confirm(`¿Confirma actualizar HaSidoEvaluado de la referencia ${seleccionada.Referencia} a "${haSidoEvaluado === "true" ? "Sí" : "No"}"?`)) {
      return;
    }

    setProcesando(true);
    setResultado(null);
    try {
      const resp = await apiFetch(`/actualizarHaSidoEvaluado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenciaOperativaId: seleccionada.ReferenciaOperativaId,
          haSidoEvaluado: haSidoEvaluado === "true",
          usuarioId: autorizador
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        showToast(data?.Message || "Error al actualizar la Referencia Operativa", "warn");
        return;
      }
      showToast(data?.Message || "✓ Referencia Operativa actualizada", "ok");
      await onEvaluado?.();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setProcesando(false);
    }
  };

  const handleEvaluar = async () => {
    if (!seleccionada) {
      showToast("Seleccione una Referencia Operativa", "warn");
      return;
    }

    setProcesando(true);
    setResultado(null);
    try {
      const resp = await apiFetch(`/evaluarReferenciaOperativa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referencia: seleccionada.Referencia })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        showToast(data?.Message || "Error al evaluar la Referencia Operativa", "warn");
        return;
      }
      setResultado(data?.Data ?? data);
      showToast("✓ Referencia Operativa reevaluada con éxito", "ok");
      setReferenciaOperativaId("");
      setAutorizador("");
      await onEvaluado?.();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
            Referencia Operativa
          </label>
          <select
            value={referenciaOperativaId}
            onChange={(e) => setReferenciaOperativaId(e.target.value)}
            disabled={procesando}
            style={{ padding: "8px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "220px" }}
          >
            <option value="">Seleccionar...</option>
            {referenciasOperativas.map((r) => (
              <option key={r.ReferenciaOperativaId} value={r.ReferenciaOperativaId}>{r.Referencia || "(sin referencia)"}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
            HaSidoEvaluado
          </label>
          <select
            value={haSidoEvaluado}
            onChange={(e) => setHaSidoEvaluado(e.target.value)}
            disabled={procesando}
            style={{ padding: "8px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "120px" }}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
            Autorizado por
          </label>
          <select
            value={autorizador}
            onChange={(e) => setAutorizador(e.target.value)}
            disabled={procesando}
            style={{ padding: "8px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "200px" }}
          >
            <option value="">Seleccionar...</option>
            {AUTORIZADORES.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <button className="btn soft" onClick={handleActualizar} disabled={procesando} style={{ padding: "9px 18px", fontSize: "13px" }}>
          {procesando ? "Procesando..." : "Actualizar Estado"}
        </button>

        <button className="btn primary" onClick={handleEvaluar} disabled={procesando} style={{ padding: "9px 18px", fontSize: "13px" }}>
          {procesando ? "Procesando..." : "Evaluar"}
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
