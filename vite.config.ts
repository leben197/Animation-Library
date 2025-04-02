import { resolve } from 'path';
import { ConfigEnv, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }: ConfigEnv) => {
  const isProduction = mode === 'production';

  return {
    build: {
      // 明确指定输出目录
      outDir: 'dist',
      lib: {
        // 指定主入口
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'animationLibrary',
        fileName: (format) => `index.${format}.js`,
        formats: ['es', 'umd']
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        }
      },
      sourcemap: !isProduction,
      rollupOptions: {
        external: [],
        output: {
          globals: {},

        },
      },
    },

    plugins: [
      dts({
        include: ['src/**/*.ts'],

        exclude: ['demo/**/*', 'node_modules/**/*'],
        insertTypesEntry: true,
        rollupTypes: true,
        outDir: 'dist'
      })
    ],

    server: {
      port: 5173,
      open: '/demo/src/basic/index.html'
    }
  }
})
