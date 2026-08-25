import {
  ArrowRight,
  Calendar,
  Clapperboard,
  FileText,
  Lightbulb,
  Play,
  Sparkles,
  Check,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { Button, Input, Label, Logo } from "../components/ui";
import {
  demoVideoPoster,
  demoVideoUrl,
  exampleGallery,
} from "../data/demo";
import { useI18n } from "../i18n/context";

const pipelineSteps = [
  { key: "idea", icon: Lightbulb, color: "text-status-idea", bg: "bg-status-idea/15" },
  { key: "script", icon: FileText, color: "text-status-script", bg: "bg-status-script/15" },
  { key: "production", icon: Clapperboard, color: "text-status-production", bg: "bg-status-production/15" },
  { key: "ready", icon: Sparkles, color: "text-status-ready", bg: "bg-status-ready/15" },
  { key: "published", icon: ArrowRight, color: "text-status-published", bg: "bg-status-published/15" },
] as const;

const features = [
  {
    icon: Sparkles,
    titleKey: "features.script.title",
    descKey: "features.script.desc",
  },
  {
    icon: Clapperboard,
    titleKey: "features.pipeline.title",
    descKey: "features.pipeline.desc",
  },
  {
    icon: Calendar,
    titleKey: "features.calendar.title",
    descKey: "features.calendar.desc",
  },
] as const;

export function LandingPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [authTab, setAuthTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  function enterDemo() {
    localStorage.setItem("cf-demo", "1");
    navigate("/app");
  }

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    enterDemo();
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 login-wash" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#pipeline" className="transition-colors hover:text-foreground">
            Pipeline
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            {tr("nav.features")}
          </a>
          <a href="#examples" className="transition-colors hover:text-foreground">
            {tr("nav.examples")}
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <Button variant="outline" className="hidden h-10 sm:inline-flex" onClick={enterDemo}>
            {tr("nav.demo")}
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24 lg:pt-10 sm:px-6">
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="size-3.5" />
              Pipeline + Scripts IA · Démo interactive
            </div>

            <h1 className="text-[2.35rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.1]">
              {tr("app.tagline")}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tr("app.lead")}
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {(["login.bullet1", "login.bullet2", "login.bullet3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {tr(key)}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button className="h-12 px-6 text-[15px]" onClick={enterDemo}>
                {tr("login.tryDemo")}
                <ArrowRight className="size-4" />
              </Button>
              <a
                href="#pipeline"
                className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Voir le pipeline
              </a>
            </div>
          </div>

          <div className="animate-fade-up animate-delay-1 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
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

            <p className="mb-4 text-sm text-muted-foreground">
              {tr(authTab === "in" ? "login.welcomeBack" : "login.createAccount")}
            </p>

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

            <button
              type="button"
              onClick={enterDemo}
              className="mt-5 w-full text-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {tr("login.tryDemo")} →
            </button>
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

        <section id="features" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {tr("features.title")}
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
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

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Prêt à passer de l’idée à la publication ?
            </h2>
            <p className="mt-4 text-muted-foreground sm:text-lg">
              Explorez la démo interactive. Aucun compte requis.
            </p>
            <Button className="mt-8 h-12 px-8 text-[15px]" onClick={enterDemo}>
              {tr("login.tryDemo")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p>{tr("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
