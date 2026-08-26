import { useState } from "react";

export const meta = {
  label: "Componente",
  icon: "🧩",
  desc: "Componente del Sales Order; permite comparar con una Referencia Operativa de Ejemplo",
};

export default function Componente({
  resultados = [],
  loading = false,
  searched = false,
  opciones = [],
  extra = "",
  onAgregarExtra,
  onQuitarExtra,
}) {
  const [seleccion, setSeleccion] = useState("");

  const handleAgregar = () => {
    if (!seleccion) return;
    onAgregarExtra?.(seleccion);
    setSeleccion("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <select
          value={seleccion}
          onChange={(e) => setSeleccion(e.target.value)}
          disabled={loading || opciones.length === 0}
          style={{ padding: "8px 10px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "13px", background: "#fff", minWidth: "260px" }}
        >
          <option value="">
            {opciones.length === 0 ? "Sin Referencias Operativas de Ejemplo disponibles" : "Agregar Referencia Operativa de Ejemplo..."}
          </option>
          {opciones.map((ref) => (
            <option key={ref} value={ref}>{ref}</option>
          ))}
        </select>
        <button className="btn ghost" onClick={handleAgregar} disabled={!seleccion || loading} style={{ padding: "8px 16px", fontSize: "13px" }}>
          Agregar a comparación
        </button>
        {extra && (
          <button className="btn ghost" onClick={onQuitarExtra} disabled={loading} style={{ padding: "8px 16px", fontSize: "13px" }}>
            Quitar {extra} ✕
          </button>
        )}
      </div>

      {searched && !loading && resultados.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron componentes para esa referencia.</p>
      )}

      {resultados.length > 0 && (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Referencia Operativa</th>
                <th>Componente ID</th>
                <th>Descripción</th>
                <th>Centro Suministrador</th>
                <th>Oficina Venta</th>
                <th>Eliminado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={r.SalesOrderDetalleId || `${r.ReferenciaOperativa}-${r.Componente_ID}-${i}`}>
                  <td style={{ fontWeight: "600", color: "#334155" }}>{r.ReferenciaOperativa}</td>
                  <td>{r.Componente_ID}</td>
                  <td>{r.Descripcion}</td>
                  <td>{r.CentroSuministrador}</td>
                  <td>{r.OficinaVenta}</td>
                  <td>{r.IsSoftDeleted ? "SI" : "NO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
