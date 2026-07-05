import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="panel" style={{ padding: 32, textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>
        SIGNAL LOST — 404
      </div>
      <p>That lesson channel doesn't exist.</p>
      <Link className="btn btn--primary" to="/">
        BACK TO DASHBOARD
      </Link>
    </div>
  );
}
