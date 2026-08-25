import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { IdeasProvider } from "./context/IdeasContext";
import { I18nProvider } from "./i18n/context";
import { ROUTER_BASENAME } from "./lib/router";
import { AppLayout } from "./pages/AppLayout";
import { LandingPage } from "./pages/LandingPage";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const PipelinePage = lazy(() =>
  import("./pages/PipelinePage").then((m) => ({ default: m.PipelinePage })),
);
const ContentsPage = lazy(() =>
  import("./pages/ContentsPage").then((m) => ({ default: m.ContentsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

function DemoGuard({ children }: { children: React.ReactNode }) {
  const isDemo = localStorage.getItem("cf-demo") === "1";
  if (!isDemo) return <Navigate to="/" replace />;
  return children;
}

function AppRouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/app"
            element={
              <DemoGuard>
                <IdeasProvider>
                  <AppLayout />
                </IdeasProvider>
              </DemoGuard>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="pipeline"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <PipelinePage />
                </Suspense>
              }
            />
            <Route
              path="contenus"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <ContentsPage />
                </Suspense>
              }
            />
            <Route
              path="parametres"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
