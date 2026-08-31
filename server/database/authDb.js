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

  CREATE TABLE IF NOT EXISTS autorizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    external_id TEXT NOT NULL,
    correo TEXT,
    created_date TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// La tabla usuarios ya existía sin columna correo; se agrega aparte porque
// ALTER TABLE ADD COLUMN falla si la columna ya existe en una corrida posterior.
try {
  authDb.exec(`ALTER TABLE usuarios ADD COLUMN correo TEXT`);
} catch {
  // La columna ya existe, no hay nada que hacer.
}

// Los 3 autorizadores que antes vivían fijos en autorizadores.js, para que nadie
// pierda acceso al migrar a esta tabla administrable.
const seedAutorizadores = authDb.prepare(`INSERT INTO autorizadores (nombre, external_id, correo)
  SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM autorizadores WHERE external_id = ?)`);
seedAutorizadores.run("Marilyn Garcia", "AF8E154B-2667-4787-84B9-24146A17ECE3", null, "AF8E154B-2667-4787-84B9-24146A17ECE3");
seedAutorizadores.run("Kleimer Avila", "A4B6BA0D-2AE0-48B1-B33E-26A58B5384D6", null, "A4B6BA0D-2AE0-48B1-B33E-26A58B5384D6");
seedAutorizadores.run("Exuany Lanza", "D15E4902-D305-46CF-8807-1E8753A9A482", null, "D15E4902-D305-46CF-8807-1E8753A9A482");

export function getPermisosDeUsuario(usuarioId) {
  return authDb
    .prepare(`SELECT area_key AS area, modulo_key AS modulo FROM permisos WHERE usuario_id = ?`)
    .all(usuarioId);
}
