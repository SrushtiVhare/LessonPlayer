import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
})
