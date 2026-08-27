import sql from 'mssql'

const pools = {}; // diccionario de pools por DB

export async function conexion(databaseName) {
    if (pools[databaseName]) {
        return pools[databaseName];
    }
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: databaseName,
        server: process.env.DB_SERVER,
        options: {
            encrypt: true,
            trustServerCertificate: true
        },
        // Las consultas de Validación de Sello (Seguimiento) hacen varios JOIN + CROSS APPLY
        // sobre tablas grandes y pueden tardar más de los 15s por defecto de mssql.
        requestTimeout: 60000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };

    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        pools[databaseName] = pool;
        return pool;
    } catch (err) {
        throw err;
    }
}

export let BasesDeDatos = {
    CfoNetCore: 'CfoNetCore',
    AnalisisDeRed: 'AnalisisDeRed',
    Personas: 'Personas',
    HojaDeRuta: 'HojaDeRuta',
    Seguimiento: 'Seguimiento'
}