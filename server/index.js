import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
const app = express()
const port = process.env.PORT || 3000
import cfoRoutes from './routes/Cfo.routes.js'
import hrRoutes from './routes/Hr.routes.js'
import analisisRoutes from './routes/Analisis.routes.js'
import seguimientoRoutes from './routes/Seguimiento.routes.js'
import authRoutes from './routes/Auth.routes.js'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clienteDist = path.join(__dirname, '../client/dist')

app.use(express.json()); //para que acepte jsons

// El check de CORS solo aplica a /api: el cliente y el servidor viven en el mismo origen
// en producción, así que los assets estáticos (JS/CSS) no deben pasar por esta validación
// (el navegador les manda un header Origin por el atributo "crossorigin" del build de Vite,
// y si se aplicara aquí, el checkeo de "solo localhost" los rechazaría con 500 en producción).
// RENDER_EXTERNAL_URL lo define Render automáticamente con la URL pública del servicio.
const origenesPermitidos = [/^http:\/\/localhost:\d+$/];
if (process.env.RENDER_EXTERNAL_URL) origenesPermitidos.push(process.env.RENDER_EXTERNAL_URL);

const corsOptions = cors({
    origin: (origin, callback) => {
        const permitido = !origin || origenesPermitidos.some((o) =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );
        if (permitido) {
            callback(null, true);
        } else {
            callback(new Error("Origen no permitido por CORS"));
        }
    },
    credentials: true
})

app.use('/api/auth', corsOptions, authRoutes);
app.use('/api', corsOptions, cfoRoutes);
app.use('/api', corsOptions, hrRoutes);
app.use('/api', corsOptions, analisisRoutes);
app.use('/api', corsOptions, seguimientoRoutes);

// En producción, el mismo servidor sirve el build del cliente (client/dist), evitando
// tener que desplegar y configurar dos servicios/dominios separados.
app.use(express.static(clienteDist));
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clienteDist, 'index.html'));
});

app.listen(port, () => {
    console.log(`servidor corriendo ${port}`)
})