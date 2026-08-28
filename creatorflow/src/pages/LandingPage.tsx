import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { AppleSignInButton } from "../components/AppleSignInButton";
import { Button, Logo } from "../components/ui";
import { useI18n } from "../i18n/context";
import { useAuth } from "../hooks/useAuth";
import { applyLandingRobots, setFaqJsonLd } from "../lib/seo";

const faqItems = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
] as const;

export function LandingPage() {
  const { tr, locale } = useI18n();
  const navigate = useNavigate();
  const { enterDemo } = useAuth();

  useEffect(() => {
    applyLandingRobots();
    setFaqJsonLd(
      faqItems.map((item) => ({
        question: tr(item.q),
        answer: tr(item.a),
      })),
    );
  }, [locale, tr]);

  async function handleEnterDemo() {
    await enterDemo();
    navigate("/app");
  }

  const exploreLabel =
    locale === "fr" ? "Explorez les scripts Clapshot" : "Explore Clapshot scripts";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 login-wash" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 safe-top safe-x sm:px-6">
        <Logo />
        <LanguageSelector />
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center px-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_380px] lg:gap-16 lg:pb-20 lg:pt-6">
          <div className="flex min-h-[100dvh] flex-col justify-center lg:min-h-0">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="rec-dot" />
              {locale === "fr" ? "Le booth" : "The booth"}
            </p>
            <h1 className="font-display text-[2.75rem] font-medium italic leading-[1.04] tracking-tight sm:text-6xl sm:leading-[1.02] lg:text-7xl">
              {tr("app.heroTitle")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {exploreLabel}. {locale === "fr" ? "Une idée, un tap, tu tournes." : "One idea, one tap, you film."}
            </p>
            <div className="mt-10">
              <Button
                className="h-14 px-8 text-base sm:h-16 sm:px-10 sm:text-lg"
                onClick={() => void handleEnterDemo()}
              >
                {exploreLabel}
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>

          <div id="login" className="flex justify-center pb-16 lg:justify-end lg:pb-0">
            <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur-sm sm:p-7">
              <p className="text-sm font-medium">{tr("login.welcomeBack")}</p>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                {tr("login.providersHintIos")}
              </p>
              <div className="flex flex-col gap-2">
                <AppleSignInButton onSuccess={() => navigate("/app")} />
                <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
                  {tr("login.tryDemo")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 text-sm text-muted-foreground sm:px-6">
          <Logo size="sm" />
          <span>{tr("footer.rights")}</span>
        </div>
      </footer>
    </div>
  );
}
