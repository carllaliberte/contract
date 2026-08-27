import {
  ArrowRight,
  Clapperboard,
  FileText,
  Globe,
  LayoutDashboard,
  Lightbulb,
  Play,
  Sparkles,
  Zap,
  Code2,
  Server,
  Terminal,
  Github,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { AppleSignInButton } from "../components/AppleSignInButton";
import { Button, Input, Label, Logo } from "../components/ui";
import {
  demoVideoPoster,
  demoVideoUrl,
  exampleGallery,
} from "../data/demo";
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

const devCards = [
  { titleKey: "dev.stack.title", bodyKey: "dev.stack.body", icon: Code2 },
  { titleKey: "dev.api.title", bodyKey: "dev.api.body", icon: Server },
  { titleKey: "dev.demo.title", bodyKey: "dev.demo.body", icon: Terminal },
  { titleKey: "dev.build.title", bodyKey: "dev.build.body", icon: Zap },
] as const;

const GITHUB_REPO_URL = "https://github.com/carllaliberte/contract";

const pipelineSteps = [
  { key: "idea", icon: Lightbulb, color: "text-status-idea", bg: "bg-status-idea/15" },
  { key: "script", icon: FileText, color: "text-status-script", bg: "bg-status-script/15" },
  { key: "production", icon: Clapperboard, color: "text-status-production", bg: "bg-status-production/15" },
  { key: "ready", icon: Sparkles, color: "text-status-ready", bg: "bg-status-ready/15" },
  { key: "published", icon: ArrowRight, color: "text-status-published", bg: "bg-status-published/15" },
] as const;

const features = [
  {
    icon: Clapperboard,
    titleKey: "features.pipeline.title",
    descKey: "features.pipeline.desc",
  },
  {
    icon: Sparkles,
    titleKey: "features.script.title",
    descKey: "features.script.desc",
  },
  {
    icon: LayoutDashboard,
    titleKey: "features.dashboard.title",
    descKey: "features.dashboard.desc",
  },
  {
    icon: Globe,
    titleKey: "features.locale.title",
    descKey: "features.locale.desc",
  },
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

  const loginCard = (
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
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {tr("login.continueGoogle")}
            </Button>
            <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {tr("login.continueX")}
            </Button>
            <Button variant="outline" type="button" className="h-11" onClick={() => void handleEnterDemo()}>
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
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
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
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
  );

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

          <div
            id="login"
            className="flex justify-center pb-16 lg:justify-end lg:pb-0"
          >
            {loginCard}
          </div>
        </section>

        <section id="pipeline" className="border-t border-border bg-card/25 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {tr("pipeline.title")}
              </h2>
              <p className="mt-3 text-muted-foreground sm:text-lg">
                {tr("pipeline.subtitle")}
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
              {pipelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex w-[110px] flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:w-[130px]">
                      <span className={`grid size-11 place-items-center rounded-xl ${step.bg}`}>
                        <Icon className={`size-5 ${step.color}`} />
                      </span>
                      <span className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {tr(`status.${step.key}`)}
                      </span>
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground/40 sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="audience" className="border-t border-border bg-card/25 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {tr("audience.title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {tr("audience.body")}
            </p>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {tr("features.title")}
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.titleKey}
                    className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{tr(f.titleKey)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {tr(f.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="examples" className="border-t border-border bg-card/25 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {tr("showcase.title")}
              </h2>
              <p className="mt-3 text-muted-foreground sm:text-lg">
                {tr("showcase.subtitle")}
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="relative aspect-video bg-black">
                <video
                  className="size-full object-cover"
                  controls
                  playsInline
                  poster={demoVideoPoster}
                  preload="metadata"
                >
                  <source src={demoVideoUrl} type="video/mp4" />
                </video>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border px-5 py-3.5">
                <Play className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{tr("showcase.videoTitle")}</p>
                  <p className="text-xs text-muted-foreground">{tr("showcase.videoCaption")}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {exampleGallery.map((item) => (
                <div
                  key={item.title}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-card"
                >
                  <div className={`overflow-hidden ${item.aspect}`}>
                    <img
                      src={item.src}
                      alt={item.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.platform}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="border-t border-border bg-card/25 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {tr("why.title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {tr("why.body")}
            </p>
          </div>
        </section>

        <section id="dev" className="border-t border-border bg-card/25 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {tr("dev.title")}
              </h2>
              <p className="mt-3 text-muted-foreground sm:text-lg">{tr("dev.subtitle")}</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {devCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.titleKey}
                    className="rounded-2xl border border-border bg-card p-6 shadow-card"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{tr(card.titleKey)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {tr(card.bodyKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              {tr("faq.title")}
            </h2>
            <dl className="mt-10 space-y-6">
              {faqItems.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
                >
                  <dt className="text-base font-semibold">{tr(item.q)}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tr(item.a)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {tr("cta.title")}
            </h2>
            <p className="mt-4 text-muted-foreground sm:text-lg">
              {tr("cta.subtitle")}
            </p>
            <Button className="mt-8 h-14 px-8 text-base" onClick={() => void handleEnterDemo()}>
              {tr("login.start")}
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo size="sm" />
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <a href="#dev" className="transition-colors hover:text-foreground">
              {tr("dev.footerLink")}
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="size-3.5" />
              {tr("nav.github")}
            </a>
          </nav>
          <p>{tr("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
