/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // Префікс лишився з CRA: .env розробників, .env.production і dev.sh
    // уже використовують REACT_APP_*. Перейменування нічого не дає.
    envPrefix: 'REACT_APP_',
    server: {
      // PORT з .env, як було в CRA. Без strictPort Vite мовчки взяв би інший порт,
      // а dev.sh чекає саме на цей.
      port: Number(env.PORT) || 3005,
      strictPort: true,
      // CRA слухав усі адреси. Vite типово слухає лише localhost, а на Windows це
      // буває тільки [::1]: тоді http://127.0.0.1:3005 не відповідає.
      host: true,
    },
    build: {
      // build/ публікує деплой. static/ потрібен public/_headers (immutable),
      // public/_routes.json і edge/proxy.mjs (404 замість SPA-fallback).
      outDir: 'build',
      assetsDir: 'static',
      rolldownOptions: {
        output: {
          // Бібліотеки міняються рідше за код застосунку. Окремий чанк зберігає
          // свій хеш між деплоями, і браузер бере його з кешу (immutable).
          // Вантажиться одразу з входом, тому не ламає вкладку зі старим
          // index.html, як ламали б lazy-маршрути після нового деплою.
          codeSplitting: {
            groups: [{ name: 'vendor', test: /[\\/]node_modules[\\/]/ }],
          },
        },
      },
      // Сам vendor (MUI, x-charts, x-data-grid) важить понад 500 kB, і поріг за
      // замовчуванням попереджав би на кожній збірці.
      chunkSizeWarningLimit: 1200,
    },
    test: {
      // edge/*.test.mjs написані під node:test і йдуть окремим кроком CI.
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      // CRA запускав Jest з resetMocks: true. Тести розраховують на цю поведінку.
      mockReset: true,
    },
  };
});
