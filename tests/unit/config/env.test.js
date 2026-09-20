import { describe, it, expect } from 'vitest';
import { validateEnv } from '#config/env.js';

describe('Environment Configuration Validation (validateEnv)', () => {
  const validDevEnv = {
    NODE_ENV: 'development',
    PORT: '5500',
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/optiflow_dev',
    JWT_SECRET: 'super_secret_jwt_key_16_chars_min',
    REFRESH_TOKEN_SECRET: 'super_secret_refresh_key_16_chars_min',
    COOKIE_SECRET: 'super_secret_cookie_key_16_chars_min',
    CORS_ORIGIN: 'http://localhost:3000,http://localhost:5173'
  };

  it('successfully validates and freezes a complete configuration', () => {
    const config = validateEnv(validDevEnv);

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(5500);
    expect(config.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/optiflow_dev');
    expect(config.JWT_SECRET).toBe('super_secret_jwt_key_16_chars_min');
    expect(config.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:5173']);
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);

    // Assert immutability
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      // @ts-ignore
      config.PORT = 8080;
    }).toThrow();
  });

  it('fails fast when DATABASE_URL is missing or empty', () => {
    const invalidEnv = { ...validDevEnv, DATABASE_URL: '' };

    expect(() => validateEnv(invalidEnv)).toThrow(/DATABASE_URL is required/);
  });

  it('fails fast when JWT_SECRET is missing or too short', () => {
    const missingSecret = { ...validDevEnv, JWT_SECRET: undefined };
    expect(() => validateEnv(missingSecret)).toThrow(/JWT_SECRET/);

    const shortSecret = { ...validDevEnv, JWT_SECRET: 'short' };
    expect(() => validateEnv(shortSecret)).toThrow(/at least 16 characters/);
  });

  it('enforces 32+ character secrets in production mode', () => {
    const prodEnvWith16CharSecret = {
      ...validDevEnv,
      NODE_ENV: 'production',
      JWT_SECRET: '16_chars_secret!',
      REFRESH_TOKEN_SECRET: '16_chars_secret!',
      COOKIE_SECRET: '16_chars_secret!'
    };

    expect(() => validateEnv(prodEnvWith16CharSecret)).toThrow(/at least 32 characters in production/);

    const validProdEnv = {
      ...validDevEnv,
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_long_secure_jwt_secret_for_production_32_chars!',
      REFRESH_TOKEN_SECRET: 'a_very_long_secure_refresh_secret_for_prod_32_chars!',
      COOKIE_SECRET: 'a_very_long_secure_cookie_secret_for_prod_32_chars!'
    };

    const config = validateEnv(validProdEnv);
    expect(config.isProduction).toBe(true);
  });

  it('requires S3 credentials when STORAGE_DRIVER is "s3"', () => {
    const s3EnvMissingCredentials = {
      ...validDevEnv,
      STORAGE_DRIVER: 's3'
    };

    expect(() => validateEnv(s3EnvMissingCredentials)).toThrow(/S3_BUCKET is required/);

    const validS3Env = {
      ...validDevEnv,
      STORAGE_DRIVER: 's3',
      S3_BUCKET: 'my-evidence-bucket',
      S3_ACCESS_KEY_ID: 'access_key_123',
      S3_SECRET_ACCESS_KEY: 'secret_key_456'
    };

    const config = validateEnv(validS3Env);
    expect(config.STORAGE_DRIVER).toBe('s3');
    expect(config.S3_BUCKET).toBe('my-evidence-bucket');
  });

  it('parses multiple comma-separated CORS origins and trims whitespace', () => {
    const envWithSpacedCors = {
      ...validDevEnv,
      CORS_ORIGIN: ' https://app.optiflow.io , https://admin.optiflow.io  '
    };

    const config = validateEnv(envWithSpacedCors);
    expect(config.corsOrigins).toEqual(['https://app.optiflow.io', 'https://admin.optiflow.io']);
  });
});
