import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "./i18n/context";
import { AppLayout } from "./pages/AppLayout";
import { ContentsPage } from "./pages/ContentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { PipelinePage } from "./pages/PipelinePage";
import { SettingsPage } from "./pages/SettingsPage";

function DemoGuard({ children }: { children: React.ReactNode }) {
  const isDemo = localStorage.getItem("cf-demo") === "1";
  if (!isDemo) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/app"
            element={
              <DemoGuard>
                <AppLayout />
              </DemoGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="contenus" element={<ContentsPage />} />
            <Route path="parametres" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
