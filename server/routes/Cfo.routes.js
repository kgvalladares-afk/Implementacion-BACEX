import { Router } from "express";
import { conexion, BasesDeDatos } from '../database/database.js'
import sql from 'mssql'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const app = Router();
app.use(requireAuth);

// Azure a veces responde HTTP 200 aunque la operación se haya rechazado por una
// regla de negocio (ej. "Documento se encuentra pagado"). Hay que revisar IsValid,
// no solo el código HTTP, para saber si realmente se aplicó el cambio.
function mensajeDeAzure(data) {
    if (!data) return null;
    if (Array.isArray(data.Message)) return data.Message.length ? data.Message.join(' ') : null;
    return data.Message || null;
}

app.post('/habilitarSalesOrder', requirePermission('cfo', 'salesorder'), async (req, res) => {
    try {
        const { ReferenciaOperativa, ModifiedBy } = req.body;

        if (!ReferenciaOperativa) {
            return res.status(400).json({ Message: "La referencia operativa es requerida." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }

        // 1. Consultar el estado actual en la BD
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const validacion = await pool.request()
            .input('referencia', sql.VarChar, ReferenciaOperativa)
            .query(`
                SELECT [Status_Value]
                FROM [dbo].[SalesOrder]
                WHERE [ReferenciaOperativa] = @referencia
            `);

        if (validacion.recordset.length === 0) {
            return res.status(404).json({ Message: "No se encontró la Sales Order." });
        }

        const status = validacion.recordset[0].Status_Value;

        // 2. Aplicar regla de negocio (Solo permitir si el Status_Value es 1)
        if (status === 2) {
            return res.status(400).json({ Message: "La Sales Order ya se encuentra habilitada." });
        }
        if (status === 3) {
            return res.status(400).json({ Message: "La Sales Order ya fue facturada y no se puede habilitar." });
        }
        if (status !== 1) {
            return res.status(400).json({ Message: `La Sales Order no está en un estado válido para habilitarse (Estado: ${status}).` });
        }

        // 3. Si pasa la validación, consumir la API externa
        const resp = await fetch("https://cfows.azurewebsites.net/api/SalesOrder/SetEntregaDeDocumentos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ReferenciaOperativas: [ReferenciaOperativa], ModifiedBy })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`SetEntregaDeDocumentos → HTTP ${resp.status} para ${ReferenciaOperativa}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json();
        console.log(`SetEntregaDeDocumentos → ${ReferenciaOperativa}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Sales Order Habilitada con éxito", Data: data });

    } catch (error) {
        console.error("Error en habilitarSalesOrder:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

app.post('/getCliente', requirePermission('cfo', 'salesorder'), async (req, res) => {
    try {
        const { referencia } = req.body;
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        
        // Uso de .input() para evitar inyección SQL
        const resultado = await pool.request()
            .input('referencia', sql.VarChar, referencia)
            .query(`SELECT 
                [ReferenciaOperativa]
               ,[Status_Value] AS [StatusId]
               ,CASE [Status_Value]
                    WHEN 1 THEN 'Habilitar (La orden pasará a Sales Order Habilitada)'
                    WHEN 2 THEN 'Sales Order ya está habilitada'
                    WHEN 3 THEN 'Sales Order Facturada'
                    ELSE 'Estado Desconocido (' + CAST([Status_Value] AS VARCHAR(10)) + ')'
                END AS [Mensaje_Validacion]
            FROM [dbo].[SalesOrder]
            WHERE [ReferenciaOperativa] = @referencia;`);

        return res.json(resultado.recordset);

    } catch (error) {
        return res.status(500).json({ Message: "Error al obtener cliente", Error: error.message });
    }
});

app.post('/documentosPorReferencia', requirePermission('cfo', 'habDoc'), async (req, res) => {
    try {
        const { referencia } = req.body;
        if (!referencia) {
            return res.status(400).json({ Message: "La referencia operativa es requerida." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const resultado = await pool.request()
            .input('referencia', sql.VarChar, referencia)
            .query(`
                SELECT
                    d.Id AS DocumentoId,
                    pr.Nombre AS Proveedor,
                    MP.Descripcion AS MaterialProveedor,
                    c.Nombre AS Cliente,
                    d.Discriminator AS Tipo_Documento,
                    d.ReferenciaOperativa AS Referencia_Operativa,
                    d.TotalMonto AS Monto_Documento,
                    CASE
                        WHEN d.DueñoDocumento_Value = '1' THEN 'Vesta'
                        WHEN d.DueñoDocumento_Value = '2' THEN 'Cliente'
                        ELSE CAST(d.DueñoDocumento_Value AS VARCHAR)
                    END AS [Dueño Documento],
                    CASE
                        WHEN d.ReembolsoStatus_Value = '0' THEN 'Inhabilitado'
                        WHEN d.ReembolsoStatus_Value = '1' THEN 'Habilitado'
                        WHEN d.ReembolsoStatus_Value = '2' THEN 'Facturado'
                        ELSE CAST(d.ReembolsoStatus_Value AS VARCHAR)
                    END AS [Estado de documento],
                    d.CreatedDate AS Fecha
                FROM Documento d
                LEFT JOIN Cliente c ON d.ClienteId = c.Id
                LEFT JOIN Proveedor pr ON d.ProveedorId = pr.Id
                OUTER APPLY (
                    SELECT TOP 1 MP2.Descripcion
                    FROM dbo.DocumentoDetalle DD2
                    JOIN dbo.MaterialProveedor MP2 ON MP2.Id = DD2.MaterialProveedorId
                    WHERE DD2.DocumentoId = d.Id
                    ORDER BY MP2.Descripcion ASC
                ) MP
                WHERE d.ReferenciaOperativa = @referencia
                  AND d.IsSoftDeleted = 0
                ORDER BY MP.Descripcion ASC
            `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en documentosPorReferencia:", error);
        return res.status(500).json({ Message: "Error al obtener documentos", Error: error.message });
    }
});

app.post('/habilitarDocumento', requirePermission('cfo', 'habDoc'), async (req, res) => {
    try {
        const { DocumentoId, ModifiedBy } = req.body;

        if (!DocumentoId) {
            return res.status(400).json({ Message: "El documento es requerido." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }

        // 1. Consultar el estado actual en la BD
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const validacion = await pool.request()
            .input('documentoId', sql.UniqueIdentifier, DocumentoId)
            .query(`
                SELECT [ReembolsoStatus_Value], [DueñoDocumento_Value]
                FROM [dbo].[Documento]
                WHERE [Id] = @documentoId
            `);

        if (validacion.recordset.length === 0) {
            return res.status(404).json({ Message: "No se encontró el documento." });
        }

        const status = String(validacion.recordset[0].ReembolsoStatus_Value).trim();
        const dueno = String(validacion.recordset[0].DueñoDocumento_Value).trim();

        // 2. Aplicar regla de negocio (Solo permitir si el estado es 0 = Inhabilitado y el dueño es Vesta)
        // El estado se revisa primero: una vez habilitado, el dueño pasa a Cliente como consecuencia,
        // así que si revisáramos el dueño primero el mensaje sería engañoso (diría "es del cliente"
        // en vez de "ya está habilitado").
        if (status === '1') {
            return res.status(400).json({ Message: "El documento ya se encuentra habilitado." });
        }
        if (status === '2') {
            return res.status(400).json({ Message: "El documento ya fue facturado y no se puede habilitar." });
        }
        if (dueno !== '1') {
            return res.status(400).json({ Message: "Este documento pertenece al cliente; no se puede habilitar desde aquí." });
        }
        if (status !== '0') {
            return res.status(400).json({ Message: `El documento no está en un estado válido para habilitarse (Estado: ${status}).` });
        }

        // 3. Si pasa la validación, consumir la API externa
        const resp = await fetch("https://cfows.azurewebsites.net/api/Documento/UpdateStatus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ DocuementoId: [DocumentoId], ModifiedBy })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`UpdateStatus → HTTP ${resp.status} para ${DocumentoId}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`UpdateStatus → ${DocumentoId}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        // Azure ya actualiza tanto el estado como el dueño (Vesta → Cliente) en su respuesta;
        // no hace falta (ni tenemos permiso de UPDATE) tocar la tabla directamente nosotros.
        return res.status(200).json({ Message: "Documento habilitado con éxito", Data: data });

    } catch (error) {
        console.error("Error en habilitarDocumento:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

app.post('/documentosParaEliminar', requirePermission('cfo', 'elimDoc'), async (req, res) => {
    try {
        const { referencia } = req.body;
        if (!referencia) {
            return res.status(400).json({ Message: "La referencia operativa es requerida." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const resultado = await pool.request()
            .input('referencia', sql.VarChar, referencia)
            .query(`
                SELECT
                    d.Id AS Documento_ID,
                    pr.Nombre AS Proveedor,
                    MP.Descripcion AS MaterialProveedor,
                    c.Nombre AS Cliente,
                    CASE
                        WHEN d.IsSoftDeleted = 0 THEN 'Habilitado'
                        WHEN d.IsSoftDeleted = 1 THEN 'Eliminado'
                        ELSE 'Desconocido'
                    END AS IsSoftDeleted,
                    d.Discriminator AS Tipo_Documento,
                    d.ReferenciaOperativa AS Referencia_Operativa,
                    d.TotalMonto AS Monto_Documento,
                    CASE
                        WHEN d.DueñoDocumento_Value = 1 THEN 'Vesta'
                        WHEN d.DueñoDocumento_Value = 2 THEN 'Cliente'
                        ELSE 'Desconocido'
                    END AS Dueñodocumento_value,
                    d.CreatedDate AS Fecha
                FROM Documento d
                LEFT JOIN SolicitudDePago AS sp ON (d.Id = sp.Id)
                LEFT JOIN Pago p ON (sp.PagoId = p.Id)
                LEFT JOIN Cliente c ON (d.ClienteId = c.Id)
                LEFT JOIN Proveedor pr ON (d.ProveedorId = pr.Id)
                LEFT JOIN RegistroContable rc ON (d.RegistroContableId = rc.Id)
                OUTER APPLY (
                    SELECT TOP 1 MP2.Descripcion, MP2.MaterialTenantId
                    FROM dbo.DocumentoDetalle DD2
                    JOIN dbo.MaterialProveedor MP2 ON MP2.Id = DD2.MaterialProveedorId
                    WHERE DD2.DocumentoId = d.Id
                    ORDER BY MP2.Descripcion ASC
                ) MP
                LEFT JOIN MaterialTenant MT ON MP.MaterialTenantId = MT.Id
                WHERE d.ReferenciaOperativa = @referencia
                  AND d.IsSoftDeleted = '0'
                ORDER BY MP.Descripcion ASC
            `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en documentosParaEliminar:", error);
        return res.status(500).json({ Message: "Error al obtener documentos", Error: error.message });
    }
});

app.post('/eliminarDocumento', requirePermission('cfo', 'elimDoc'), async (req, res) => {
    try {
        const { DocumentoId, ModifiedBy, Observacion } = req.body;

        if (!DocumentoId) {
            return res.status(400).json({ Message: "El documento es requerido." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }
        if (!Observacion || !Observacion.trim()) {
            return res.status(400).json({ Message: "Debe indicar el motivo de la eliminación." });
        }

        // 1. Consultar el documento actual en la BD
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const validacion = await pool.request()
            .input('documentoId', sql.UniqueIdentifier, DocumentoId)
            .query(`
                SELECT [IsSoftDeleted], [Discriminator]
                FROM [dbo].[Documento]
                WHERE [Id] = @documentoId
            `);

        if (validacion.recordset.length === 0) {
            return res.status(404).json({ Message: "No se encontró el documento." });
        }

        const { IsSoftDeleted, Discriminator } = validacion.recordset[0];

        // 2. Aplicar reglas de negocio
        if (IsSoftDeleted) {
            return res.status(400).json({ Message: "El documento ya fue eliminado." });
        }

        // 3. Los DocumentoFiscalLiquidacion usan un endpoint distinto al resto de documentos.
        const esFiscalLiquidacion = Discriminator === 'DocumentoFiscalLiquidacion';
        const urlEliminar = esFiscalLiquidacion
            ? "https://cfows.azurewebsites.net/api/DocumentoFiscalLiquidacion/DCUpdateISDCreatedFiscal"
            : "https://cfows.azurewebsites.net/api/Documento/DCUpdateISDCreated";

        const resp = await fetch(urlEliminar, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Id: DocumentoId, ModifiedBy, Observacion, EnviarCorreo: true })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`${urlEliminar} → HTTP ${resp.status} para ${DocumentoId}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`${urlEliminar} → ${DocumentoId}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Documento eliminado con éxito", Data: data });

    } catch (error) {
        console.error("Error en eliminarDocumento:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

export default app;