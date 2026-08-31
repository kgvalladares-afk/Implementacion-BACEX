import { useEffect, useState } from "react";
import { apiFetch } from "../../apiClient.js";

// El "Autorizado por" ya no se elige de una lista de todas las personas: se resuelve
// al usuario que inició sesión (contra la tabla de Autorizadores que administra el
// panel de Administración), para que quede registrado quién realmente autorizó la
// acción y no se pueda seleccionar a alguien más.
export function useAutorizadorActual() {
  const [autorizador, setAutorizador] = useState(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const response = await apiFetch("/auth/autorizador-actual");
        const data = await response.json().catch(() => null);
        if (!cancelado && response.ok && data) {
          setAutorizador({ id: data.externalId, name: data.nombre, correo: data.correo || null });
        }
      } catch {
        // Si falla, autorizador queda en null y las pantallas muestran el aviso correspondiente.
      }
    })();
    return () => { cancelado = true; };
  }, []);

  return autorizador;
}
