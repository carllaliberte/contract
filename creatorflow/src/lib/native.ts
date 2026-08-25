import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const STATUS_BAR_BACKGROUND = "#09090b";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform();
  document.documentElement.classList.add(`native-${platform}`);

  await StatusBar.setStyle({ style: Style.Dark });

  if (platform === "ios") {
    await StatusBar.setOverlaysWebView({ overlay: true });
  } else if (platform === "android") {
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_BACKGROUND });
    await StatusBar.setOverlaysWebView({ overlay: false });
  }
}
