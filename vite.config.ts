/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    css: false,
    // A máquina de desenvolvimento fica lenta com vários jsdom em paralelo; 5 s padrão dava falso alarme.
    testTimeout: 15_000,
    maxWorkers: 2,
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
