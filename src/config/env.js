import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5500),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required and must not be empty'),

  // Secrets - strictly required, NO default fallback strings allowed
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters long'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters long'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // Mail
  MAIL_DRIVER: z.enum(['console', 'resend', 'smtp']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('noreply@optiflow.io'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
}).superRefine((data, ctx) => {
  // S3 validation if driver is s3
  if (data.STORAGE_DRIVER === 's3') {
    if (!data.S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_BUCKET'],
        message: 'S3_BUCKET is required when STORAGE_DRIVER is "s3"'
      });
    }
    if (!data.S3_ACCESS_KEY_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_ACCESS_KEY_ID'],
        message: 'S3_ACCESS_KEY_ID is required when STORAGE_DRIVER is "s3"'
      });
    }
    if (!data.S3_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_SECRET_ACCESS_KEY'],
        message: 'S3_SECRET_ACCESS_KEY is required when STORAGE_DRIVER is "s3"'
      });
    }
  }

  // Production security checks
  if (data.NODE_ENV === 'production') {
    if (data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production'
      });
    }
    if (data.REFRESH_TOKEN_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REFRESH_TOKEN_SECRET'],
        message: 'REFRESH_TOKEN_SECRET must be at least 32 characters in production'
      });
    }
    if (data.COOKIE_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECRET'],
        message: 'COOKIE_SECRET must be at least 32 characters in production'
      });
    }
  }
});

/**
 * Validates raw environment input and returns a typed, frozen configuration object.
 * Throws an Error with detailed diagnostics if validation fails.
 *
 * @param {Record<string, string | undefined>} [rawEnv=process.env]
 * @returns {Readonly<z.infer<typeof envSchema> & { corsOrigins: string[] }>}
 */
export function validateEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    const errorMessage = `[OptiFlow Boot Error] Invalid environment configuration:\n${errorDetails}\n\nTerminating process to prevent insecure execution.`;
    throw new Error(errorMessage);
  }

  const corsOrigins = result.data.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Object.freeze({
    ...result.data,
    corsOrigins,
    isProduction: result.data.NODE_ENV === 'production',
    isDevelopment: result.data.NODE_ENV === 'development',
    isTest: result.data.NODE_ENV === 'test'
  });
}

// In test environment, if JWT_SECRET is not set, provide a dummy default for non-env unit tests
// so other modules can be imported without throwing unless validateEnv() is explicitly invoked.
let configInstance;
try {
  configInstance = validateEnv(process.env);
} catch (error) {
  if (process.env.NODE_ENV === 'test') {
    // Provide safe test defaults for unit testing modules that import config
    configInstance = validateEnv({
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/optiflow_test',
      JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_at_least_16_chars_long',
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_at_least_16_chars_long',
      COOKIE_SECRET: process.env.COOKIE_SECRET || 'test_cookie_secret_at_least_16_chars_long'
    });
  } else {
    // Throw error in dev or production
    throw error;
  }
}

export const config = configInstance;
