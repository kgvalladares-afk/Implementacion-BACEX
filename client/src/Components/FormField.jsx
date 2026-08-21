export default function FormField({ field, value, onChange, disabled }) {
  if (field.type === "select") {
    return (
      <div className="field">
        <label>{field.label}</label>
        <select value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled}>
          <option value="">Seleccionar...</option>
          {field.options.map((o) => {
            const isObj = typeof o === "object";
            const val = isObj ? o.id : o;
            const lbl = isObj ? o.name : o;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="field">
        <label>{field.label}</label>
        <textarea placeholder={field.placeholder} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} rows={5} />
      </div>
    );
  }
  return (
    <div className="field">
      <label>{field.label}</label>
      <input type={field.type} placeholder={field.placeholder} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} />
    </div>
  );
}
