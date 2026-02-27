import Movie from '../models/movie.model.js';
import { handleHttpError } from '../utils/handleError.js';
import { join } from 'node:path';
import { stat, unlink } from 'node:fs/promises';

// GET /api/movies
export const getMovies = async (req, res) => {
	const { page = 1, limit = 10, genre, director, search } = req.query;

	const filter = {};
	if (genre) filter.genre = genre;
	if (director) filter.director = director;
	if (search) filter.search = { $regex: search, $options: 'i' };

	const skip = (Number(page) - 1) * Number(limit);

	const [movies, total] = await Promise.all([
		Movie.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
		Movie.countDocuments(filter)
	]);

	res.json({
		data: movies,
		pagination: {
			page: Number(page),
			limit: Number(limit),
			total,
			pages: Math.ceil(total / Number(limit))
		}
	});
};

// GET /api/movies/:id
export const getMovieById = async (req, res) => {
	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);
	res.json({ data: movie });
};

// POST /api/movies
export const createMovie = async (req, res) => {
	const movie = await Movie.create(req.body);
	res.status(201).json({ data: movie });
};

// PUT /api/movies/:id
export const updateMovie = async (req, res) => {
	const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);
	res.json({ data: movie });
};

// DELETE /api/movies/:id
export const deleteMovie = async (req, res) => {
	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);

	// Eliminar carátula física si existe
	if (movie.cover) {
		try {
			await unlink(join(process.cwd(), 'uploads', movie.cover));
		} catch (err) {
			console.warn('Carátula no encontrada al borrar:', movie.cover);
		}
	}

	await Movie.findByIdAndDelete(req.params.id);
	res.status(204).send();
};

// POST /api/movies/:id/rent
export const rentMovie = async (req, res) => {
	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);
	if (movie.availableCopies <= 0) return handleHttpError(res, 'No hay copias disponibles', 400);

	movie.availableCopies -= 1;
	movie.timesRented += 1;
	await movie.save();

	res.json({ data: movie });
};

// POST /api/movies/:id/return
export const returnMovie = async (req, res) => {
	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);
	if (movie.availableCopies >= movie.copies) return handleHttpError(res, 'Todas las copias ya están devueltas', 400);

	movie.availableCopies += 1;
	await movie.save();

	res.json({ data: movie });
};

// PATCH /api/movies/:id/cover
export const uploadCover = async (req, res) => {
	if (!req.file) return handleHttpError(res, 'No se subió ninguna carátula', 400);

	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);

	// Si ya tenía una carátula, eliminarla del disco
	if (movie.cover) {
		try {
			await unlink(join(process.cwd(), 'uploads', movie.cover));
		} catch (err) {
			console.warn('Carátula anterior no encontrada:', movie.cover);
		}
	}

	movie.cover = req.file.filename;
	await movie.save();

	const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
	res.status(201).json({ data: { cover: movie.cover, url } });
};

// GET /api/movies/:id/cover
export const getCover = async (req, res) => {
	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);
	if (!movie.cover) return handleHttpError(res, 'Carátula no encontrada', 404);

	const filePath = join(process.cwd(), 'uploads', movie.cover);
	try {
		await stat(filePath);
		res.sendFile(filePath);
	} catch (err) {
		return handleHttpError(res, 'Archivo no encontrado', 404);
	}
};

// GET /api/movies/uploads/:filename
export const getCoverByFileName = async (req, res) => {
	const { filename } = req.params;
	const filePath = join(process.cwd(), 'uploads', filename);

	try {
		await stat(filePath);
		res.sendFile(filePath);
	} catch (err) {
		return handleHttpError(res, 'Archivo no encontrado', 404);
	}
};

// GET /api/movies/stats/top
export const getTopMovies = async (req, res) => {
	const { limit = 5 } = req.query;
	const movies = await Movie.find().sort({ timesRented: -1 }).limit(Number(limit));
	res.json({ data: movies });
};

// GET /api/movies/available
export const getAvailableMovies = async (req, res) => {
	const movies = await Movie.find({ availableCopies: { $gt: 0 } });
	res.json({ data: movies });
};

// POST /api/movies/:id/rate
export const rateMovie = async (req, res) => {
	const { rating } = req.body;
	if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 5) {
		return handleHttpError(res, 'Rating inválido (0-5)', 400);
	}

	const movie = await Movie.findById(req.params.id);
	if (!movie) return handleHttpError(res, 'Movie no encontrado', 404);

	movie.rating = rating;
	await movie.save();

	res.json({ data: movie });
};




