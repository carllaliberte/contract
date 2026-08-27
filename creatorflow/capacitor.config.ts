import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.carllaliberte.creatorflow",
  appName: "Clapshot",
  webDir: "dist",
  server: {
    iosScheme: "https",
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  android: {
    backgroundColor: "#09090b",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090b",
    },
  },
};

export default config;
