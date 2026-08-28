import { Clapperboard, LogOut, Settings } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { Logo } from "../components/ui";
import { useI18n } from "../i18n/context";
import { useAuth } from "../hooks/useAuth";
import { applyAppRobots, applyLandingRobots } from "../lib/seo";

export function AppLayout() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    {
      to: "/app",
      icon: Clapperboard,
      label: tr("nav.dashboard"),
      end: true,
    },
    {
      to: "/app/parametres",
      icon: Settings,
      label: tr("nav.settings"),
      end: false,
    },
  ];

  useEffect(() => {
    applyAppRobots();
    return () => applyLandingRobots();
  }, []);

  async function exitApp() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md safe-top safe-x">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Logo size="sm" />
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => void exitApp()}
              className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={tr("demo.exit")}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 safe-x sm:px-6 lg:py-8">
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
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-[calc(6rem+var(--safe-bottom))] lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md safe-x lg:hidden">
        <div className="grid grid-cols-2">
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
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
