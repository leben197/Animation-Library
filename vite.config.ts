import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    // 明确指定输出目录
    outDir: 'dist',

    lib: {
      // 只指定src/index.ts作为入口
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AnimationLibrary',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd']
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: true,

    // 确保只打包核心库代码
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },

    // 排除demo目录
    emptyOutDir: true
  },

  plugins: [
    dts({
      // 确保只为src目录生成类型定义
      include: ['src/**/*.ts'],
      exclude: ['demo/**/*', 'node_modules/**/*']
    })
  ],

  // 开发服务器配置（不会影响构建）
  server: {
    port: 5173,
    open: '/demo/src/basic/index.html'
  }
})
