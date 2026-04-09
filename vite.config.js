import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/duo/' : '/',
  build: {
    rolldownOptions: {
      output: {
        // Split Firebase into its own chunk so the main app loads faster
        advancedChunks: {
          groups: [
            {
              name: 'firebase',
              test: /firebase/,
            },
          ],
        },
      },
    },
  },
})
