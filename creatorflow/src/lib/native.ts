import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { peekAuthToken } from "./auth/session";

const STATUS_BAR_BACKGROUND = "#09090b";

function warnIfAuthStubOnNative(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (import.meta.env.VITE_AUTH_STUB === "true") {
    console.error(
      "[Clapshot FATAL] VITE_AUTH_STUB=true in a native build — forbidden for App Store. Rebuild with npm run build:ios without stub.",
    );
  }
  const token = peekAuthToken();
  if (token?.startsWith("stub.")) {
    console.error(
      "[Clapshot FATAL] Stub auth token detected on native platform. Sign out and rebuild without VITE_AUTH_STUB.",
    );
  }
}

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform();
  document.documentElement.classList.add(`native-${platform}`);
  warnIfAuthStubOnNative();

  await StatusBar.setStyle({ style: Style.Dark });

  if (platform === "ios") {
    await StatusBar.setOverlaysWebView({ overlay: true });
  } else if (platform === "android") {
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_BACKGROUND });
    await StatusBar.setOverlaysWebView({ overlay: false });
  }
}
