import { useState } from "react";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch } from "../../apiClient.js";
import { AUTORIZADORES } from "./autorizadores.js";

export const meta = {
  label: "Eliminar ContraRecibo",
  icon: "🗑️",
  desc: "Buscar y eliminar contrarecibos del sistema mediante Código Interno",
  kind: "danger",
};

const currencyFmt = new Intl.NumberFormat("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ESTADO_STYLE = {
  Activo: { background: "#d1fae5", color: "#065f46" },
  Eliminado: { background: "#fee2e2", color: "#991b1b" },
};

function Badge({ text, style }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: "999px",
      fontSize: "11.5px", fontWeight: "600", whiteSpace: "nowrap",
      background: style?.background || "#f1f5f9", color: style?.color || "#475569"
    }}>
      {text}
    </span>
  );
}

export default function EliminarContraRecibo() {
  const [codigoInterno, setCodigoInterno] = useState("");
  const [autorizador, setAutorizador] = useState("");
  const [contrarecibos, setContrarecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [eliminandoIds, setEliminandoIds] = useState(() => new Set());
  const showToast = useToast();

  const handleBuscar = async () => {
    const codigosInternos = codigoInterno.split(/[,\s\n]+/).map((c) => c.trim()).filter(Boolean);
    if (codigosInternos.length === 0) {
      showToast("Ingrese al menos un Código Interno para buscar", "warn");
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch(`/contrarecibosPorCodigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigosInternos })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al buscar contrarecibos`, "warn");
        setContrarecibos([]);
        setSearched(true);
        return;
      }
      const lista = Array.isArray(data) ? data : [];
      setContrarecibos(lista);
      setSearched(true);
      if (lista.length > 0 && lista.every((cr) => cr.Estado === "Eliminado")) {
        showToast("Este contrarecibo ya fue eliminado anteriormente.", "warn");
      }
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
      setContrarecibos([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCodigoInterno("");
    setAutorizador("");
    setContrarecibos([]);
    setSearched(false);
  };

  const handleEliminar = async (cr) => {
    if (cr.Estado === "Eliminado") {
      showToast("Este contrarecibo ya fue eliminado.", "warn");
      return;
    }
    if (!autorizador) {
      showToast("Seleccione quién autoriza antes de eliminar", "warn");
      return;
    }
    const motivo = window.prompt("Motivo de la eliminación (obligatorio):");
    if (!motivo || !motivo.trim()) {
      showToast("Debe indicar un motivo para eliminar el contrarecibo", "warn");
      return;
    }
    if (!window.confirm(`¿Confirma eliminar este contrarecibo?\n\nMotivo: ${motivo.trim()}`)) {
      return;
    }

    setEliminandoIds((prev) => new Set(prev).add(cr.Id));
    try {
      const response = await apiFetch(`/eliminarContrarecibo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Id: cr.Id, ModifiedBy: autorizador, Observacion: motivo.trim() })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al eliminar el contrarecibo`, "warn");
        return;
      }
      setContrarecibos((prev) => prev.map((item) =>
        item.Id === cr.Id ? { ...item, Estado: "Eliminado" } : item
      ));
      showToast(data?.Message || "✓ Contrarecibo eliminado con éxito", "ok");
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setEliminandoIds((prev) => {
        const next = new Set(prev);
        next.delete(cr.Id);
        return next;
      });
    }
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "100%" }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{meta.label}</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "4px" }}>{meta.desc}</div>
      </div>

      <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Filtrar por Código Interno
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a3acb9", fontSize: "16px" }}>🔍</span>
            <input
              type="text"
              placeholder="Ingrese uno o varios Códigos Internos (ej: SV2608-0021)..."
              value={codigoInterno}
              onChange={(e) => setCodigoInterno(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px" }}
              disabled={loading}
            />
          </div>
          <button
            className="btn primary"
            onClick={handleBuscar}
            disabled={loading}
            style={{ padding: "0 20px" }}
          >
            {loading ? "Buscando..." : "Buscar Registros"}
          </button>
          <button
            className="btn ghost"
            onClick={handleClear}
            disabled={loading}
            style={{ padding: "0 20px" }}
          >
            Limpiar
          </button>
        </div>

        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Autorizado por
        </label>
        <select
          value={autorizador}
          onChange={(e) => setAutorizador(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", background: "#fff" }}
        >
          <option value="">Seleccionar...</option>
          {AUTORIZADORES.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {searched && contrarecibos.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron contrarecibos para ese código.</p>
      )}

      {contrarecibos.length > 0 && (
        <>
          <div style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "#697386" }}>
              {contrarecibos.length} contrarecibo{contrarecibos.length !== 1 ? "s" : ""} encontrado{contrarecibos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Código Interno</th>
                  <th>Observación</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {contrarecibos.map((cr) => (
                  <tr key={cr.Id}>
                    <td style={{ fontWeight: "600", color: "#334155" }}>{cr.Cliente}</td>
                    <td>{cr.CodigoInterno}</td>
                    <td>{cr.Observacion}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#334155" }}>
                      {typeof cr.Monto === "number" ? currencyFmt.format(cr.Monto) : cr.Monto}
                    </td>
                    <td>
                      <Badge text={cr.Estado} style={ESTADO_STYLE[cr.Estado]} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn danger"
                        onClick={() => handleEliminar(cr)}
                        disabled={eliminandoIds.has(cr.Id)}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {eliminandoIds.has(cr.Id) ? "Eliminando..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
