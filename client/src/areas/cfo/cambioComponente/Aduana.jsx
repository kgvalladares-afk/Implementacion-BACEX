export const meta = {
  label: "Aduana En CFO",
  icon: "🛃",
  desc: "Estado de aduana del Sales Order (CFO) por Referencia Operativa",
};

export default function Aduana({ resultados = [], loading = false, searched = false }) {
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
                <th>Referencia Operativa</th>
                <th>Centro Suministrador</th>
                <th>Sitio</th>
                <th>Estado</th>
                <th>Digitalizado</th>
                <th>Eliminado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={`${r.ReferenciaOperativa}-${i}`}>
                  <td style={{ fontWeight: "600", color: "#334155" }}>{r.ReferenciaOperativa}</td>
                  <td>{r.CentroSuministrador}</td>
                  <td>{r.Nombre}</td>
                  <td>{r.Status_DisplayName}</td>
                  <td>{r.Digitalizado ? "Digitalizado" : "Sin Digitalizar"}</td>
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
