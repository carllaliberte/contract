import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initNativeShell } from "./lib/native";
import "./index.css";

void initNativeShell();

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) void reg.unregister();
  });
}

if ("caches" in window) {
  void caches.keys().then((keys) => {
    for (const key of keys) void caches.delete(key);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
