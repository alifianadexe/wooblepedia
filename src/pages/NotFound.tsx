import { Link } from "react-router-dom";
import { useUI } from "../lib/i18n";

export function NotFound() {
  const ui = useUI();
  return (
    <div className="panel" style={{ padding: 40, textAlign: "center" }}>
      <div className="uppercase-label" style={{ fontSize: 12, color: "var(--red)", marginBottom: 14 }}>
        SIGNAL LOST — 404
      </div>
      <p style={{ color: "var(--text-secondary)" }}>{ui.notFoundMsg}</p>
      <Link className="btn btn--primary" to="/" style={{ display: "inline-block", marginTop: 8 }}>
        {ui.backToDashboard}
      </Link>
    </div>
  );
}
