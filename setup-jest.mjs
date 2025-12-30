/**
 * Jest Setup File
 *
 * This file is executed before each test suite to set up the testing environment.
 * It provides default environment variables for testing, ensuring that tests
 * run in a consistent and isolated environment.
 */

// #############################
// # Application Configuration #
// #############################

// The environment in which the application is running.
// Determines behavior such as error handling verbosity, optimizations, and feature flags.
// Must be one of: development, staging, production, test
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// The network port number on which the application will listen for incoming HTTP requests.
// Must be a valid port number (1-65535).
process.env.APP_PORT = '3000';

// The base URL prefix prepended to all API routes.
// Useful for versioning, namespacing, or reverse proxy routing.
process.env.APP_GLOBAL_ROUTE_PREFIX = '/api';

// Trust Proxy Configuration
// Configures the 'trust proxy' setting for Express.
process.env.APP_TRUST_PROXY = 'loopback';

// CORS Configuration
// A comma-separated list of allowed origins for Cross-Origin Resource Sharing (CORS).
// Specifies which external domains are permitted to make requests to this API.
process.env.APP_CORS_ORIGINS = 'http://localhost:3000';

// Logger Configuration
// The minimum severity level of log messages to record.
// Levels in order of severity: trace, debug, info, warn, error, fatal
process.env.APP_LOG_LEVEL = 'trace';

// The destination where log output will be sent.
// Currently has to "console", since other destinations are not implemented yet
process.env.APP_LOG_COLLECTOR = 'console';

// #######################
// # Cache Configuration #
// #######################

// Default Time-to-live (TTL) for cache entries.
// Defines how long cached data will be stored before expiring.
process.env.CACHE_TTL = '1h';

// Maximum number of items to store in the in-memory LRU cache.
// When the limit is reached, the least recently used items will be evicted.
process.env.CACHE_LRU_SIZE = '5000';

// Rate Limiter Configuration

// Time window in milliseconds for rate limiting.
// Requests are counted within this time window.
process.env.RATE_LIMIT_TTL = '60000';

// Maximum number of requests allowed within the TTL window.
process.env.RATE_LIMIT_MAX = '100';

// Duration in milliseconds to block requests after exceeding the limit.
process.env.RATE_LIMIT_BLOCK_DURATION = '60000';

// ################################
// # Authentication Configuration #
// ################################

// Secret key used for signing and verifying authentication tokens and sessions.
// IMPORTANT: This must be a long, random, and secure string.
process.env.AUTH_SECRET = 'your-secret-key-change-this-in-production';

// The base URL where the API is accessible.
// Used for constructing callback URLs and redirects in authentication flows.
process.env.AUTH_BASE_URL = 'http://localhost:3000';

// Comma-separated list of trusted origins for authentication.
// These origins are allowed to initiate authentication flows and receive tokens.
process.env.AUTH_TRUSTED_ORIGINS = 'http://localhost:3000';

// #######################
// # Redis Configuration #
// #######################

// The hostname or IP address of the Redis server.
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';

// The port number on which the Redis server is listening.
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Password for authenticating with the Redis server (if required).
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Enable TLS/SSL connection to Redis.
process.env.REDIS_TLS = 'false';

// Whether to reject unauthorized TLS certificates.
process.env.REDIS_REJECT_UNAUTHORIZED = 'false';

// Path to the Certificate Authority (CA) certificate file for TLS connections.
process.env.REDIS_CA = '';

// Path to the client private key file for TLS connections.
process.env.REDIS_KEY = '';

// Path to the client certificate file for TLS connections.
process.env.REDIS_CERT = '';

// Redis database number for cache storage (0-15).
process.env.REDIS_CACHE_DB = '0';

// Redis database number for rate limiter storage (0-15).
process.env.REDIS_RATE_LIMITER_DB = '1';

// Connection timeout in milliseconds.
process.env.REDIS_CONNECT_TIMEOUT = '10000';

// ############################
// # PostgreSQL Configuration #
// ############################

// The hostname or IP address of the PostgreSQL server.
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';

// The port number on which the PostgreSQL server is listening.
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';

// The name of the default database to create/use.
process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'api';

// The PostgreSQL username with access to the database.
process.env.POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';

// Password for the PostgreSQL user.
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres';

// Enable TLS/SSL connection to PostgreSQL.
process.env.POSTGRES_SSL = 'false';

// Whether to reject unauthorized TLS certificates.
process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED = 'true';

// #########################
// # OpenAPI Configuration #
// #########################

// Path segment where Swagger UI and JSON are served.
process.env.DOCS_PATH = '/api/docs';

// Title displayed in the Swagger UI.
process.env.DOCS_TITLE = 'API';

// Short description shown under the title in Swagger UI.
process.env.DOCS_DESCRIPTION = 'API documentation';

// API version string shown in the docs.
process.env.DOCS_VERSION = '1.0';

// #########################
// # GraphQL Configuration #
// #########################

// Enable/Disable GraphQL Playground.
process.env.GQL_PLAYGROUND = 'true';

// Enable/Disable GraphQL debug mode.
process.env.GQL_DEBUG = 'true';

// The path segment where GraphQL API and Playground are served.
process.env.GQL_PATH = '/graphql';

// Enable/Disable GraphQL Introspection.
process.env.GQL_INTROSPECTION = 'true';
