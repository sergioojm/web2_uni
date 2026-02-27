import { Router } from 'express';
import * as movieController from '../controllers/movie.controller.js';
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { createMovieSchema, updateMovieSchema, getMovieFileNameSchema } from '../schemas/movie.schema.js';
import uploadMiddleware from '../utils/handleUploads.js';

const router = Router();


router.get('/', movieController.getMovies);
router.get('/available', movieController.getAvailableMovies);
router.get('/:id', validateObjectId(), movieController.getMovieById);

router.post('/', validate(createMovieSchema), movieController.createMovie);
router.put('/:id', validate(updateMovieSchema), movieController.updateMovie);

router.delete('/:id', validateObjectId(), movieController.deleteMovie);

router.post('/:id/rent', validateObjectId(), movieController.rentMovie);
router.post('/:id/return', validateObjectId(), movieController.returnMovie);

router.patch('/:id/cover', uploadMiddleware.single('file'), movieController.uploadCover);
router.get('/:id/cover', validateObjectId(), movieController.getCover);


router.get('/stats/top', movieController.getTopMovies);

router.post('/:id/rate', validateObjectId(), movieController.rateMovie);


export default router;