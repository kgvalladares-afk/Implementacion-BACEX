import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "../apiClient.js";
import { areas } from "../areas/index.js";
import { useToast } from "../components/Toast.jsx";
import PasswordField from "../components/PasswordField.jsx";
import AdminAutorizadores from "./AdminAutorizadores.jsx";

function permisoKey(area, modulo) {
  return `${area}:${modulo}`;
}

function PermisosChecklist({ selected, onChange, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {Object.entries(areas).map(([areaKey, area]) => (
        <div key={areaKey}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "6px" }}>
            {area.icon} {area.label}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.entries(area.modules).map(([moduloKey, modulo]) => {
              const key = permisoKey(areaKey, moduloKey);
              return (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    disabled={disabled}
                    onChange={(e) => onChange(areaKey, moduloKey, e.target.checked)}
                  />
                  {modulo.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autorizadores, setAutorizadores] = useState([]);
  const showToast = useToast();

  const [autorizadorSeleccionado, setAutorizadorSeleccionado] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [permisos, setPermisos] = useState(() => new Set());
  const [creando, setCreando] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editingPermisos, setEditingPermisos] = useState(() => new Set());
  const [savingPermisos, setSavingPermisos] = useState(false);

  const [editingPasswordUserId, setEditingPasswordUserId] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [editingPerfilUserId, setEditingPerfilUserId] = useState(null);
  const [editNombreCompleto, setEditNombreCompleto] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [savingPerfil, setSavingPerfil] = useState(false);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/auth/usuarios");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudieron cargar los usuarios", "warn");
        return;
      }
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setLoading(false);
    }
  };

  const cargarAutorizadores = async () => {
    try {
      const response = await apiFetch("/auth/autorizadores");
      const data = await response.json().catch(() => null);
      if (response.ok) setAutorizadores(Array.isArray(data) ? data : []);
    } catch {
      // Si falla, simplemente no se ofrece el autocompletado; el formulario sigue funcionando manual.
    }
  };

  useEffect(() => {
    cargarUsuarios();
    cargarAutorizadores();
  }, []);

  const handleSeleccionarAutorizador = (id) => {
    setAutorizadorSeleccionado(id);
    const a = autorizadores.find((item) => String(item.id) === id);
    if (a) {
      setNombreCompleto(a.nombre);
      setCorreo(a.correo || "");
    }
  };

  const togglePermiso = (area, modulo, checked) => {
    setPermisos((prev) => {
      const next = new Set(prev);
      const key = permisoKey(area, modulo);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
  };

  const limpiarFormulario = () => {
    setAutorizadorSeleccionado("");
    setNombreUsuario("");
    setNombreCompleto("");
    setCorreo("");
    setPassword("");
    setIsAdmin(false);
    setPermisos(new Set());
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !nombreCompleto.trim() || !password) {
      showToast("Complete usuario, nombre completo y contraseña", "warn");
      return;
    }
    setCreando(true);
    try {
      const permisosArray = [...permisos].map((key) => {
        const [area, modulo] = key.split(":");
        return { area, modulo };
      });
      const response = await apiFetch("/auth/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreUsuario: nombreUsuario.trim(),
          nombreCompleto: nombreCompleto.trim(),
          correo: correo.trim(),
          password,
          isAdmin,
          permisos: permisosArray
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || `Error ${response.status} al crear el usuario`, "warn");
        return;
      }
      showToast("✓ Usuario creado con éxito", "ok");
      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setCreando(false);
    }
  };

  const toggleEditingPermiso = (area, modulo, checked) => {
    setEditingPermisos((prev) => {
      const next = new Set(prev);
      const key = permisoKey(area, modulo);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
  };

  const abrirEdicionPermisos = (usuario) => {
    setEditingUserId(usuario.id);
    setEditingPermisos(new Set(usuario.permisos.map((p) => permisoKey(p.area, p.modulo))));
  };

  const cancelarEdicionPermisos = () => {
    setEditingUserId(null);
    setEditingPermisos(new Set());
  };

  const guardarPermisos = async (usuarioId) => {
    setSavingPermisos(true);
    try {
      const permisosArray = [...editingPermisos].map((key) => {
        const [area, modulo] = key.split(":");
        return { area, modulo };
      });
      const response = await apiFetch(`/auth/usuarios/${usuarioId}/permisos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisos: permisosArray })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudieron actualizar los permisos", "warn");
        return;
      }
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, permisos: permisosArray } : u)));
      showToast("✓ Permisos actualizados", "ok");
      cancelarEdicionPermisos();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setSavingPermisos(false);
    }
  };

  const abrirEdicionPerfil = (usuario) => {
    setEditingPerfilUserId(usuario.id);
    setEditNombreCompleto(usuario.nombreCompleto);
    setEditCorreo(usuario.correo || "");
  };

  const cancelarEdicionPerfil = () => {
    setEditingPerfilUserId(null);
  };

  const guardarPerfil = async (usuarioId) => {
    if (!editNombreCompleto.trim()) {
      showToast("El nombre completo es requerido", "warn");
      return;
    }
    setSavingPerfil(true);
    try {
      const response = await apiFetch(`/auth/usuarios/${usuarioId}/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCompleto: editNombreCompleto.trim(), correo: editCorreo.trim() })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudo actualizar el perfil", "warn");
        return;
      }
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, nombreCompleto: editNombreCompleto.trim(), correo: editCorreo.trim() } : u)));
      showToast("✓ Perfil actualizado", "ok");
      cancelarEdicionPerfil();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setSavingPerfil(false);
    }
  };

  const abrirCambioPassword = (usuario) => {
    setEditingPasswordUserId(usuario.id);
    setNuevaPassword("");
  };

  const cancelarCambioPassword = () => {
    setEditingPasswordUserId(null);
    setNuevaPassword("");
  };

  const guardarPassword = async (usuarioId) => {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "warn");
      return;
    }
    setSavingPassword(true);
    try {
      const response = await apiFetch(`/auth/usuarios/${usuarioId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nuevaPassword })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudo actualizar la contraseña", "warn");
        return;
      }
      showToast("✓ Contraseña actualizada", "ok");
      cancelarCambioPassword();
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleActivo = async (usuario) => {
    try {
      const response = await apiFetch(`/auth/usuarios/${usuario.id}/activo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !usuario.activo })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showToast(data?.Message || "No se pudo actualizar el usuario", "warn");
        return;
      }
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, activo: !u.activo } : u)));
      showToast(data?.Message || "Actualizado", "ok");
    } catch (error) {
      showToast("⚠️ Error de conexión con el servidor", "warn");
    }
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "1000px" }}>
      <div style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>Administración de Usuarios</div>
        <div className="form-sub" style={{ color: "#697386", marginTop: "4px" }}>Crea usuarios y define a qué módulos tiene acceso cada uno</div>
      </div>

      <form onSubmit={handleCrear} style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e3e8ee", marginBottom: "30px" }}>
        {autorizadores.length > 0 && (
          <div className="field">
            <label>Autocompletar desde Autorizadores</label>
            <select
              value={autorizadorSeleccionado}
              onChange={(e) => handleSeleccionarAutorizador(e.target.value)}
              disabled={creando}
            >
              <option value="">Seleccionar...</option>
              {autorizadores.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Usuario</label>
            <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} disabled={creando} autoComplete="off" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre completo</label>
            <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} disabled={creando} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={creando} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Contraseña</label>
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} disabled={creando} autoComplete="new-password" />
          </div>
          <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} disabled={creando} />
              Administrador (acceso a todo, incluida esta pantalla)
            </label>
          </div>
        </div>

        {!isAdmin && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4f5b66", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Módulos permitidos
            </label>
            <PermisosChecklist selected={permisos} onChange={togglePermiso} disabled={creando} />
          </div>
        )}

        <button className="btn primary" type="submit" disabled={creando}>
          {creando ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#1a1f36" }}>Usuarios existentes</h3>
      {loading ? (
        <p style={{ color: "#697386", fontSize: "14px" }}>Cargando...</p>
      ) : usuarios.length === 0 ? (
        <p style={{ color: "#697386", fontSize: "14px" }}>No hay usuarios registrados todavía.</p>
      ) : (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Tipo</th>
                <th>Módulos</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td style={{ fontWeight: "600", color: "#334155" }}>{u.nombreUsuario}</td>
                    <td>{u.nombreCompleto}</td>
                    <td>{u.correo || "—"}</td>
                    <td>{u.isAdmin ? "Administrador" : "Estándar"}</td>
                    <td>{u.isAdmin ? "Todos" : (u.permisos.length || "Ninguno")}</td>
                    <td>{u.activo ? "Activo" : "Inactivo"}</td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        className="btn ghost"
                        onClick={() => (editingPerfilUserId === u.id ? cancelarEdicionPerfil() : abrirEdicionPerfil(u))}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {editingPerfilUserId === u.id ? "Cerrar" : "Editar perfil"}
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => (editingUserId === u.id ? cancelarEdicionPermisos() : abrirEdicionPermisos(u))}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {editingUserId === u.id ? "Cerrar" : "Editar permisos"}
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => (editingPasswordUserId === u.id ? cancelarCambioPassword() : abrirCambioPassword(u))}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {editingPasswordUserId === u.id ? "Cerrar" : "Cambiar contraseña"}
                      </button>
                      <button
                        className={`btn ${u.activo ? "danger" : "primary"}`}
                        onClick={() => toggleActivo(u)}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                  {editingPerfilUserId === u.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "#f8f9fa", padding: "18px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "12px" }}>
                          Editar perfil de {u.nombreCompleto}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "560px" }}>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Nombre completo</label>
                            <input type="text" value={editNombreCompleto} onChange={(e) => setEditNombreCompleto(e.target.value)} disabled={savingPerfil} />
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Correo</label>
                            <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} disabled={savingPerfil} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button className="btn primary" onClick={() => guardarPerfil(u.id)} disabled={savingPerfil} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            {savingPerfil ? "Guardando..." : "Guardar perfil"}
                          </button>
                          <button className="btn ghost" onClick={cancelarEdicionPerfil} disabled={savingPerfil} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {editingUserId === u.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "#f8f9fa", padding: "18px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "12px" }}>
                          Permisos de {u.nombreCompleto}
                        </div>
                        <PermisosChecklist selected={editingPermisos} onChange={toggleEditingPermiso} disabled={savingPermisos} />
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button className="btn primary" onClick={() => guardarPermisos(u.id)} disabled={savingPermisos} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            {savingPermisos ? "Guardando..." : "Guardar permisos"}
                          </button>
                          <button className="btn ghost" onClick={cancelarEdicionPermisos} disabled={savingPermisos} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {editingPasswordUserId === u.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "#f8f9fa", padding: "18px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#4f5b66", textTransform: "uppercase", marginBottom: "12px" }}>
                          Nueva contraseña para {u.nombreCompleto}
                        </div>
                        <div style={{ maxWidth: "320px" }}>
                          <PasswordField
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            disabled={savingPassword}
                            autoComplete="new-password"
                          />
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button className="btn primary" onClick={() => guardarPassword(u.id)} disabled={savingPassword} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            {savingPassword ? "Guardando..." : "Guardar contraseña"}
                          </button>
                          <button className="btn ghost" onClick={cancelarCambioPassword} disabled={savingPassword} style={{ padding: "6px 14px", fontSize: "12px" }}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminAutorizadores />
    </div>
  );
}
