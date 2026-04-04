export const handleHttpError = (res, message = 'Error interno', code = 500) => {
  res.status(code).json({
    error: true,
    message
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
  }
}

export const errors = {
  notFound: (resource = 'Resource') => new AppError(`${resource} not found`, 404),
  unauthorized: () => new AppError('Unauthorized', 401),
  forbidden: () => new AppError('Forbidden', 403),
  badRequest: (message = 'Bad request') => new AppError(message, 400),
  conflict: (message = 'Conflict') => new AppError(message, 409)
};
