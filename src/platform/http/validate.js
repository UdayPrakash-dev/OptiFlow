import { AppError } from '#platform/errors/AppError.js';

/**
 * Validates req.body, req.query, and req.params using Zod schemas.
 *
 * @param {object} schemas
 * @param {import('zod').ZodTypeAny} [schemas.body]
 * @param {import('zod').ZodTypeAny} [schemas.query]
 * @param {import('zod').ZodTypeAny} [schemas.params]
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    const errors = [];

    for (const [key, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (result.success) {
        req[key] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({
            location: key,
            field: issue.path.join('.'),
            message: issue.message
          });
        }
      }
    }

    if (errors.length > 0) {
      return next(AppError.validation(errors));
    }

    return next();
  };
}
