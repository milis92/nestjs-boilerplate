import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import type { ViteUserConfig } from 'vitest/config';
import * as dotenv from '@dotenvx/dotenvx'

export default defineConfig(() => {
  const env = dotenv.config({ path: '.env.test', quiet: true });
  return {
    test: {
      env: env.parsed,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,js}'],
        exclude: [
          'src/**/*.spec.{ts,js}',
          'src/main.ts',
          'src/**/*.module.ts',
        ],
        reportsDirectory: './coverage',
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            globals: true,
            root: './',
            include: ['src/**/*.spec.ts'],
            globalSetup: ['./vitest-global.setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'e2e',
            globals: true,
            root: './',
            include: ['test/**/*.e2e-spec.ts'],
            testTimeout: 120_000,
            globalSetup: ['./vitest-global.setup.ts'],
          },
          resolve: {
            alias: {
              '@': resolve(__dirname, './src'),
              '@test': resolve(__dirname, './test'),
            },
          },
        },
      ],
    },
    plugins: [
      swc.vite({
        module: { type: 'es6' },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  } satisfies ViteUserConfig;
});
