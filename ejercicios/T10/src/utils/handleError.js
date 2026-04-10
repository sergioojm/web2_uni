export const handleHttpError = (res, message = 'Error interno', code = 500) => {
  res.status(code).json({ error: true, message });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errors = {
  notFound: (resource = 'Recurso') => new AppError(`${resource} no encontrado`, 404),
  unauthorized: () => new AppError('No autorizado', 401),
  forbidden: () => new AppError('Acceso prohibido', 403),
  badRequest: (msg = 'Solicitud inválida') => new AppError(msg, 400),
  conflict: (msg = 'Conflicto') => new AppError(msg, 409),
};
