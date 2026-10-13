import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: { host: '127.0.0.1', port: 5184, strictPort: true },
  preview: { host: '127.0.0.1', port: 4184, strictPort: true },
  plugins: [vue()],
  css: { preprocessorOptions: { scss: { quietDeps: true, silenceDeprecations: ['import'] } } },
});
