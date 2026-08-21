import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Arrival Date",
  icon: "🛬",
  desc: "Actualización de fecha de arribo / llegada",
  kind: "primary",
};

const fields = [
  { id: "operacion_id", label: "ID Operación / Embarque", type: "text", placeholder: "EMB-2026-00" },
  { id: "arrival_date_val", label: "Nueva Fecha de Arribo", type: "date" }
];

export default function ArrivalDate() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Guardar Arrival Date"
      kind={meta.kind}
    />
  );
}
