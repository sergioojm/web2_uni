import mongoose from "mongoose";

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


const movieSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        minlength: [2, 'El título debe tener al menos 2 caracteres']
    },
    director: {
        type: String,
        required: [true, 'El director es requerido'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'El año es requerido'],
        min: [1888, 'El año debe ser mayor o igual a 1888'],
        max: [new Date().getFullYear(), 'El año no puede ser en el futuro']
    },
    genre: {
        type: String,
        required: [true, 'El género es requerido'],
        enum: {
            values: ['action', 'comedy', 'drama', 'horror', 'scifi'],
            message: '{VALUE} no es un género válido'
        }
    },
    copies: {
        type: Number,
        default: 5,
        min: [0, 'El número de copias no puede ser negativo']
    },
    availableCopies: {
        type: Number,
        default: 5,
        min: [0, 'El número de copias disponibles no puede ser negativo']
    },
    timesRented: {
        type: Number,
        default: 0,
        min: [0, 'El número de veces alquilada no puede ser negativo']
    },
    cover: {
        type: String,
        default: null
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'La calificación no puede ser menor a 0'],
        max: [5, 'La calificación no puede ser mayor a 5']
    }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

movieSchema.index({ title: 1, director: 1 }, { unique: true });

movieSchema.set('toJSON', { virtuals: true });
movieSchema.set('toObject', { virtuals: true });


const Movie = mongoose.model('Movie', movieSchema, 'movies_collection');

export default Movie;