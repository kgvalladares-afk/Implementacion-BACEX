import { useEffect, useState } from "react";
import { apiFetch } from "../apiClient.js";
import { useToast } from "../components/Toast.jsx";

export default function AdminAutorizadores() {
  const [autorizadores, setAutorizadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const [nombre, setNombre] = useState("");
  const [externalId, setExternalId] = useState("");
  const [correo, setCorreo] = useState("");
  const [creando, setCreando] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editExternalId, setEditExternalId] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarAutorizadores = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/auth/autorizadores");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudieron cargar los autorizadores", "warn");
        return;
      }
      setAutorizadores(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAutorizadores();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !externalId.trim()) {
      showToast("Complete nombre e ID de la persona", "warn");
      return;
    }
    setCreando(true);
    try {
      const response = await apiFetch("/auth/autorizadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), externalId: externalId.trim(), correo: correo.trim() })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al crear el autorizador`, "warn");
        return;
      }
      showToast("✓ Autorizador creado con éxito", "ok");
      setNombre("");
      setExternalId("");
      setCorreo("");
      cargarAutorizadores();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setCreando(false);
    }
  };

  const abrirEdicion = (a) => {
    setEditingId(a.id);
    setEditNombre(a.nombre);
    setEditExternalId(a.externalId);
    setEditCorreo(a.correo || "");
  };

  const cancelarEdicion = () => {
    setEditingId(null);
  };

  const guardarEdicion = async (id) => {
    if (!editNombre.trim() || !editExternalId.trim()) {
      showToast("Complete nombre e ID de la persona", "warn");
      return;
    }
    setGuardando(true);
    try {
      const response = await apiFetch(`/auth/autorizadores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre.trim(), externalId: editExternalId.trim(), correo: editCorreo.trim() })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudo actualizar el autorizador", "warn");
        return;
      }
      showToast("✓ Autorizador actualizado", "ok");
      cancelarEdicion();
      cargarAutorizadores();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (a) => {
    if (!window.confirm(`¿Confirma eliminar a ${a.nombre} como autorizador?`)) return;
    try {
      const response = await apiFetch(`/auth/autorizadores/${a.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudo eliminar el autorizador", "warn");
        return;
      }
      showToast("✓ Autorizador eliminado", "ok");
      setAutorizadores((prev) => prev.filter((item) => item.id !== a.id));
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>Administración de Autorizadores</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "4px" }}>
          Personas que pueden aparecer en "Autorizado por" al ejecutar acciones. Se resuelve automáticamente por el nombre completo del usuario que inició sesión.
        </div>
      </div>

      <form onSubmit={handleCrear} style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre completo</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={creando} placeholder="Debe coincidir con el Nombre completo del usuario" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>ID de la persona (GUID del sistema externo)</label>
            <input type="text" value={externalId} onChange={(e) => setExternalId(e.target.value)} disabled={creando} placeholder="Ej: AF8E154B-2667-4787-84B9-24146A17ECE3" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={creando} placeholder="Opcional" />
          </div>
        </div>
        <button className="btn primary" type="submit" disabled={creando}>
          {creando ? "Creando..." : "Agregar autorizador"}
        </button>
      </form>

      <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#1a1f36" }}>Autorizadores existentes</h3>
      {loading ? (
        <p style={{ color: "#697386", fontSize: "14px" }}>Cargando...</p>
      ) : autorizadores.length === 0 ? (
        <p style={{ color: "#697386", fontSize: "14px" }}>No hay autorizadores registrados todavía.</p>
      ) : (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>ID de la persona</th>
                <th>Correo</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {autorizadores.map((a) => (
                editingId === a.id ? (
                  <tr key={a.id}>
                    <td><input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} disabled={guardando} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dcdfe6", borderRadius: "4px" }} /></td>
                    <td><input type="text" value={editExternalId} onChange={(e) => setEditExternalId(e.target.value)} disabled={guardando} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dcdfe6", borderRadius: "4px" }} /></td>
                    <td><input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} disabled={guardando} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dcdfe6", borderRadius: "4px" }} /></td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn primary" onClick={() => guardarEdicion(a.id)} disabled={guardando} style={{ padding: "6px 12px", fontSize: "12px" }}>
                        {guardando ? "Guardando..." : "Guardar"}
                      </button>
                      <button className="btn ghost" onClick={cancelarEdicion} disabled={guardando} style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={a.id}>
                    <td style={{ fontWeight: "600", color: "#334155" }}>{a.nombre}</td>
                    <td>{a.externalId}</td>
                    <td>{a.correo || "—"}</td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn ghost" onClick={() => abrirEdicion(a)} style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Editar
                      </button>
                      <button className="btn danger" onClick={() => handleEliminar(a)} style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
