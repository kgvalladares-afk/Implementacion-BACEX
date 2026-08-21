import Matriz, { meta as matrizMeta } from "./Matriz.jsx";

export const label = "Análisis de Red";
export const icon = "🔗";

export const modules = {
  matriz: { ...matrizMeta, Component: Matriz },
};
