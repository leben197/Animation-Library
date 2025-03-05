
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AnimationLibrary',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd']  // 同时输出ES模块和UMD格式
    },
    minify: 'terser',  // 使用terser进行代码压缩
    terserOptions: {
      compress: {
        drop_console: true,// 移除console
        drop_debugger: true,// 移除debugger
      },
    },
    sourcemap: true,   // 生成sourcemap便于调试
    rollupOptions: {
      external: [],    // 如果有外部依赖，在这里声明
      output: {
        globals: {}    // 为UMD构建时的全局变量声明
      }
    }
  },
  plugins: [
    dts()  // 自动生成类型声明文件
  ]
})
