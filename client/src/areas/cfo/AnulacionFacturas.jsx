import { useState } from "react";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch } from "../../apiClient.js";
import { useAutorizadorActual } from "./useAutorizadorActual.js";

export const meta = {
  label: "Anulación de Facturas",
  icon: "🧾",
  desc: "Habilitar una o más facturas para refacturación (anulación)",
  kind: "danger",
};

export default function AnulacionFacturas() {
  const [facturasTexto, setFacturasTexto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const autorizadorActual = useAutorizadorActual();
  const showToast = useToast();

  const handleAnular = async (e) => {
    e.preventDefault();

    const facturas = facturasTexto.split(/[,\s\n]+/).map((f) => f.trim()).filter(Boolean);
    if (facturas.length === 0) {
      showToast("Ingrese al menos un número de factura", "warn");
      return;
    }
    if (!observacion.trim()) {
      showToast("Indique la observación (motivo de la anulación)", "warn");
      return;
    }
    if (!autorizadorActual) {
      showToast("Tu usuario no está habilitado como autorizador", "warn");
      return;
    }
    if (!window.confirm(`¿Confirma anular ${facturas.length} factura(s)?\n\n${facturas.join(", ")}\n\nMotivo: ${observacion.trim()}`)) {
      return;
    }

    setEnviando(true);
    try {
      const response = await apiFetch(`/anularFacturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Facturas: facturas,
          Observacion: observacion.trim(),
          UsuarioId: autorizadorActual.id,
          Correo: autorizadorActual.correo
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al anular las facturas`, "warn");
        return;
      }
      showToast(data?.Message || "✓ Factura(s) anulada(s) con éxito", "ok");
      setUltimoResultado({ facturas, observacion: observacion.trim(), correo: autorizadorActual.correo });
      setFacturasTexto("");
      setObservacion("");
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "640px" }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{meta.label}</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "4px" }}>{meta.desc}</div>
      </div>

      <form onSubmit={handleAnular} style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "24px" }}>
        <div className="field" style={{ marginBottom: "20px" }}>
          <label>Número(s) de Factura</label>
          <textarea
            placeholder={"Ingrese uno o varios números de factura...\nEj: 0194079774, 0194079775"}
            value={facturasTexto}
            onChange={(e) => setFacturasTexto(e.target.value)}
            disabled={enviando}
            rows={3}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }}
          />
        </div>

        <div className="field" style={{ marginBottom: "20px" }}>
          <label>Observación (motivo de la anulación)</label>
          <textarea
            placeholder="Ej: Se elimina para refacturación, Solicitud SMA-ES-26-917"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            disabled={enviando}
            rows={2}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }}
          />
        </div>

        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Autorizado por
        </label>
        <div style={{ padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", background: "#f1f5f9", color: autorizadorActual ? "#1a1f36" : "#b42318", marginBottom: "20px" }}>
          {autorizadorActual
            ? `${autorizadorActual.name}${autorizadorActual.correo ? ` (${autorizadorActual.correo})` : " — sin correo configurado"}`
            : "Tu usuario no está habilitado como autorizador"}
        </div>

        <button className="btn danger" type="submit" disabled={enviando}>
          {enviando ? "Anulando..." : "Anular Factura(s)"}
        </button>
      </form>

      {ultimoResultado && (
        <div style={{ border: "1px solid #d1fae5", background: "#f0fdf9", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#065f46", marginBottom: "10px" }}>
            ✓ Última anulación realizada
          </div>
          <table className="doc-table" style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "600", color: "#334155", width: "180px" }}>Facturas</td>
                <td>{ultimoResultado.facturas.join(", ")}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "600", color: "#334155" }}>Observación</td>
                <td>{ultimoResultado.observacion}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "600", color: "#334155" }}>Notificado a</td>
                <td>{ultimoResultado.correo || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
