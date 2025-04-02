import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../src')
    }
  },
  server: {
    port: 5174
  },
  build: {
    outDir: path.resolve(__dirname, '../../../dist/demo/worker-demo'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  worker: {
    format: 'es'
  }
});
