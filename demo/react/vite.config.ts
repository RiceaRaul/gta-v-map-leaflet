import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  publicDir: resolve(__dirname, '../../public'),
  resolve: {
    alias: {
      'gta-v-map': resolve(__dirname, '../../src/index.ts'),
    },
  },
});
