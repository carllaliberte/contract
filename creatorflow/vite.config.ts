import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/contract/creatorflow/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/ai": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
