import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";
import { runMathSanityChecks } from "./lib/math";
import { applyStoredFontScale } from "./lib/fontScale";
import { applyStoredTheme } from "./lib/themeMode";

if (import.meta.env.DEV) {
  runMathSanityChecks();
}

// Apply the reader's saved font scale and light/dark mode before first paint to avoid a flash.
applyStoredFontScale();
applyStoredTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
