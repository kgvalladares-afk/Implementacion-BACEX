import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "auth.db");

export const authDb = new DatabaseSync(dbPath);

authDb.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_usuario TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1,
    created_date TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    area_key TEXT NOT NULL,
    modulo_key TEXT NOT NULL,
    UNIQUE(usuario_id, area_key, modulo_key)
  );

  CREATE TABLE IF NOT EXISTS actividad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_nombre TEXT NOT NULL,
    area_key TEXT NOT NULL,
    area_label TEXT NOT NULL,
    modulo_key TEXT,
    modulo_label TEXT,
    accion TEXT NOT NULL,
    created_date TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// La tabla usuarios ya existía sin estas columnas; se agregan aparte porque
// ALTER TABLE ADD COLUMN falla si la columna ya existe en una corrida posterior.
// persona_id es el Id (uniqueidentifier) de la tabla Persona en la BD de Personas —
// reemplaza a la vieja tabla "autorizadores" como fuente del ID real para ModifiedBy/UsuarioId.
try {
  authDb.exec(`ALTER TABLE usuarios ADD COLUMN correo TEXT`);
} catch {
  // La columna ya existe, no hay nada que hacer.
}
try {
  authDb.exec(`ALTER TABLE usuarios ADD COLUMN persona_id TEXT`);
} catch {
  // La columna ya existe, no hay nada que hacer.
}

export function getPermisosDeUsuario(usuarioId) {
  return authDb
    .prepare(`SELECT area_key AS area, modulo_key AS modulo FROM permisos WHERE usuario_id = ?`)
    .all(usuarioId);
}

// Registro de actividad para el widget "Actividad reciente" de Inicio. Se llama desde
// las rutas después de que una acción se aplicó con éxito de verdad (no antes de validar).
export function registrarActividad({ usuarioNombre, areaKey, areaLabel, moduloKey, moduloLabel, accion }) {
  try {
    authDb
      .prepare(`INSERT INTO actividad (usuario_nombre, area_key, area_label, modulo_key, modulo_label, accion) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(usuarioNombre || "—", areaKey, areaLabel, moduloKey || null, moduloLabel || null, accion);
  } catch (error) {
    console.error("Error al registrar actividad:", error);
  }
}
