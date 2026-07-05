/** Small reusable input primitives shared by the interactive labs. */

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="control" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: "var(--cyan)" }}
      />
      <span className="uppercase-label">{label}</span>
    </label>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="control">
      {label && (
        <div className="control__label">
          <span>{label}</span>
        </div>
      )}
      <div className="btn-row" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`btn ${opt.value === value ? "btn--primary" : ""}`}
            aria-pressed={opt.value === value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Readout({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="control" style={{ marginBottom: 0 }}>
      <div className="control__label">
        <span>{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: accent ?? "var(--cyan)" }}>
        {value}
      </div>
    </div>
  );
}
