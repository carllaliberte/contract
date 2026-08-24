import {
  ArrowRight,
  Clapperboard,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { Logo } from "../components/ui";
import { useI18n } from "../i18n/context";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "nav.dashboard", end: true },
  { to: "/app/pipeline", icon: Clapperboard, label: "nav.pipeline" },
  { to: "/app/contenus", icon: FileText, label: "nav.contents" },
  { to: "/app/parametres", icon: Settings, label: "nav.settings" },
];

const statusIcons = {
  idea: Lightbulb,
  script: FileText,
  production: Clapperboard,
  ready: Sparkles,
  published: Radio,
};

export function AppLayout() {
  const { tr } = useI18n();
  const navigate = useNavigate();

  function exitDemo() {
    localStorage.removeItem("cf-demo");
    navigate("/");
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {tr("demo.badge")}
          </span>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={exitDemo}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{tr("demo.exit")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                <Icon className="size-4" />
                {tr(label)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          <Outlet context={{ statusIcons }} />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="size-5" />
              {tr(label)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export { ArrowRight };
