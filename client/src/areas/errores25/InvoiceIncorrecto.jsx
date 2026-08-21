import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Invoice Incorrecto",
  icon: "🧾",
  desc: "Ajuste o corrección de Factura / Invoice",
  kind: "primary",
};

const fields = [
  { id: "inv_num", label: "N° Invoice Actual", type: "text", placeholder: "INV-000000" },
  { id: "inv_nuevo", label: "N° Invoice Correcto", type: "text", placeholder: "INV-000000" },
  { id: "observaciones", label: "Observaciones", type: "textarea", placeholder: "Notas adicionales..." }
];

export default function InvoiceIncorrecto() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Corregir Invoice"
      kind={meta.kind}
    />
  );
}
