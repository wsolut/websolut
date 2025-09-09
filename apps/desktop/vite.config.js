import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import vueDevTools from 'vite-plugin-vue-devtools';
import * as path from 'path';
import * as fs from 'fs';
import { createHtmlPlugin } from 'vite-plugin-html';

// Custom plugin to rename HTML file after build
function renameHtmlPlugin(outDir) {
  return {
    name: 'rename-html',
    writeBundle() {
      const oldPath = path.join(outDir, 'backend-spa.html');
      const newPath = path.join(outDir, 'index.html');

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log('✓ Renamed backend-spa.html to index.html');
      }
    }
  };
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const outDir = env.VITE_OUT_DIR_PATH || path.resolve(__dirname, 'resources/backend-spa');

  const plugins = [
    vue(),
    svgLoader(),
    createHtmlPlugin({
      minify: false,
      template: 'backend-spa.html',
      inject: {
        data: {
          title: 'Websolut [DEV]',
          backendBaseUrl: `http://localhost:${env.BACKEND_PORT}`,
        },
      },
    }),
    renameHtmlPlugin(outDir),
  ];

  if (mode === 'development') {
    plugins.push(vueDevTools());
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
    plugins,
    root: './src/renderer',
    base: '/spa/',
    build: {
      outDir,
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/renderer/backend-spa.html'),
      },
    },
  };
});
