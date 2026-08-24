import { defineConfig } from 'vite'

export default defineConfig({
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})
