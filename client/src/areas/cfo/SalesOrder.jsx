import { useState } from "react";
import FormField from "../../components/FormField.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch } from "../../apiClient.js";
import { AUTORIZADORES } from "./autorizadores.js";

export const meta = {
  label: "Habilitar SalesOrder",
  icon: "📄",
  desc: "Habilitar una o más ordenes de venta",
  kind: "primary",
};

const fields = [
  { id: "so_num", label: "N° SalesOrder(s)", type: "textarea", placeholder: "SO-01-01\nSO-01-02" },
  {
    id: "autorizador",
    label: "Autorizado por",
    type: "select",
    options: AUTORIZADORES
  }
];

// El backend local valida el estado en SQL Server antes de llamar a Azure:
// éxito = pasó de Creada(1) a Habilitada; "ya habilitada" = estado 2; "facturada" = estado 3, bloqueada.
const RESULT_STYLE = {
  success: { background: "#e6fffa", border: "#38b2ac", color: "#065f46" },
  already: { background: "#eff6ff", border: "#93c5fd", color: "#1d4ed8" },
  blocked: { background: "#fff5f5", border: "#feb2b2", color: "#991b1b" },
  error: { background: "#fffbeb", border: "#fcd34d", color: "#92400e" },
};

function classify(ok, message) {
  if (ok) return "success";
  const msg = (message || "").toLowerCase();
  if (msg.includes("facturada")) return "blocked";
  if (msg.includes("ya se encuentra habilitada")) return "already";
  return "error";
}

export default function SalesOrder() {
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [soResults, setSoResults] = useState([]);
  const showToast = useToast();

  const handleFieldChange = (id, val) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleClear = () => {
    setFormValues({});
    setSoResults([]);
  };

  const handleSubmit = async () => {
    const rawInput = formValues["so_num"];
    const autorizador = formValues["autorizador"];
    if (!rawInput?.trim() || !autorizador) {
      showToast("Complete los campos obligatorios", "warn");
      return;
    }
    const listaOrders = rawInput.split(/[\n,]/).map((item) => item.replace(/['"]/g, "").trim()).filter((item) => item.length > 0);
    if (listaOrders.length === 0) {
      showToast("Ingrese al menos una SalesOrder válida", "warn");
      return;
    }

    setLoading(true);
    setSoResults([]);
    for (const referencia of listaOrders) {
      try {
        const response = await apiFetch(`/habilitarSalesOrder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ReferenciaOperativa: referencia, ModifiedBy: autorizador })
        });
        const data = await response.json().catch(() => null);
        const message = data?.Message || (response.ok ? "Procesado correctamente" : `Error ${response.status}`);
        setSoResults((prev) => [...prev, { referencia, message, kind: classify(response.ok, message) }]);
      } catch (error) {
        setSoResults((prev) => [...prev, { referencia, message: "Error de conexión con el servidor", kind: "error" }]);
      }
    }
    setLoading(false);
    showToast("✓ Procesamiento finalizado", "ok");
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "700px" }}>
      <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{meta.label}</div>
      <div className="form-sub" style={{ color: "#697386", marginBottom: "20px" }}>{meta.desc}</div>

      {fields.map((f) => (
        <FormField key={f.id} field={f} value={formValues[f.id]} onChange={handleFieldChange} disabled={loading} />
      ))}

      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button className="btn primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Procesando..." : "Habilitar SalesOrder"}
        </button>
        <button className="btn ghost" onClick={handleClear} disabled={loading}>
          Limpiar
        </button>
      </div>

      {soResults.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Resultado del procesamiento</h3>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "10px" }}>
            {soResults.map((res, index) => {
              const style = RESULT_STYLE[res.kind] || RESULT_STYLE.error;
              return (
                <li key={index} style={{
                  padding: "10px 14px", borderRadius: "6px", marginBottom: "8px", fontSize: "14px",
                  background: style.background, border: `1px solid ${style.border}`, color: style.color
                }}>
                  <strong>{res.referencia}:</strong> {res.message}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
