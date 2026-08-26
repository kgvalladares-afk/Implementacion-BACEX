import express from 'express'
import cors from 'cors'
const app = express()
const port = 3000
import cfoRoutes from './routes/Cfo.routes.js'
import hrRoutes from './routes/Hr.routes.js'
import authRoutes from './routes/Auth.routes.js'
import 'dotenv/config'

app.use(express.json()); //para que acepte jsons

app.use(cors({
    // Vite toma el primer puerto libre (5173, 5174, 5175...), así que aceptamos cualquier puerto local en dev.
    origin: (origin, callback) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Origen no permitido por CORS"));
        }
    },
    credentials: true
}))

app.use('/api/auth', authRoutes);
app.use('/api', cfoRoutes);
app.use('/api', hrRoutes);

app.listen(port, () => {
    console.log(`servidor corriendo ${port}`)
})