import { resolve } from 'path';
import { defineConfig } from 'vite';

console.log('vite.config.ts');

export default defineConfig({
  root: '/demo',
  base: './',
  resolve: {
    alias: {
      '@lib': resolve(__dirname, '../src')
    }
  },
  server: {
    open: true
  }
});
