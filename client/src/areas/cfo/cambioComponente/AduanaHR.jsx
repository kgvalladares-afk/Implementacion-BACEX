export const meta = {
  label: "Aduana En HR",
  icon: "📋",
  desc: "Estado de la Hoja de Ruta por Referencia Operativa",
};

export default function AduanaHR({ resultados = [], loading = false, searched = false }) {
  return (
    <div>
      {searched && !loading && resultados.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron registros para esa referencia.</p>
      )}

      {resultados.length > 0 && (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Número Hoja Ruta</th>
                <th>Número Gestión</th>
                <th>Aduana</th>
                <th>Cliente</th>
                <th>Eliminado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={`${r.NumeroHojaRuta}-${i}`}>
                  <td style={{ fontWeight: "600", color: "#334155" }}>{r.NumeroHojaRuta}</td>
                  <td>{r.NumeroGestion}</td>
                  <td>{r.AduanaDescripcion}</td>
                  <td>{r.ClienteDescripcion}</td>
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
