import { defineConfig } from 'vite'

const githubPagesBase = process.env.VITE_BASE_PATH || ''

export default defineConfig({
  base: githubPagesBase,
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})
