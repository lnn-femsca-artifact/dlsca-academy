import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build artifacts are hosted under /dlsca-academy/ on GitHub Pages.
// Local development keeps the root URL so `npm run dev` works normally.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/dlsca-academy/' : '/',
}));
