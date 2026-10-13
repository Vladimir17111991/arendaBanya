import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import oxlint from 'eslint-plugin-oxlint';
import fsd from './eslint.fsd.js';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', '.sites-runtime/**', '.pnpm-store/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
    plugins: { fsd },
    rules: { 'fsd/boundaries': 'error' },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser } },
    rules: {
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/enforce-style-attribute': ['error', { allow: ['scoped'] }],
    },
  },
  {
    files: ['*.{js,ts}', 'tests/**/*.{ts,js}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
  // Disable only the checks enabled in Oxlint; keep Vue and other remaining rules.
  ...oxlint.buildFromOxlintConfigFile(fileURLToPath(new URL('./.oxlintrc.json', import.meta.url))),
);
