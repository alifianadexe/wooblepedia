import { Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { Home } from "./pages/Home";
import { LessonPage } from "./pages/LessonPage";
import { NotFound } from "./pages/NotFound";
import { LanguageProvider } from "./lib/i18n";
import { ThemeProvider, useTheme } from "./lib/themeMode";

function AppShell() {
  // Keyed by theme: lesson labs read colors.* (from lib/theme.ts) directly
  // into SVG/canvas fills at render/draw time rather than via CSS vars, so
  // toggling light/dark needs a full remount of the routed content to
  // guarantee every diagram redraws with the new palette.
  const { theme } = useTheme();
  return (
    <LanguageProvider>
      <SiteHeader />
      <main className="site-main">
        <div className="container" key={theme}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/m1/:slug" element={<LessonPage moduleId={1} />} />
            <Route path="/m2/:slug" element={<LessonPage moduleId={2} />} />
            <Route path="/m3/:slug" element={<LessonPage moduleId={3} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
