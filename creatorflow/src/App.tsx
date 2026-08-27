import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { IdeasProvider } from "./context/IdeasContext";
import { useAuth } from "./hooks/useAuth";
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
const CalendarPage = lazy(() =>
  import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const AppleAuthCallbackPage = lazy(() =>
  import("./pages/AppleAuthCallbackPage").then((m) => ({ default: m.AppleAuthCallbackPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ShootModePage = lazy(() =>
  import("./pages/ShootModePage").then((m) => ({ default: m.ShootModePage })),
);

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { isAppAllowed, isLoading } = useAuth();
  if (isLoading) return <AppRouteFallback />;
  if (!isAppAllowed) return <Navigate to="/" replace />;
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
            path="/auth/apple"
            element={
              <Suspense fallback={<AppRouteFallback />}>
                <AppleAuthCallbackPage />
              </Suspense>
            }
          />
          <Route
            path="/app"
            element={
              <SessionGuard>
                <IdeasProvider>
                  <AppLayout />
                </IdeasProvider>
              </SessionGuard>
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
              path="calendrier"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <CalendarPage />
                </Suspense>
              }
            />
            <Route
              path="shoot/:ideaId"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <ShootModePage />
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
