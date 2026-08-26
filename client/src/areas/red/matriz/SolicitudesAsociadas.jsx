export const meta = {
  label: "Solicitudes Asociadas",
  icon: "📑",
  desc: "Referencias operativas y solicitudes asociadas a la Gestión filtrada",
};

function formatValue(columna, v) {
  if (v === null || v === undefined) return "";
  // "Vigente" usa la convención invertida de este dominio: 0 = SI, 1 = NO.
  if (columna === "Vigente") {
    return (v === true || v === 1) ? "NO" : "SI";
  }
  if (typeof v === "boolean") return v ? "SI" : "NO";
  return String(v);
}

function GenericTable({ rows, ocultar = [] }) {
  if (!rows || rows.length === 0) return null;
  const columnas = Object.keys(rows[0]).filter((c) => !ocultar.includes(c));
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            {columnas.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.AnalisisId || row.ReferenciaOperativaId || row.Id || i}>
              {columnas.map((c) => (
                <td key={c}>{formatValue(c, row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SolicitudesAsociadas({ referenciasOperativas = [], solicitudes = [], loading = false, searched = false }) {
  const sinResultados = referenciasOperativas.length === 0 && solicitudes.length === 0;

  return (
    <div>
      {searched && !loading && sinResultados && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron registros para esa Gestión.</p>
      )}

      {referenciasOperativas.length > 0 && (
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "8px" }}>
            Referencias Operativas ({referenciasOperativas.length})
          </div>
          <GenericTable rows={referenciasOperativas} />
        </div>
      )}

      {solicitudes.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "8px" }}>
            Solicitudes ({solicitudes.length})
          </div>
          <GenericTable rows={solicitudes} ocultar={["GestionId", "ReferenciaOperativaId", "MatrizId"]} />
        </div>
      )}
    </div>
  );
}
