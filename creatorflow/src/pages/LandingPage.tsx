import { ArrowRight, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { AppleSignInButton } from "../components/AppleSignInButton";
import { Button, Input, Label, Logo } from "../components/ui";
import { useI18n } from "../i18n/context";
import { useAuth } from "../hooks/useAuth";
import { applyLandingRobots, setFaqJsonLd } from "../lib/seo";
import { isNativePlatform } from "../lib/platform";

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
  const native = isNativePlatform();
  const [authTab, setAuthTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

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

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    void handleEnterDemo();
  }

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
            <h1 className="text-[2.6rem] font-extrabold leading-[1.06] tracking-tight sm:text-6xl sm:leading-[1.02] lg:text-7xl">
              {tr("app.heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tr("app.lead")}
            </p>
            <div className="mt-10">
              <Button
                className="h-14 px-8 text-base sm:h-16 sm:px-10 sm:text-lg"
                onClick={() => void handleEnterDemo()}
              >
                {tr("login.start")}
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>

          <div id="login" className="flex justify-center pb-16 lg:justify-end lg:pb-0">
            <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
              <div className="mb-5 flex rounded-xl bg-secondary p-1">
                {(["in", "up"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAuthTab(tab)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      authTab === tab
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tr(tab === "in" ? "login.signIn" : "login.signUp")}
                  </button>
                ))}
              </div>

              <p className="text-sm font-medium">
                {tr(authTab === "in" ? "login.welcomeBack" : "login.createAccount")}
              </p>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                {tr(native ? "login.providersHintIos" : "login.providersHintWeb")}
              </p>

              <div className="flex flex-col gap-2">
                <AppleSignInButton onSuccess={() => navigate("/app")} />
                {!native && (
                  <>
                    <p className="text-[11px] text-muted-foreground">{tr("login.socialDemoNote")}</p>
                    <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
                      {tr("login.continueGoogle")}
                    </Button>
                    <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
                      {tr("login.continueX")}
                    </Button>
                    <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
                      {tr("login.continueGitHub")}
                    </Button>
                  </>
                )}
              </div>

              {!native && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {tr("login.or")}
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
                    {authTab === "up" && (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="name">{tr("login.name")}</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email">{tr("login.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password">{tr("login.password")}</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={authTab === "up" ? "new-password" : "current-password"}
                      />
                    </div>
                    <Button type="submit" className="mt-1 h-11">
                      {tr(authTab === "in" ? "login.submitIn" : "login.submitUp")}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 text-sm text-muted-foreground sm:px-6">
          <Logo size="sm" />
          <a
            href="https://github.com/carllaliberte/contract"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="size-3.5" />
            {tr("nav.github")}
          </a>
        </div>
      </footer>
    </div>
  );
}
