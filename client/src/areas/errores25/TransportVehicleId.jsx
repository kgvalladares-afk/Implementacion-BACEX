import SimpleFormModule from "../../components/SimpleFormModule.jsx";

export const meta = {
  label: "Transport/Vehicle ID",
  icon: "🚛",
  desc: "Asignación o corrección de ID del vehículo o unidad de transporte",
  kind: "primary",
};

const fields = [
  { id: "operacion_id_v", label: "ID Operación / Contenedor", type: "text", placeholder: "CONT-2026-00" },
  { id: "vehicle_id", label: "ID Vehículo / Transporte", type: "text", placeholder: "TRK-9988-HN" }
];

export default function TransportVehicleId() {
  return (
    <SimpleFormModule
      title={meta.label}
      desc={meta.desc}
      fields={fields}
      action="Asignar Transporte"
      kind={meta.kind}
    />
  );
}
