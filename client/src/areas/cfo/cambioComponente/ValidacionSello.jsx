export const meta = {
  label: "Validación de Sello",
  icon: "🖋️",
  desc: "Sello de liberación registrado en Seguimiento por Hoja de Ruta",
};

// timeZone: "UTC" evita que el navegador reste el huso horario local: el driver de SQL
// etiqueta la fecha como UTC aunque en realidad ya es la hora local guardada en la BD.
const dateFmt = new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC" });

export default function ValidacionSello({ resultados = [], loading = false, searched = false }) {
  return (
    <div>
      {searched && !loading && resultados.length === 0 && (
        <p style={{ color: "#697386", fontSize: "14px" }}>No se encontró sello de liberación para esa referencia.</p>
      )}

      {resultados.length > 0 && (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Gestión</th>
                <th>N° Hoja de Ruta</th>
                <th>Etiqueta Sello</th>
                <th>Fecha Sello</th>
                <th>Sitio / Segmento</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={`${r["ID Ref"]}-${r["NumeroHojaRuta"]}-${i}`}>
                  <td style={{ fontWeight: "600", color: "#334155" }}>{r.CodigoGestion}</td>
                  <td>{r.NumeroHojaRuta}</td>
                  <td>{r["Etiqueta Sello"]}</td>
                  <td>{r["Fecha Sello"] ? dateFmt.format(new Date(r["Fecha Sello"])) : ""}</td>
                  <td>{r.Sitio_Segmento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
