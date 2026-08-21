import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Purchase Order Incorrecto",
  icon: "📝",
  desc: "Corrección de Purchase Order asignada erróneamente",
  kind: "primary",
};

const fields = [
  { id: "po_num", label: "N° Purchase Order Actual", type: "text", placeholder: "PO-000000" },
  { id: "po_nuevo", label: "N° Purchase Order Correcto", type: "text", placeholder: "PO-000000" },
  { id: "motivo_po", label: "Motivo / Justificación", type: "textarea", placeholder: "Detalle la corrección..." }
];

export default function PurchaseOrderIncorrecto() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Corregir Purchase Order"
      kind={meta.kind}
    />
  );
}
