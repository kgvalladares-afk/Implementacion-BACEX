import { useState } from "react";
import FormField from "./FormField.jsx";
import { useToast } from "./Toast.jsx";

// Formulario genérico: campos + botón de envío que valida al menos un campo lleno.
// Cubre los módulos que no necesitan búsqueda ni tabla de resultados.
export default function SimpleFormModule({ title, desc, fields, action, kind }) {
  const [formValues, setFormValues] = useState({});
  const showToast = useToast();

  const handleFieldChange = (id, val) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = () => {
    if (!fields?.some((f) => formValues[f.id]?.trim())) {
      showToast("Completa al menos un campo", "warn");
      return;
    }
    showToast(`${title} procesado correctamente`, "ok");
    setFormValues({});
  };

  return (
    <div className="form-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
      <div className="form-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1a1f36" }}>{title}</div>
      <div className="form-sub" style={{ color: "#697386", marginBottom: "20px" }}>{desc}</div>

      {fields?.map((f) => (
        <FormField key={f.id} field={f} value={formValues[f.id]} onChange={handleFieldChange} />
      ))}

      <button
        className={`btn ${kind === "danger" ? "danger" : "primary"}`}
        onClick={handleSubmit}
        style={{ marginTop: "15px" }}
      >
        {action}
      </button>
    </div>
  );
}
