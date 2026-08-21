import { useState } from "react";
import { useToast } from "./Toast.jsx";
import { apiFetch } from "../apiClient.js";

// Cubre los módulos de tipo "buscar por SalesOrder/ContraRecibo y eliminar de la tabla de resultados":
// Eliminar Documento (mode="elimDoc") y Eliminar ContraRecibo (mode="contrarecibo").
export default function DocumentSearchModule({ mode, title, desc }) {
  const [searchSo, setSearchSo] = useState("");
  const [documentsFound, setDocumentsFound] = useState([]);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleSearchDocuments = async () => {
    if (!searchSo.trim()) {
      const msg = mode === "contrarecibo"
        ? "Por favor, ingrese un número de ContraRecibo para buscar"
        : "Por favor, ingrese una SalesOrder para buscar";
      showToast(msg, "warn");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "contrarecibo" ? "contrarecibos" : "documentosBySalesOrder";
      const paramName = mode === "contrarecibo" ? "contrarecibo" : "salesorder";

      const response = await apiFetch(`/${endpoint}?${paramName}=${encodeURIComponent(searchSo.trim())}&contexto=${mode}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentsFound(data || []);
        showToast("Búsqueda completada", "ok");
      } else {
        if (mode === "contrarecibo") {
          setDocumentsFound([
            { id: "CR-101", documento: "CR-2026-001", dueno: "Proveedor Global S.A.", estatus: "Activo", tipo: "ContraRecibo", monto: "L. 28,500.00" },
            { id: "CR-102", documento: "CR-2026-002", dueno: "Suministros Industriales", estatus: "Pendiente", tipo: "ContraRecibo", monto: "L. 12,300.00" }
          ]);
        } else {
          setDocumentsFound([
            { id: "DOC-101", documento: "FAC-2026-881", dueno: "Juan Pérez", estatus: "Activo", tipo: "Factura", monto: "L. 15,450.00" },
            { id: "DOC-102", documento: "REM-2026-402", dueno: "Ana Martínez", estatus: "Activo", tipo: "Remisión", monto: "L. 0.00" },
            { id: "DOC-103", documento: "OC-2026-119", dueno: "Carlos Mendoza", estatus: "Habilitado", tipo: "Orden de compra", monto: "L. 45,000.00" }
          ]);
        }
        showToast("Mostrando datos de simulación", "warn");
      }
    } catch (error) {
      if (mode === "contrarecibo") {
        setDocumentsFound([
          { id: "CR-101", documento: "CR-2026-001", dueno: "Proveedor Global S.A.", estatus: "Activo", tipo: "ContraRecibo", monto: "L. 28,500.00" },
          { id: "CR-102", documento: "CR-2026-002", dueno: "Suministros Industriales", estatus: "Pendiente", tipo: "ContraRecibo", monto: "L. 12,300.00" }
        ]);
      } else {
        setDocumentsFound([
          { id: "DOC-101", documento: "FAC-2026-881", dueno: "Juan Pérez", estatus: "Activo", tipo: "Factura", monto: "L. 15,450.00" },
          { id: "DOC-102", documento: "REM-2026-402", dueno: "Ana Martínez", estatus: "Activo", tipo: "Remisión", monto: "L. 0.00" }
        ]);
      }
      showToast("⚠️ Usando datos locales de prueba", "warn");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    const itemType = mode === "contrarecibo" ? "contrarecibo" : "documento";
    if (!window.confirm(`¿Está seguro de que desea eliminar permanentemente este ${itemType}?`)) return;

    setLoading(true);
    try {
      const endpoint = mode === "contrarecibo" ? "eliminarContrarecibo" : "eliminarDocumento";
      const response = await apiFetch(`/${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId })
      });
      if (response.ok) {
        showToast(`✓ ${mode === "contrarecibo" ? "ContraRecibo" : "Documento"} eliminado con éxito`, "ok");
        setDocumentsFound(prev => prev.filter(d => d.id !== docId));
      } else { showToast(`❌ No se pudo eliminar el ${itemType}`, "warn"); }
    } catch (error) { showToast("⚠️ Error de conexión", "warn"); } finally { setLoading(false); }
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "950px" }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{title}</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "4px" }}>{desc}</div>
      </div>

      <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "30px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {mode === "contrarecibo" ? "Filtrar por N° ContraRecibo" : "Filtrar por Orden de Venta (SalesOrder)"}
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a3acb9", fontSize: "16px" }}>🔍</span>
            <input
              type="text"
              placeholder={mode === "contrarecibo" ? "Ingrese el N° de ContraRecibo (ej: CR-00001)..." : "Ingrese el número de SalesOrder (ej: SO-01-01)..."}
              value={searchSo}
              onChange={(e) => setSearchSo(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px" }}
              disabled={loading}
            />
          </div>
          <button
            className="btn primary"
            onClick={handleSearchDocuments}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px" }}
          >
            {loading ? "Buscando..." : "Buscar Registros"}
          </button>
        </div>
      </div>

      {documentsFound.length > 0 && (
        <div className="results-table-container">
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e3e8ee", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#f4f6f8", borderBottom: "1px solid #e3e8ee", textAlign: "left", fontSize: "12px", color: "#697386", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>ID</th>
                <th style={{ padding: "12px 16px" }}>Documento</th>
                <th style={{ padding: "12px 16px" }}>Propietario / Entidad</th>
                <th style={{ padding: "12px 16px" }}>Monto</th>
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {documentsFound.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #edf2f7", fontSize: "14px" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "600", color: "#334155" }}>{doc.id}</td>
                  <td style={{ padding: "14px 16px" }}>{doc.documento}</td>
                  <td style={{ padding: "14px 16px" }}>{doc.dueno}</td>
                  <td style={{ padding: "14px 16px" }}>{doc.monto}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                      background: doc.estatus === "Habilitado" || doc.estatus === "Activo" ? "#d1fae5" : "#fee2e2",
                      color: doc.estatus === "Habilitado" || doc.estatus === "Activo" ? "#065f46" : "#991b1b"
                    }}>
                      {doc.estatus}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button
                      className="btn danger"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={loading}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
