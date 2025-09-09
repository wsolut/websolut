import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '**/tmp',
      '**/resources',
      '**/scripts',
      'eslint.config.mjs',
      'postcss.config.js',
      'vite.config.js',
      'tailwind.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  eslintPluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        // Use Node globals for main/preload and Browser globals for renderer templates
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        // Ensure .vue files are type-checked against the web (renderer) tsconfig
        project: ['./tsconfig.web.json'],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-lang': [
        'error',
        {
          script: { lang: 'ts' },
        },
      ],
      // Component import validation
      'vue/no-undef-components': 'error',
      'vue/no-unused-components': 'warn',
      // Disable Vue formatting rules that conflict with Prettier
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/attributes-order': 'off',
      'vue/html-self-closing': 'off',
    },
  },
);
