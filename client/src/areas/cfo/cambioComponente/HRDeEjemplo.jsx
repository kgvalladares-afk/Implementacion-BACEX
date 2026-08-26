export const meta = {
  label: "Referencia Operativa de Ejemplo",
  icon: "🗂️",
  desc: "Otras Hojas de Ruta del mismo cliente/aduana/gestión (según Aduana En HR)",
};

export default function HRDeEjemplo({ resultados = [], loading = false, searched = false }) {
  return (
    <div>
      {searched && !loading && resultados.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontraron registros relacionados.</p>
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
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={`${r.NumeroHojaRuta}-${i}`}>
                  <td style={{ fontWeight: "600", color: "#334155" }}>{r.NumeroHojaRuta}</td>
                  <td>{r.NumeroGestion}</td>
                  <td>{r.AduanaDescripcion}</td>
                  <td>{r.ClienteDescripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
