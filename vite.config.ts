import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GtaVMap',
      formats: ['es', 'umd'],
      fileName: (format) => `gta-v-map.${format}.js`,
    },
  },
});
