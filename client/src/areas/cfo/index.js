import Negociaciones, { meta as negociacionesMeta } from "./Negociaciones.jsx";
import CambioComponente, { meta as cambioMeta } from "./CambioComponente.jsx";
import SalesOrder, { meta as salesorderMeta } from "./SalesOrder.jsx";
import HabilitarDocumento, { meta as habDocMeta } from "./HabilitarDocumento.jsx";
import EliminarContraRecibo, { meta as contrareciboMeta } from "./EliminarContraRecibo.jsx";
import EliminarDocumento, { meta as elimDocMeta } from "./EliminarDocumento.jsx";

export const label = "CFO / Finanzas";
export const icon = "📊";

export const modules = {
  negociaciones: { ...negociacionesMeta, Component: Negociaciones },
  cambio: { ...cambioMeta, Component: CambioComponente },
  salesorder: { ...salesorderMeta, Component: SalesOrder },
  habDoc: { ...habDocMeta, Component: HabilitarDocumento },
  contrarecibo: { ...contrareciboMeta, Component: EliminarContraRecibo },
  elimDoc: { ...elimDocMeta, Component: EliminarDocumento },
};
