import PurchaseOrderIncorrecto, { meta as poMeta } from "./PurchaseOrderIncorrecto.jsx";
import InvoiceIncorrecto, { meta as invoiceMeta } from "./InvoiceIncorrecto.jsx";
import EmisionDateIncorrecto, { meta as emisionMeta } from "./EmisionDateIncorrecto.jsx";
import NumShippingIncorrecto, { meta as numShippingMeta } from "./NumShippingIncorrecto.jsx";
import InternalRefIncorrecto, { meta as internalRefMeta } from "./InternalRefIncorrecto.jsx";
import ArrivalDate, { meta as arrivalMeta } from "./ArrivalDate.jsx";
import ClearanceDate, { meta as clearanceMeta } from "./ClearanceDate.jsx";
import TransportVehicleId, { meta as transportMeta } from "./TransportVehicleId.jsx";

export const label = "Panel Errores 25+";
export const icon = "⚠️";

export const modules = {
  po_incorrecto: { ...poMeta, Component: PurchaseOrderIncorrecto },
  invoice_incorrecto: { ...invoiceMeta, Component: InvoiceIncorrecto },
  emission_date_incorrect: { ...emisionMeta, Component: EmisionDateIncorrecto },
  num_shipping_incorrect: { ...numShippingMeta, Component: NumShippingIncorrecto },
  internal_ref_incorrect: { ...internalRefMeta, Component: InternalRefIncorrecto },
  arrival_date: { ...arrivalMeta, Component: ArrivalDate },
  clearance_date: { ...clearanceMeta, Component: ClearanceDate },
  transport_vehicle_id: { ...transportMeta, Component: TransportVehicleId },
};
