import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Cambio de Componente",
  icon: "🔄",
  desc: "Solicitud de cambio en componentes del sistema",
  kind: "primary",
};

const fields = [
  { id: "comp_actual", label: "Componente actual", type: "text", placeholder: "Nombre del componente" },
  { id: "comp_nuevo", label: "Componente nuevo", type: "text", placeholder: "Nombre del reemplazo" },
  { id: "motivo", label: "Motivo del cambio", type: "select", options: ["Obsolescencia", "Error", "Optimización", "Requerimiento nuevo"] },
  { id: "prioridad", label: "Prioridad", type: "select", options: ["Alta", "Media", "Baja"] },
  { id: "responsable", label: "Responsable", type: "text", placeholder: "Nombre del responsable" },
  { id: "desc_cambio", label: "Descripción", type: "textarea", placeholder: "Detalle del cambio solicitado..." },
];

export default function CambioComponente() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Solicitar cambio"
      kind={meta.kind}
    />
  );
}
