import { LanguageSelector } from "../components/LanguageSelector";
import { Card } from "../components/ui";
import { useI18n } from "../i18n/context";

export function SettingsPage() {
  const { tr } = useI18n();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("settings.subtitle")}</p>
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">{tr("lang.label")}</h2>
        <div className="mt-3">
          <LanguageSelector />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Profil</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            A
          </span>
          <div>
            <p className="font-medium">Alex Créateur</p>
            <p className="text-sm text-muted-foreground">alex@demo.creatorflow.app</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Plan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Gratuit — 8 générations IA / mois
        </p>
        <div className="video-progress mt-3">
          <div className="video-progress-bar" style={{ width: "37%" }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">3 / 8 générations utilisées</p>
      </Card>
    </div>
  );
}
