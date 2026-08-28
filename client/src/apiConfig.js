// Backend propio (server/), que valida en SQL Server y solo entonces llama a la API externa de Azure.
// En dev, cliente (Vite) y servidor corren en puertos distintos, así que se apunta directo a localhost.
// En producción, el servidor sirve también el build del cliente desde el mismo origen, así que
// una ruta relativa funciona sin importar el dominio donde quede desplegado.
export const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";
