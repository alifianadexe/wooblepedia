import { Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { Home } from "./pages/Home";
import { LessonPage } from "./pages/LessonPage";
import { NotFound } from "./pages/NotFound";
import { LanguageProvider } from "./lib/i18n";

export default function App() {
  return (
    <LanguageProvider>
      <SiteHeader />
      <main className="site-main">
        <div className="container">
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
