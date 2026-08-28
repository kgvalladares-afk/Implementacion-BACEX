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

// Único requisito para poder redondear: que el documento tenga un monto numérico válido.
function puedeRedondear(monto) {
    return typeof monto === 'number' && isFinite(monto);
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
        const { referencia, referencias } = req.body;
        const listaReferencias = Array.isArray(referencias)
            ? referencias.map((r) => String(r).trim()).filter(Boolean)
            : (referencia ? [String(referencia).trim()] : []);

        if (listaReferencias.length === 0) {
            return res.status(400).json({ Message: "La referencia operativa es requerida." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = listaReferencias.map((valor, i) => {
            const nombre = `ref${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request
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
                WHERE d.ReferenciaOperativa IN (${parametros.join(", ")})
                  AND d.IsSoftDeleted = 0
                ORDER BY d.ReferenciaOperativa ASC, MP.Descripcion ASC
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

        // 2. Aplicar regla de negocio (Solo permitir si el estado es 0 = Inhabilitado)
        if (status === '1') {
            return res.status(400).json({ Message: "El documento ya se encuentra habilitado." });
        }
        if (status === '2') {
            return res.status(400).json({ Message: "El documento ya fue facturado y no se puede habilitar." });
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

app.post('/deshabilitarDocumento', requirePermission('cfo', 'habDoc'), async (req, res) => {
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

        // 2. Aplicar regla de negocio (Solo permitir si el estado es 1 = Habilitado)
        if (status === '0') {
            return res.status(400).json({ Message: "El documento ya se encuentra inhabilitado." });
        }
        if (status === '2') {
            return res.status(400).json({ Message: "El documento ya fue facturado y no se puede deshabilitar." });
        }
        if (status !== '1') {
            return res.status(400).json({ Message: `El documento no está en un estado válido para deshabilitarse (Estado: ${status}).` });
        }

        // 3. Si pasa la validación, consumir la API externa
        const resp = await fetch("https://cfows.azurewebsites.net/api/Documento/DeshabilitarDocumentos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ DocumentoId: [DocumentoId], ModifiedBy })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`DeshabilitarDocumentos → HTTP ${resp.status} para ${DocumentoId}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`DeshabilitarDocumentos → ${DocumentoId}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Documento deshabilitado con éxito", Data: data });

    } catch (error) {
        console.error("Error en deshabilitarDocumento:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

app.post('/documentosParaEliminar', requirePermission('cfo', 'elimDoc'), async (req, res) => {
    try {
        const { referencia, referencias } = req.body;
        const listaReferencias = Array.isArray(referencias)
            ? referencias.map((r) => String(r).trim()).filter(Boolean)
            : (referencia ? [String(referencia).trim()] : []);

        if (listaReferencias.length === 0) {
            return res.status(400).json({ Message: "La referencia operativa es requerida." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = listaReferencias.map((valor, i) => {
            const nombre = `ref${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request
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
                WHERE d.ReferenciaOperativa IN (${parametros.join(", ")})
                  AND d.IsSoftDeleted = '0'
                ORDER BY d.ReferenciaOperativa ASC, MP.Descripcion ASC
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

app.post('/contrarecibosPorCodigo', requirePermission('cfo', 'contrarecibo'), async (req, res) => {
    try {
        const { codigoInterno, codigosInternos } = req.body;
        const listaCodigos = Array.isArray(codigosInternos)
            ? codigosInternos.map((c) => String(c).trim()).filter(Boolean)
            : (codigoInterno ? [String(codigoInterno).trim()] : []);

        if (listaCodigos.length === 0) {
            return res.status(400).json({ Message: "El código interno es requerido." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = listaCodigos.map((valor, i) => {
            const nombre = `codigo${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request
            .query(`
                SELECT
                    cr.Id,
                    cr.ClienteId,
                    c.Nombre AS Cliente,
                    cr.CodigoInterno,
                    cr.Observacion,
                    cr.TotalMonto_Amount AS Monto,
                    CASE WHEN cr.IsSoftDeleted = 1 THEN 'Eliminado' ELSE 'Activo' END AS Estado
                FROM ContraRecibo cr
                LEFT JOIN Cliente c ON cr.ClienteId = c.Id
                WHERE cr.CodigoInterno IN (${parametros.join(", ")})
            `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en contrarecibosPorCodigo:", error);
        return res.status(500).json({ Message: "Error al obtener contrarecibos", Error: error.message });
    }
});

app.post('/eliminarContrarecibo', requirePermission('cfo', 'contrarecibo'), async (req, res) => {
    try {
        const { Id, ModifiedBy, Observacion } = req.body;

        if (!Id) {
            return res.status(400).json({ Message: "El contrarecibo es requerido." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }
        if (!Observacion || !Observacion.trim()) {
            return res.status(400).json({ Message: "Debe indicar el motivo de la eliminación." });
        }

        // 1. Consultar el contrarecibo actual en la BD
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const validacion = await pool.request()
            .input('id', sql.UniqueIdentifier, Id)
            .query(`
                SELECT [IsSoftDeleted]
                FROM [dbo].[ContraRecibo]
                WHERE [Id] = @id
            `);

        if (validacion.recordset.length === 0) {
            return res.status(404).json({ Message: "No se encontró el contrarecibo." });
        }
        if (validacion.recordset[0].IsSoftDeleted) {
            return res.status(400).json({ Message: "El contrarecibo ya fue eliminado." });
        }

        // 2. Si pasa la validación, consumir la API externa
        const resp = await fetch("https://cfows.azurewebsites.net/api/Contrarecibo/Delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Id, Observacion, ModifiedBy })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`Contrarecibo/Delete → HTTP ${resp.status} para ${Id}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`Contrarecibo/Delete → ${Id}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Contrarecibo eliminado con éxito", Data: data });

    } catch (error) {
        console.error("Error en eliminarContrarecibo:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

app.post('/documentosParaRedondeo', requirePermission('cfo', 'redondeo'), async (req, res) => {
    try {
        const { sp, sps } = req.body;
        const listaSps = Array.isArray(sps)
            ? sps.map((s) => String(s).trim()).filter(Boolean)
            : (sp ? [String(sp).trim()] : []);

        if (listaSps.length === 0) {
            return res.status(400).json({ Message: "El número de Solicitud de Pago (SP) es requerido." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = listaSps.map((valor, i) => {
            const nombre = `sp${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request
            .query(`
                SELECT
                    d.Id,
                    pr.Nombre AS Proveedor,
                    pr.PersonaId,
                    c.Id AS Cliente_Id,
                    c.Nombre AS Cliente,
                    d.Discriminator AS Tipo_Documento,
                    d.ReferenciaOperativa AS Referencia_Operativa,
                    d.NumeroDocumentoFiscal AS Numero_DocumentoFiscal,
                    d.TotalMonto AS Monto_Documento,
                    d.DueñoDocumento_Value,
                    d.ReembolsoStatus_Value,
                    dd.PrecioVenta,
                    dd.Impuesto,
                    d.Moneda_Value,
                    d.FlagTasaDeSeguridad,
                    rc.NumeroDocumentoSap AS NumeroDocumento_Sap,
                    sp.FechaPago AS Fecha_Solicitud_Pago,
                    p.CreatedDate AS Fecha_Creacion_Pago,
                    p.FechaDigitalizacion AS Fecha_oficial_Pago,
                    sp.[Unique] AS Numero_SolicitudDePago,
                    p.ReferenciaBancaria AS ReferenciaBancaria,
                    p.[Unique] AS NumeroSolicitudDePago,
                    p.RegistroSap AS Registro_Sap,
                    MP.Descripcion AS MaterialProveedor,
                    MP.Id AS MaterialProveedorId,
                    MT.CodigoErpReembolso,
                    MT.CuentaMayor,
                    d.CreatedBy,
                    d.CreatedDate,
                    d.RegistroContableFacturaId,
                    d.RegistroContableId,
                    rc.MensajeSAp
                FROM Documento d
                LEFT JOIN SolicitudDePago AS sp ON (d.Id = sp.Id)
                LEFT JOIN Pago p ON (sp.PagoId = p.Id)
                LEFT JOIN Cliente c ON (d.ClienteId = c.Id)
                LEFT JOIN Proveedor pr ON (d.ProveedorId = pr.Id)
                LEFT JOIN RegistroContable rc ON (d.RegistroContableId = rc.Id)
                OUTER APPLY (
                    SELECT TOP 1 DD.PrecioVenta, DD.Impuesto, DD.MaterialProveedorId
                    FROM dbo.DocumentoDetalle DD
                    WHERE DD.DocumentoId = d.Id
                    ORDER BY DD.PrecioVenta DESC
                ) dd
                LEFT JOIN dbo.MaterialProveedor MP ON MP.Id = dd.MaterialProveedorId
                LEFT JOIN MaterialTenant MT ON MP.MaterialTenantId = MT.Id
                WHERE sp.[Unique] IN (${parametros.join(", ")})
                  AND d.IsSoftDeleted = 0
                ORDER BY d.Id ASC
            `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en documentosParaRedondeo:", error);
        return res.status(500).json({ Message: "Error al obtener documentos", Error: error.message });
    }
});

app.post('/redondearDocumentos', requirePermission('cfo', 'redondeo'), async (req, res) => {
    try {
        const { Ids, ModifiedBy } = req.body;

        if (!Array.isArray(Ids) || Ids.length === 0) {
            return res.status(400).json({ Message: "Debe seleccionar al menos un documento para redondear." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }

        // Validar contra el monto real en base de datos que ningún documento exceda el límite de redondeo.
        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = Ids.map((id, i) => {
            const nombre = `id${i}`;
            request.input(nombre, sql.UniqueIdentifier, id);
            return `@${nombre}`;
        });
        const validacion = await request.query(`
            SELECT Id, TotalMonto
            FROM Documento
            WHERE Id IN (${parametros.join(", ")})
        `);

        const noRedondeables = validacion.recordset.filter((doc) => !puedeRedondear(doc.TotalMonto));
        if (noRedondeables.length > 0) {
            return res.status(400).json({
                Message: `No se puede redondear: ${noRedondeables.length} documento(s) no tienen un monto válido.`
            });
        }

        const resp = await fetch("https://cfows.azurewebsites.net/api/Documento/Redondeo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Ids, ModifiedBy })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`Documento/Redondeo → HTTP ${resp.status}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`Documento/Redondeo → ${JSON.stringify(Ids)}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Documentos redondeados con éxito", Data: data });

    } catch (error) {
        console.error("Error en redondearDocumentos:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

app.post('/aduanaPorReferencia', requirePermission('cfo', 'cambio'), async (req, res) => {
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
                    SO.ReferenciaOperativa,
                    SO.CentroSuministrador,
                    S.Nombre,
                    SO.Status_Value,
                    CASE
                        WHEN SO.Status_Value = 3 THEN 'Facturado'
                        WHEN SO.Status_Value = 2 THEN 'Entregada de Documentos'
                        WHEN SO.Status_Value = 1 THEN 'Creado'
                        ELSE 'Estado Desconocido'
                    END AS Status_DisplayName,
                    SO.Digitalizado,
                    SO.IsSoftDeleted
                FROM dbo.SalesOrder SO
                LEFT JOIN dbo.Sitio S ON S.OficinaVenta = SO.OficinaVenta
                WHERE SO.ReferenciaOperativa = @referencia
            `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en aduanaPorReferencia:", error);
        return res.status(500).json({ Message: "Error al obtener datos de aduana", Error: error.message });
    }
});

app.post('/componentePorReferencias', requirePermission('cfo', 'cambio'), async (req, res) => {
    try {
        const { referencias } = req.body;
        const lista = Array.isArray(referencias)
            ? referencias.map((r) => String(r).trim()).filter(Boolean)
            : [];

        if (lista.length === 0) {
            return res.status(400).json({ Message: "Debe indicar al menos una Referencia Operativa." });
        }

        const pool = await conexion(BasesDeDatos.CfoNetCore);
        const request = pool.request();
        const parametros = lista.map((valor, i) => {
            const nombre = `ref${i}`;
            request.input(nombre, sql.VarChar, valor);
            return `@${nombre}`;
        });

        const resultado = await request.query(`
            SELECT
                SO.ReferenciaOperativa,
                SD.id AS SalesOrderDetalleId,
                C.ID AS Componente_ID,
                C.Descripcion,
                SO.CentroSuministrador,
                SO.OficinaVenta,
                SO.IsSoftDeleted
            FROM [dbo].[SalesOrderDetalle] SD
            LEFT JOIN [dbo].[SalesOrder] SO ON SO.id = SD.salesOrderId
            LEFT JOIN [dbo].[Componente] C ON C.ID = SD.ComponenteID
            WHERE SO.ReferenciaOperativa IN (${parametros.join(", ")})
              AND SO.IsSoftDeleted = 0
        `);

        return res.json(resultado.recordset);

    } catch (error) {
        console.error("Error en componentePorReferencias:", error);
        return res.status(500).json({ Message: "Error al obtener componentes", Error: error.message });
    }
});

app.post('/actualizarComponente', requirePermission('cfo', 'cambio'), async (req, res) => {
    try {
        const { SalesOrderDetalleId, ComponenteId, OficinaVenta, CentroSuministrador, ModifiedBy, Observacion } = req.body;

        if (!SalesOrderDetalleId) {
            return res.status(400).json({ Message: "El detalle del Sales Order (SalesOrderDetalleId) es requerido." });
        }
        if (!ComponenteId) {
            return res.status(400).json({ Message: "Debe seleccionar el nuevo componente." });
        }
        if (!ModifiedBy) {
            return res.status(400).json({ Message: "El usuario que autoriza (ModifiedBy) es requerido." });
        }
        if (!Observacion || !Observacion.trim()) {
            return res.status(400).json({ Message: "Debe indicar el motivo del cambio." });
        }

        const resp = await fetch("https://cfows.azurewebsites.net/api/SalesOrder/UpdateComponenteList", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ModifiedBy,
                Observacion: Observacion.trim(),
                List: [
                    { SalesOrderDetalleId, ComponenteId, OficinaVenta, CentroSuministrador }
                ]
            })
        });

        if (!resp.ok) {
            const errData = await resp.text();
            console.error(`SalesOrder/UpdateComponenteList → HTTP ${resp.status}:`, errData);
            return res.status(resp.status).json({ Message: "Error al comunicarse con el servicio externo", Detail: errData });
        }

        const data = await resp.json().catch(() => null);
        console.log(`SalesOrder/UpdateComponenteList → ${SalesOrderDetalleId}:`, JSON.stringify(data));

        if (data?.IsValid === false) {
            return res.status(400).json({ Message: mensajeDeAzure(data) || "Azure rechazó la solicitud." });
        }

        return res.status(200).json({ Message: "Componente actualizado con éxito", Data: data });

    } catch (error) {
        console.error("Error en actualizarComponente:", error);
        return res.status(500).json({ Message: "Error interno del servidor", Error: error.message });
    }
});

export default app;