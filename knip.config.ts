import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    '.claude/**',
    // Used by `pnpm dlx @better-auth/cli migrate` as the auth config entry point — not imported by TS
    'auth.ts',
  ],

  ignoreDependencies: [
    // ESLint config ecosystem — referenced in eslint.config.mjs, not via TS imports
    '@eslint/eslintrc',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    // CLI tools — invoked via pnpm dlx, never imported
    '@better-auth/cli',
    // NestJS build pipeline — used by nest build (swc/ts-node), not imported
    'source-map-support',
    'ts-loader',
    'ts-node',
    'tsconfig-paths',
    'tsx',
    // Dev tooling — pino transport for local logging, portless for local proxy
    'pino-pretty',
    'portless',
    // Implicit runtime peers — required by @nestjs/platform-express and @nestjs/apollo internals
    '@as-integrations/express5',
    'multer',
    '@types/multer',
    // Seeding scripts — used in ad-hoc db:seed, not in main source
    'drizzle-seed',
  ],

  // NestJS DI false positives: config factories registered via ConfigModule.forFeature(),
  // providers via useFactory/useClass, and decorators applied at runtime cannot be traced
  // by knip. Disable export analysis — unused files and deps are the actionable signals here.
  exclude: [
    'exports',
    'nsExports',
    'types',
    'nsTypes',
    'enumMembers',
  ],
};

export default config;
