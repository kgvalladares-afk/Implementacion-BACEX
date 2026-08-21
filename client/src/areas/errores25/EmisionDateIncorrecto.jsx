import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Emisión Date of Shipping Document Incorrecto",
  icon: "📅",
  desc: "Corrección de fecha de emisión del documento de envío",
  kind: "primary",
};

const fields = [
  { id: "ship_doc_id", label: "N° Documento de Envío", type: "text", placeholder: "SD-000000" },
  { id: "fecha_correcta", label: "Fecha de Emisión Correcta", type: "date" }
];

export default function EmisionDateIncorrecto() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Actualizar Fecha"
      kind={meta.kind}
    />
  );
}
