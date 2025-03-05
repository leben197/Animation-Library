import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 这里将引用指向您的库的源代码
      'animation-library': resolve(__dirname, '../src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
