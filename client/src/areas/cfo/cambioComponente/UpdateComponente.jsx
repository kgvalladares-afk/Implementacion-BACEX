import { useState } from "react";
import { useAutorizadorActual } from "../useAutorizadorActual.js";

export const meta = {
  label: "Update Componente",
  icon: "🛠️",
  desc: "Corregir el componente asignado a la Referencia Operativa filtrada",
};

export default function UpdateComponente({ filaActual, opciones = [], onActualizar, actualizando = false }) {
  const [componenteNuevo, setComponenteNuevo] = useState("");
  const autorizadorActual = useAutorizadorActual();
  const autorizador = autorizadorActual?.id || "";
  const [motivo, setMotivo] = useState("");

  if (!filaActual) {
    return <p style={{ color: "#697386", fontSize: "14px" }}>Busque una Referencia Operativa para poder corregir su componente.</p>;
  }

  const puedeEnviar = componenteNuevo && autorizador && motivo.trim() && !actualizando;

  const handleSubmit = () => {
    if (!puedeEnviar) return;
    onActualizar?.({ componenteId: componenteNuevo, autorizador, motivo: motivo.trim() });
    setComponenteNuevo("");
    setMotivo("");
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: "0 0 220px" }}>
        <div style={{ background: "#eef2ff", border: "1px solid #dbe3fb", borderRadius: "8px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#3730a3", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>
            Referencia seleccionada
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e1b4b" }}>{filaActual.ReferenciaOperativa}</div>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fde9b0", borderRadius: "8px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>
            Componente actual
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#78350f" }}>{filaActual.Descripcion}</div>
          <div style={{ fontSize: "11px", color: "#a16207", marginTop: "2px" }}>({filaActual.Componente_ID})</div>
        </div>
      </div>

      <div style={{ flex: "1 1 460px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
              Nuevo Componente
            </label>
            <select
              value={componenteNuevo}
              onChange={(e) => setComponenteNuevo(e.target.value)}
              disabled={actualizando || opciones.length === 0}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", background: "#fff" }}
            >
              <option value="">
                {opciones.length === 0 ? "Agregue una comparación..." : "Seleccionar componente..."}
              </option>
              {opciones.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
              Autorizado por
            </label>
            <div style={{ padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px", background: "#f1f5f9", color: autorizadorActual ? "#1a1f36" : "#b42318" }}>
              {autorizadorActual?.name || "Tu usuario no está habilitado como autorizador"}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "6px" }}>
              Motivo del cambio
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={actualizando}
              placeholder="Ej: El componente asignado no correspondía a esta referencia"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #dcdfe6", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>
        </div>

        <button className="btn soft" onClick={handleSubmit} disabled={!puedeEnviar} style={{ padding: "10px 20px", width: "100%" }}>
          {actualizando ? "Actualizando..." : "Actualizar Componente"}
        </button>
      </div>
    </div>
  );
}
