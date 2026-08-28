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
    <div className="min-h-dvh bg-black text-white">
      <div className="pointer-events-none fixed inset-0 login-wash" />
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 70% 10%, rgba(80,140,255,0.18), transparent 55%), radial-gradient(circle at 20% 80%, rgba(255,59,48,0.12), transparent 40%)",
        }}
      />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 safe-top safe-x sm:px-6">
        <span className="text-lg font-semibold tracking-tight">clapshot</span>
        <LanguageSelector />
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center px-5 pb-16 safe-x sm:px-6">
        <div className="mx-auto w-full max-w-5xl text-center">
          <h1 className="font-sans text-[18vw] font-semibold leading-[0.82] tracking-[-0.06em] text-white sm:text-[9rem]">
            clapshot
          </h1>
          <p className="mt-6 text-xl font-medium tracking-tight text-white/80 sm:text-3xl">
            {locale === "fr"
              ? "là où les idées deviennent des Reels."
              : "where ideas become Reels."}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/50">
            {exploreLabel}. {locale === "fr" ? "Un tap. Tu tournes." : "One tap. You film."}
          </p>
          <Button
            className="mt-10 h-14 w-full max-w-sm rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90 sm:h-16"
            onClick={() => void handleEnterDemo()}
          >
            {exploreLabel}
          </Button>
        </div>
      </main>
    </div>
  );
}
