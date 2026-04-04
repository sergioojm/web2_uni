import { Prisma } from '@prisma/client';

export const notFound = (req, res, next) => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({
        error: true,
        message: `A record with that '${field}' already exists`
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        error: true,
        message: 'Record not found'
      });
    }
  }

  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      error: true,
      message: 'Validation error',
      details
    });
  }

  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error'
  });
};
