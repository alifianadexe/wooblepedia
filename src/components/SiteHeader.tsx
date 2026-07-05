import { Link } from "react-router-dom";
import { HeaderProgress } from "./HeaderProgress";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/">
          WOOBLEPEDIA
        </Link>
        <HeaderProgress />
      </div>
    </header>
  );
}
