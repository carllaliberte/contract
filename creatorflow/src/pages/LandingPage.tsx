import {
  ArrowRight,
  Calendar,
  Clapperboard,
  FileText,
  Lightbulb,
  Play,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { Button, Input, Label, Logo } from "../components/ui";
import {
  demoVideoPoster,
  demoVideoUrl,
  exampleGallery,
  showcaseImages,
} from "../data/demo";
import { useI18n } from "../i18n/context";

const pipelineSteps = [
  { key: "idea", icon: Lightbulb, color: "text-status-idea" },
  { key: "script", icon: FileText, color: "text-status-script" },
  { key: "production", icon: Clapperboard, color: "text-status-production" },
  { key: "ready", icon: Sparkles, color: "text-status-ready" },
  { key: "published", icon: ArrowRight, color: "text-status-published" },
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

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#showcase" className="hover:text-foreground">
            {tr("showcase.title").split(" ")[0]}
          </a>
          <a href="#examples" className="hover:text-foreground">
            {tr("nav.examples")}
          </a>
          <a href="#features" className="hover:text-foreground">
            {tr("nav.features")}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button variant="outline" className="hidden sm:inline-flex" onClick={enterDemo}>
            {tr("nav.demo")}
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero + Auth */}
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-14">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              YouTube · TikTok · Reels
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {tr("app.tagline")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              {tr("app.lead")}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                {tr("login.bullet1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                {tr("login.bullet2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                {tr("login.bullet3")}
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={enterDemo}>{tr("login.tryDemo")}</Button>
              <Button variant="outline" onClick={() => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })}>
                {tr("showcase.title")}
              </Button>
            </div>

            {/* Pipeline mini visual */}
            <div className="mt-10 hidden rounded-2xl border border-border bg-card/60 p-4 shadow-card backdrop-blur-sm sm:block">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tr("pipeline.title")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {pipelineSteps.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
                      <step.icon className={`size-3.5 ${step.color}`} />
                      <span className="text-xs font-medium">
                        {tr(`status.${step.key}`)}
                      </span>
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <ArrowRight className="size-3 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-card [animation-delay:120ms]">
            <div className="mb-5 lg:hidden">
              <Logo size="sm" />
              <p className="mt-3 text-sm text-muted-foreground">{tr("app.tagline")}</p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/50 p-1">
              <button
                type="button"
                onClick={() => setAuthTab("in")}
                className={`h-10 rounded-md text-sm font-medium transition-colors ${
                  authTab === "in"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tr("login.signIn")}
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("up")}
                className={`h-10 rounded-md text-sm font-medium transition-colors ${
                  authTab === "up"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tr("login.signUp")}
              </button>
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              {tr(authTab === "in" ? "login.welcomeBack" : "login.createAccount")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{tr("login.providersHint")}</p>

            <div className="mt-5 flex flex-col gap-2">
              <Button variant="outline" type="button" onClick={enterDemo}>
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
              <Button variant="outline" type="button" onClick={enterDemo}>
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {tr("login.continueX")}
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {tr("login.or")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-3">
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authTab === "up" ? "new-password" : "current-password"}
                />
              </div>
              <Button type="submit">
                {tr(authTab === "in" ? "login.submitIn" : "login.submitUp")}
              </Button>
            </form>

            <button
              type="button"
              onClick={enterDemo}
              className="mt-4 w-full text-center text-sm font-medium text-primary hover:underline"
            >
              {tr("login.tryDemo")} →
            </button>
          </div>
        </section>

        {/* Video + Screenshots showcase */}
        <section id="showcase" className="border-t border-border bg-card/30 py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">{tr("showcase.title")}</h2>
              <p className="mt-3 text-muted-foreground">{tr("showcase.subtitle")}</p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <Play className="size-4 text-primary" />
                    <p className="font-medium">{tr("showcase.videoTitle")}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tr("showcase.videoCaption")}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {showcaseImages.map((img) => (
                  <div
                    key={img.label}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {img.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Example gallery */}
        <section id="examples" className="py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">{tr("examples.title")}</h2>
              <p className="mt-3 text-muted-foreground">{tr("examples.subtitle")}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {exampleGallery.map((item) => (
                <article
                  key={item.title}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className={`relative ${item.aspect} overflow-hidden bg-secondary`}>
                    <img
                      src={item.src}
                      alt={item.title}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <span className="absolute bottom-3 left-3 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      {item.platform}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-card/30 py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight">
              {tr("features.title")}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: FileText, title: "features.script.title", desc: "features.script.desc" },
                { icon: Clapperboard, title: "features.pipeline.title", desc: "features.pipeline.desc" },
                { icon: Calendar, title: "features.calendar.title", desc: "features.calendar.desc" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card"
                >
                  <div className="grid size-11 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{tr(title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(desc)}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button onClick={enterDemo}>{tr("login.tryDemo")}</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p>{tr("footer.rights")}</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">
              {tr("footer.terms")}
            </Link>
            <Link to="/" className="hover:text-foreground">
              {tr("footer.privacy")}
            </Link>
            <a href="mailto:hello@creatorflow.app" className="hover:text-foreground">
              {tr("footer.contact")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
