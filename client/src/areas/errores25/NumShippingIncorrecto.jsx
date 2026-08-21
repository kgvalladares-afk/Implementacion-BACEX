import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Number of Shipping Document Incorrecto",
  icon: "📦",
  desc: "Corrección de número identificador del documento de envío",
  kind: "primary",
};

const fields = [
  { id: "ship_num_actual", label: "N° Documento Envío Actual", type: "text", placeholder: "SD-OLD-000" },
  { id: "ship_num_nuevo", label: "N° Documento Envío Nuevo", type: "text", placeholder: "SD-NEW-000" }
];

export default function NumShippingIncorrecto() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Actualizar Número Shipping"
      kind={meta.kind}
    />
  );
}
