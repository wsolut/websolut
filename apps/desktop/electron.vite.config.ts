import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { PluginOption } from 'vite';

export default defineConfig(({ mode }) => {
  const rendererPlugins: PluginOption[] = [vue()];

  if (mode === 'development') {
    rendererPlugins.push(vueDevTools());
  }

  return {
    main: {
      plugins: [
        externalizeDepsPlugin({
          include: ['vite', 'rollup', '@rollup/*', '@vitejs/*'],
        }),
      ],
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src/renderer/src'),
        },
      },
      plugins: rendererPlugins,
    },
  };
});
