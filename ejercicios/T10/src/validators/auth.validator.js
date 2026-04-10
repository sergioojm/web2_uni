import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email no válido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúsculas, minúsculas y números'),
});

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }
  req.body = result.data;
  next();
};
