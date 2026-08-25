import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.carllaliberte.creatorflow",
  appName: "CreatorFlow",
  webDir: "dist",
  server: {
    iosScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090b",
    },
  },
};

export default config;
