import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
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

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 login-wash" />
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 safe-top safe-x sm:px-6">
        <Logo />
        <LanguageSelector />
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center px-5 pb-24 safe-x sm:px-6">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {tr("booth.kicker")}
          </p>
          <h1 className="mt-5 font-sans text-6xl font-extrabold leading-[0.9] tracking-[-0.06em] text-balance sm:text-8xl">
            {tr("app.name")}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-xl font-semibold tracking-tight text-pretty sm:text-3xl">
            {tr("app.heroTitle")}
          </p>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            {tr("app.lead")}
          </p>
          <Button
            className="mt-10 h-14 w-full max-w-sm rounded-full bg-foreground px-6 text-base font-semibold text-background hover:bg-foreground/90"
            onClick={() => void handleEnterDemo()}
          >
            {tr("login.start")}
          </Button>
        </div>
      </main>
    </div>
  );
}
