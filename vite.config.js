import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set to '/<repo-name>/' when deploying
  // e.g. base: '/duo/' if your repo is called 'duo'
  // For local dev, leave as '/'
  base: process.env.GITHUB_PAGES ? '/duo/' : '/',
})
