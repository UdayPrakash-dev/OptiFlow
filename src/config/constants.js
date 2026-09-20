/**
 * OptiFlow System Constants
 * Single source of truth for fixed application tokens, limits, and system enums.
 */

export const API_PREFIX = '/api/v1';

export const AUTH_CONSTANTS = Object.freeze({
  MIN_PASSWORD_LENGTH: 12,
  ACCESS_TOKEN_TTL: '15m',
  ACCESS_TOKEN_TTL_SECONDS: 15 * 60,
  REFRESH_TOKEN_TTL_DAYS: 7,
  REFRESH_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  PASSWORD_RESET_TOKEN_TTL_MINUTES: 30,
  SUPPORT_GRANT_DEFAULT_HOURS: 4,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  BCRYPT_SALT_ROUNDS: 12
});

export const ACTOR_TYPE = Object.freeze({
  USER: 'user',
  PLATFORM_ADMIN: 'platform_admin',
  SYSTEM: 'system'
});

export const TOKEN_AUDIENCE = Object.freeze({
  TENANT: 'optiflow-tenant',
  PLATFORM: 'optiflow-platform'
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});

export const STORAGE_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ALLOWED_MIME_TYPES: Object.freeze([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
  PRESIGNED_URL_EXPIRES_SECONDS: 60
});

export const SCOPE_TYPE = Object.freeze({
  COMPANY: 'Company',
  BRANCH: 'Branch',
  TEAM: 'Team',
  PROJECT: 'Project'
});
