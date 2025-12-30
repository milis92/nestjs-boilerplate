/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [], "controllers": [[import("./health/health.controller.js"), { "HealthController": { "check": { type: Object } } }], [import("./infra/auth/auth.controller.js"), { "AuthController": { "getOpenApi": {}, "handler": { summary: "Catch-all handler that forwards all authentication requests to BetterAuth.\nHandles all HTTP methods (GET, POST, etc.) for any path under /auth/*.\n\nRate limiter is applied to prevent brute-force attacks.\nCaching is disabled to ensure a fresh authentication state.\n\nAuthentication is optional since some endpoints\ndo not require a session to work." } } }]] } };
};