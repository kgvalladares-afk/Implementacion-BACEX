import { useState } from "react";
import { useToast } from "../../components/Toast.jsx";

export const meta = {
  label: "Matriz de Acción",
  icon: "🧮",
  desc: "Visualizar y gestionar solicitudes de la matriz",
  kind: "primary",
};

export default function Matriz() {
  const [matrizFiltro, setMatrizFiltro] = useState("");
  const [matrizDatos, setMatrizDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleCargarMatriz = () => {
    if (!matrizFiltro.trim()) {
      showToast("Ingrese un nodo o ID de ruta", "warn");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMatrizDatos([
        { id: "M-01", nodoOrigen: "Nodo Central TG", nodoDestino: "Sucursal SPS Oaste", latencia: "14ms", redundancia: "Alta", capacidad: "1 Gbps", estado: "Estable" },
        { id: "M-02", nodoOrigen: "Nodo Central TG", nodoDestino: "Enlace Ceiba Norte", latencia: "28ms", redundancia: "Media", capacidad: "500 Mbps", estado: "Estable" },
        { id: "M-03", nodoOrigen: "Planta Siguatepeque", nodoDestino: "Nodo Central TG", latencia: "45ms", redundancia: "Baja", capacidad: "200 Mbps", estado: "Degradado" }
      ]);
      showToast("Matriz de conectividad cargada", "ok");
      setLoading(false);
    }, 600);
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "900px" }}>
      <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{meta.label}</div>
      <div className="form-sub" style={{ color: "#697386", marginBottom: "20px" }}>{meta.desc}</div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Ingrese Nodo Origen, Destino o ID..."
          value={matrizFiltro}
          onChange={(e) => setMatrizFiltro(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #dcdfe6" }}
        />
        <button className="btn primary" onClick={handleCargarMatriz} disabled={loading}>
          {loading ? "Cargando..." : "Consultar Matriz"}
        </button>
      </div>

      {matrizDatos.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e3e8ee" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e3e8ee", textAlign: "left", fontSize: "12px" }}>
              <th style={{ padding: "10px" }}>ID</th>
              <th style={{ padding: "10px" }}>Origen</th>
              <th style={{ padding: "10px" }}>Destino</th>
              <th style={{ padding: "10px" }}>Latencia</th>
              <th style={{ padding: "10px" }}>Capacidad</th>
              <th style={{ padding: "10px" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {matrizDatos.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #edf2f7", fontSize: "13px" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{item.id}</td>
                <td style={{ padding: "10px" }}>{item.nodoOrigen}</td>
                <td style={{ padding: "10px" }}>{item.nodoDestino}</td>
                <td style={{ padding: "10px" }}>{item.latencia}</td>
                <td style={{ padding: "10px" }}>{item.capacidad}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: "4px", fontSize: "11px",
                    background: item.estado === "Estable" ? "#d1fae5" : "#fef3c7",
                    color: item.estado === "Estable" ? "#065f46" : "#92400e"
                  }}>
                    {item.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
