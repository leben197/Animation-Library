import path, { resolve } from 'path';
import { defineConfig } from 'vite';
console.log('vite.config.ts');

export default defineConfig({
  root: '/demo',
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@lib': path.resolve(__dirname, '../../../dist')
    }
  },

  optimizeDeps: {
    include: [],
    exclude: ['@lib']
  },
  server: {
    open: true
  }
});
