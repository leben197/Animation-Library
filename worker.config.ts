import { resolve } from 'path';
import { ConfigEnv, defineConfig } from 'vite';

export default defineConfig(({ mode }: ConfigEnv) => {
  const isProduction = mode === 'production';

  return {
    // 只构建Worker文件
    build: {
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/render-worker.ts'),
        formats: ['es'],
        fileName: () => 'render-worker.js',
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        }
      },
      sourcemap: !isProduction,
      emptyOutDir: false, // 避免删除主库文件
    }
  }
})
