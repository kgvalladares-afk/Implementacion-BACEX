import { Router } from "express";
import { authDb } from "../database/authDb.js";
import { requireAuth } from "../middleware/auth.js";

const app = Router();
app.use(requireAuth);

app.get("/actividad", requireAuth, (req, res) => {
    const limite = Math.min(Number(req.query.limit) || 10, 100);
    const filas = authDb
        .prepare(`SELECT * FROM actividad ORDER BY created_date DESC LIMIT ?`)
        .all(limite);

    res.json(filas.map((f) => ({
        id: f.id,
        usuarioNombre: f.usuario_nombre,
        areaKey: f.area_key,
        areaLabel: f.area_label,
        moduloKey: f.modulo_key,
        moduloLabel: f.modulo_label,
        accion: f.accion,
        fecha: f.created_date
    })));
});

export default app;
