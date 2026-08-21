import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Internal Reference Incorrecto",
  icon: "🏷️",
  desc: "Modificación de referencia interna asociativa",
  kind: "primary",
};

const fields = [
  { id: "ref_actual", label: "Referencia Interna Actual", type: "text", placeholder: "REF-0000" },
  { id: "ref_nueva", label: "Referencia Interna Correcta", type: "text", placeholder: "REF-0000" }
];

export default function InternalRefIncorrecto() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Actualizar Referencia"
      kind={meta.kind}
    />
  );
}
