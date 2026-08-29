import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  handleClipProxy,
  isClipProxyPath,
} from "./scripts/clip-proxy-middleware.mjs";

const webBase = process.env.VITE_BASE_PATH ?? "/contract/clapshot/";

function clapshotClipProxy() {
  return {
    name: "clapshot-clip-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isClipProxyPath(req.url ?? "")) return next();
        void handleClipProxy(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isClipProxyPath(req.url ?? "")) return next();
        void handleClipProxy(req, res);
      });
    },
  };
}

export default defineConfig({
  base: webBase,
  plugins: [react(), tailwindcss(), clapshotClipProxy()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/ai": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass(req) {
          if (isClipProxyPath(req.url ?? "")) return req.url;
        },
      },
      "/ideas": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
