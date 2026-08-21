import * as cfo from "./cfo/index.js";
import * as red from "./red/index.js";
import * as errores25 from "./errores25/index.js";

// Agrupamos los módulos por Áreas Globales (CFO, RED, ERRORES25)
export const areas = {
  cfo: { label: cfo.label, icon: cfo.icon, modules: cfo.modules },
  red: { label: red.label, icon: red.icon, modules: red.modules },
  errores25: { label: errores25.label, icon: errores25.icon, modules: errores25.modules },
};
