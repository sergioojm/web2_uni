import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return next(
      Object.assign(AppError.badRequest('Error de validación'), { details })
    );
  }

  if (result.data.body) req.body = result.data.body;
  next();
};
