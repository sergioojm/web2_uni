import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

export const notFound = (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada`));
};

export const errorHandler = (err, req, res, _next) => {
  if (config.env !== 'test') {
    console.error('❌', err.message);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res
      .status(400)
      .json({ error: true, message: 'Error de validación', details });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res
      .status(400)
      .json({ error: true, message: `Valor inválido para '${err.path}'` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res
      .status(409)
      .json({ error: true, message: `Ya existe un registro con ese '${field}'` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: true, message: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: true, message: 'Token expirado' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(413)
      .json({ error: true, message: 'Archivo demasiado grande' });
  }

  res.status(500).json({
    error: true,
    message:
      config.env === 'production'
        ? 'Error interno del servidor'
        : err.message
  });
};
