import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Clearance Date",
  icon: "🛃",
  desc: "Actualización de fecha de desaduanaje / clearance",
  kind: "primary",
};

const fields = [
  { id: "operacion_id_c", label: "ID Operación / Embarque", type: "text", placeholder: "EMB-2026-00" },
  { id: "clearance_date_val", label: "Nueva Fecha Clearance", type: "date" }
];

export default function ClearanceDate() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Guardar Clearance Date"
      kind={meta.kind}
    />
  );
}
