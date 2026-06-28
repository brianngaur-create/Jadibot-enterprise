import { env } from '../config/env';

/**
 * Hand-written OpenAPI 3 document. It documents the response envelope, security
 * scheme and the primary endpoint groups. Served at `${API_PREFIX}/docs`.
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'JadiBot Enterprise API',
    version: '1.0.0',
    description:
      'Multi-tenant WhatsApp bot platform. All responses use the envelope ' +
      '`{ success, message, data }`; errors use `{ success: false, status, code, message }`.',
  },
  servers: [{ url: env.API_PREFIX }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          status: { type: 'integer', example: 400 },
          code: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: { tags: ['System'], summary: 'Service health check', security: [], responses: { 200: { description: 'OK' } } },
    },
    '/auth/register': { post: { tags: ['Auth'], summary: 'Create an account', security: [] } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Authenticate and receive tokens', security: [] } },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Rotate the refresh token', security: [] } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Revoke the current session' } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Current authenticated user' } },
    '/bots': {
      get: { tags: ['Bots'], summary: 'List bots' },
      post: { tags: ['Bots'], summary: 'Create a bot' },
    },
    '/bots/{id}': {
      get: { tags: ['Bots'], summary: 'Get a bot' },
      patch: { tags: ['Bots'], summary: 'Update a bot' },
      delete: { tags: ['Bots'], summary: 'Delete a bot' },
    },
    '/sessions/create': { post: { tags: ['Sessions'], summary: 'Start a WhatsApp session (QR)' } },
    '/sessions/qr': { post: { tags: ['Sessions'], summary: 'Get the latest QR for a bot' } },
    '/sessions/pairing-code': { post: { tags: ['Sessions'], summary: 'Request a pairing code' } },
    '/plugins': { get: { tags: ['Plugins'], summary: 'List plugins' } },
    '/commands': { get: { tags: ['Commands'], summary: 'List commands' } },
    '/analytics': { get: { tags: ['Analytics'], summary: 'Dashboard analytics overview' } },
    '/logs': { get: { tags: ['Logs'], summary: 'Query logs' } },
    '/notifications': { get: { tags: ['Notifications'], summary: 'List notifications' } },
    '/api-keys': {
      get: { tags: ['API Keys'], summary: 'List API keys' },
      post: { tags: ['API Keys'], summary: 'Create an API key' },
    },
    '/admin/dashboard': { get: { tags: ['Admin'], summary: 'Platform-wide dashboard' } },
    '/admin/monitoring': { get: { tags: ['Admin'], summary: 'System monitoring metrics' } },
  },
} as const;
