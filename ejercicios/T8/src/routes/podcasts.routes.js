import { Router } from 'express';
import {
  getPodcasts,
  getAllPodcasts,
  getPodcast,
  createPodcast,
  updatePodcast,
  deletePodcast,
  publishPodcast,
} from '../controllers/podcasts.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPodcastSchema, updatePodcastSchema, idParamSchema } from '../validators/podcast.validator.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';

const router = Router();

router.get('/', getPodcasts);
router.get('/admin/all', authMiddleware, checkRol('admin'), getAllPodcasts);
router.get('/:id', validate(idParamSchema), getPodcast);
router.post('/', authMiddleware, validate(createPodcastSchema), createPodcast);
router.put('/:id', authMiddleware, validate(idParamSchema), validate(updatePodcastSchema), updatePodcast);
router.delete('/:id', authMiddleware, checkRol('admin'), validate(idParamSchema), deletePodcast);
router.patch('/:id/publish', authMiddleware, checkRol('admin'), validate(idParamSchema), publishPodcast);

export default router;
