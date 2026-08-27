import { Router } from "express";
import { conexion, BasesDeDatos } from '../database/database.js'
import sql from 'mssql'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const app = Router();
app.use(requireAuth);

app.post('/validacionSello', requirePermission('cfo', 'salesorder'), async (req, res) => {
    try {
        const { referencias } = req.body;
        const lista = Array.isArray(referencias)
            ? referencias.map((r) => String(r).trim()).filter(Boolean)
            : [];

        if (lista.length === 0) {
            return res.status(400).json({ Message: "Debe indicar al menos una Referencia Operativa / Hoja de Ruta." });
        }

        const pool = await conexion(BasesDeDatos.Seguimiento);
        const request = pool.request();
        const parametros = lista.map((valor, i) => {
            const nombre = `ref${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request.query(`
            SELECT
                g.id                            AS [ID Ref],
                'Seguimiento'                   AS [Tabla Fuente],
                g.NumeroGestion                 AS [CodigoGestion],
                REPLACE(value, ' ', '')          AS [NumeroHojaRuta],
                e.descripcion                   AS [Etiqueta Sello],
                MAX(S.fecha)                    AS [Fecha Sello],
                'Aduana'                        AS [Sitio_Segmento]
            FROM [dbo].[Gestion] G
                INNER JOIN [dbo].[tx] ON g.id = tx.GestionId
                LEFT JOIN referenciacliente ref_c ON g.id = ref_c.gestionid
                INNER JOIN [dbo].[TxDetalle] txd ON txd.TXID = tx.ID
                INNER JOIN [dbo].[Flujo] f ON f.TxDetalleid = txd.id
                INNER JOIN EsquemaFlujo ef ON f.esquemaflujoid = ef.id
                INNER JOIN [dbo].[FlujoDetalle] fd ON fd.FlujoId = f.ID
                INNER JOIN [dbo].[EsquemaFlujoDetalle] efj ON fd.EsquemaFlujoDetalleId = efj.ID
                INNER JOIN [dbo].[Sello] s ON s.FlujoDetalleId = fd.ID
                INNER JOIN Etiqueta e ON efj.EtiquetaID = e.ID
                CROSS APPLY STRING_SPLIT(tx.ReferenciaOperativa, ',')
            WHERE
                s.issoftdeleted = 0
                AND s.[SelloTipo_Value] = 3
                AND g.CreatedDate BETWEEN '2026-01-01' AND GETDATE()
                AND REPLACE(value, ' ', '') IN (${parametros.join(', ')})
                AND e.descripcion LIKE '%liber%'
            GROUP BY
                g.id, g.clientesolicitudid, g.NumeroGestion, e.descripcion, value
            ORDER BY
                g.NumeroGestion, [Fecha Sello]
        `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en validacionSello:", error);
        return res.status(500).json({ Message: "Error al obtener la validación de sello", Error: error.message });
    }
});

export default app;
