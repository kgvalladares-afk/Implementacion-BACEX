import DocumentSearchModule from "../../components/DocumentSearchModule.jsx";

export const meta = {
  label: "Eliminar ContraRecibo",
  icon: "🗑️",
  desc: "Buscar y eliminar contrarecibos del sistema",
  kind: "danger",
};

export default function EliminarContraRecibo() {
  return <DocumentSearchModule mode="contrarecibo" title={meta.label} desc={meta.desc} />;
}
