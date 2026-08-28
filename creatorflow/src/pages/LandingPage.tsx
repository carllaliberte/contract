import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { Button } from "../components/ui";
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
    <div className="min-h-dvh overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 login-wash" />
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 safe-top safe-x sm:px-6">
        <span className="text-lg font-semibold tracking-tight">clapshot</span>
        <LanguageSelector />
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center px-5 pb-24 safe-x sm:px-6">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="font-sans text-6xl font-semibold leading-[0.9] tracking-[-0.06em] text-white sm:text-8xl">
            clapshot
          </h1>
          <p className="mt-6 text-lg font-medium tracking-tight text-white/80 sm:text-2xl">
            {locale === "fr"
              ? "là où les idées deviennent des Reels."
              : "where ideas become Reels."}
          </p>
          <Button
            className="mt-10 h-14 w-full max-w-sm rounded-full bg-white px-6 text-base font-semibold text-black hover:bg-white/90"
            onClick={() => void handleEnterDemo()}
          >
            {exploreLabel}
          </Button>
        </div>
      </main>
    </div>
  );
}
