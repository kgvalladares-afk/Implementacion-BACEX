import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Negociaciones",
  icon: "💼",
  desc: "Registro y seguimiento de negociaciones",
  kind: "primary",
};

const fields = [
  { id: "n_id", label: "N° Negociación", type: "text", placeholder: "NEG-2026-001" },
  { id: "proveedor", label: "Proveedor", type: "text", placeholder: "Nombre del proveedor" },
  { id: "monto", label: "Monto", type: "text", placeholder: "0.00" },
  { id: "moneda", label: "Moneda", type: "select", options: ["HNL", "USD", "EUR"] },
  { id: "estado", label: "Estado", type: "select", options: ["En proceso", "Aprobada", "Rechazada", "Pendiente"] },
  { id: "fecha", label: "Fecha", type: "date" },
  { id: "notas", label: "Notas", type: "textarea", placeholder: "Observaciones adicionales..." },
];

export default function Negociaciones() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Guardar negociación"
      kind={meta.kind}
    />
  );
}
