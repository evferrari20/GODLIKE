import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works on GitHub Pages or any sub-path host.
export default defineConfig({
  base: './',
  plugins: [react()],
});
