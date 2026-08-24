import { useState } from "react";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch } from "../../apiClient.js";
import { AUTORIZADORES } from "./autorizadores.js";

export const meta = {
  label: "Redondeo de Documentos",
  icon: "🔘",
  desc: "Buscar documentos asociados a una Solicitud de Pago (SP)",
  kind: "primary",
};

const currencyFmt = new Intl.NumberFormat("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Solo se puede redondear si el primer decimal (las "decenas de centavos") es 3 o menos.
// Ej: 1,272,283.76 -> primer decimal 7 -> NO se puede redondear. 1,272,283.36 -> primer decimal 3 -> SI se puede.
function puedeRedondear(monto) {
  if (typeof monto !== "number" || !isFinite(monto)) return false;
  const centavos = Math.round(Math.abs(monto) * 100) % 100;
  const primerDecimal = Math.floor(centavos / 10);
  return primerDecimal <= 3;
}

export default function RedondeoDocumentos() {
  const [sp, setSp] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [autorizador, setAutorizador] = useState("");
  const [redondeando, setRedondeando] = useState(false);
  const showToast = useToast();

  const handleBuscar = async () => {
    const sps = sp.split(/[,\s\n]+/).map((s) => s.trim()).filter(Boolean);
    if (sps.length === 0) {
      showToast("Ingrese al menos un número de Solicitud de Pago (SP) para buscar", "warn");
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch(`/documentosParaRedondeo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sps })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al buscar documentos`, "warn");
        setDocumentos([]);
        setSearched(true);
        return;
      }
      setDocumentos(Array.isArray(data) ? data : []);
      setSearched(true);
      setSeleccionados(new Set());
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
      setDocumentos([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSp("");
    setDocumentos([]);
    setSearched(false);
    setSeleccionados(new Set());
    setAutorizador("");
  };

  const handleToggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const redondeablesIds = documentos.filter((d) => puedeRedondear(d.Monto_Documento)).map((d) => d.Id);

  const handleToggleTodos = () => {
    if (seleccionados.size === redondeablesIds.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(redondeablesIds));
    }
  };

  const handleRedondear = async () => {
    if (seleccionados.size === 0) {
      showToast("Seleccione al menos un documento para redondear", "warn");
      return;
    }
    if (!autorizador) {
      showToast("Seleccione quién autoriza antes de redondear", "warn");
      return;
    }
    if (!window.confirm(`¿Confirma redondear ${seleccionados.size} documento(s) seleccionado(s)?`)) {
      return;
    }

    setRedondeando(true);
    try {
      const response = await apiFetch(`/redondearDocumentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Ids: Array.from(seleccionados), ModifiedBy: autorizador })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al redondear documentos`, "warn");
        return;
      }
      showToast(data?.Message || "✓ Documentos redondeados con éxito", "ok");
      setDocumentos((prev) => prev.filter((d) => !seleccionados.has(d.Id)));
      setSeleccionados(new Set());
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setRedondeando(false);
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
          Filtrar por Número de Solicitud de Pago (SP) 
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a3acb9", fontSize: "16px" }}>🔍</span>
            <input
              type="text"
              placeholder="Ingrese uno o varios números de SP (ej: 1277085, 1277090)..."
              value={sp}
              onChange={(e) => setSp(e.target.value)}
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

      {searched && documentos.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron documentos para esa SP.</p>
      )}

      {documentos.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "#697386" }}>
              {documentos.length} documento{documentos.length !== 1 ? "s" : ""} encontrado{documentos.length !== 1 ? "s" : ""}
              {seleccionados.size > 0 ? ` · ${seleccionados.size} seleccionado${seleccionados.size !== 1 ? "s" : ""}` : ""}
            </span>
            <button
              className="btn primary"
              onClick={handleRedondear}
              disabled={redondeando || seleccionados.size === 0}
              style={{ padding: "8px 20px" }}
            >
              {redondeando ? "Redondeando..." : "Redondear Seleccionados"}
            </button>
          </div>
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>
                    <input
                      type="checkbox"
                      checked={redondeablesIds.length > 0 && seleccionados.size === redondeablesIds.length}
                      onChange={handleToggleTodos}
                      disabled={redondeablesIds.length === 0}
                    />
                  </th>
                  <th>Proveedor</th>
                  <th>Cliente</th>
                  <th>Tipo Documento</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => {
                  const redondeable = puedeRedondear(doc.Monto_Documento);
                  return (
                    <tr key={doc.Id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(doc.Id)}
                          onChange={() => handleToggleSeleccion(doc.Id)}
                          disabled={!redondeable}
                          title={!redondeable ? "Este documento excede el límite de 3 centavos permitido para redondeo" : undefined}
                        />
                      </td>
                      <td style={{ fontWeight: "600", color: "#334155" }}>{doc.Proveedor}</td>
                      <td>{doc.Cliente}</td>
                      <td>{doc.Tipo_Documento}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: redondeable ? "#334155" : "#b91c1c" }}>
                        {typeof doc.Monto_Documento === "number" ? currencyFmt.format(doc.Monto_Documento) : doc.Monto_Documento}
                        {!redondeable && (
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#b91c1c" }}>No redondeable</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
