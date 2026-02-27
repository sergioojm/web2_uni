import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID no válido');


export const createMovieSchema = z.object({
    body: z.object({
        title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
        director: z.string().min(1, 'El director es requerido'),
        year: z.number().int().min(1888, 'El año debe ser mayor o igual a 1888').max(new Date().getFullYear(), 'El año no puede ser en el futuro'),
        genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi'], { message: 'Género no válido' }),
        copies: z.number().int().min(0).default(5),
        availableCopies: z.number().int().min(0).default(5),
        timesRented: z.number().int().min(0).default(0),
        cover: z.string().optional().default(null), 
        rating: z.number().min(0).max(5).default(0)
    })
});

export const updateMovieSchema = z.object({
    params: z.object({
        id: objectIdSchema
    }),
    body: z.object({
        title: z.string().min(2).optional(),
        director: z.string().min(1).optional(),
        year: z.number().int().min(1888).max(new Date().getFullYear()).optional(),
        genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi'], { message: 'Género no válido' }).optional(),
        copies: z.number().int().min(0).optional(),
        availableCopies: z.number().int().min(0).optional(),
        timesRented: z.number().int().min(0).optional(),
        cover: z.string().optional(),
        rating: z.number().min(0).max(5).optional()
    }).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Debe proporcionar al menos un campo para actualizar' }
    )
});

export const getMovieSchema = z.object({
    params: z.object({
        id: objectIdSchema
    })
});

export const getMovieFileNameSchema = z.object({
    params: z.object({
        filename: z.string().min(1, 'El nombre del archivo es requerido')
    })
});

// {
//   title: String,        // Requerido, mín 2 caracteres
//   director: String,     // Requerido
//   year: Number,         // Entre 1888 y año actual
//   genre: String,        // Enum: action, comedy, drama, horror, scifi
//   copies: Number,       // Total de copias (default: 5)
//   availableCopies: Number, // Copias disponibles
//   timesRented: Number,  // Contador de alquileres (default: 0)
//   cover: String         // Nombre del archivo de carátula (default: null)
//   rating: Number         // Calificación promedio (0-5, default: 0)
// }

