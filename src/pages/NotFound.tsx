import { Link } from "react-router-dom";
import { useUI } from "../lib/i18n";

export function NotFound() {
  const ui = useUI();
  return (
    <div className="panel" style={{ padding: 32, textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>
        SIGNAL LOST — 404
      </div>
      <p>{ui.notFoundMsg}</p>
      <Link className="btn btn--primary" to="/">
        {ui.backToDashboard}
      </Link>
    </div>
  );
}
