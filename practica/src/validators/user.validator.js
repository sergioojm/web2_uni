import { z } from 'zod';

const emailField = z
  .string()
  .email('Email inválido')
  .transform((v) => v.trim().toLowerCase());

const passwordField = z.string().min(8, 'Mínimo 8 caracteres');

export const registerSchema = z.object({
  body: z.object({
    email: emailField,
    password: passwordField
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'Contraseña requerida')
  })
});

export const validationSchema = z.object({
  body: z.object({
    code: z
      .string()
      .regex(/^\d{6}$/, 'El código debe tener 6 dígitos')
  })
});

export const onboardingPersonalSchema = z.object({
  body: z.object({
    name: z.string().min(1).transform((v) => v.trim()),
    lastName: z.string().min(1).transform((v) => v.trim()),
    nif: z
      .string()
      .min(5)
      .transform((v) => v.trim().toUpperCase())
  })
});

const addressSchema = z
  .object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  })
  .optional();

const freelanceSchema = z.object({
  isFreelance: z.literal(true)
});

const businessSchema = z.object({
  isFreelance: z.literal(false),
  name: z.string().min(1).transform((v) => v.trim()),
  cif: z.string().min(5).transform((v) => v.trim().toUpperCase()),
  address: addressSchema
});

export const onboardingCompanySchema = z.object({
  body: z.discriminatedUnion('isFreelance', [freelanceSchema, businessSchema])
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken requerido')
  })
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: passwordField
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      message: 'La nueva contraseña debe ser diferente de la actual',
      path: ['newPassword']
    })
});

export const inviteSchema = z.object({
  body: z.object({
    email: emailField,
    name: z.string().min(1).transform((v) => v.trim()),
    lastName: z.string().min(1).transform((v) => v.trim()),
    nif: z.string().min(5).transform((v) => v.trim().toUpperCase()),
    password: passwordField.optional()
  })
});

export const deleteQuerySchema = z.object({
  query: z.object({
    soft: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
  })
});
