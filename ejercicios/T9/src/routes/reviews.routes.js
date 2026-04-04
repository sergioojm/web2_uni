import { Router } from 'express';
import {
  getBookReviews,
  createReview,
  deleteReview,
} from '../controllers/reviews.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReviewSchema, bookIdParamSchema, idParamSchema } from '../schemas/reviews.schema.js';
import authMiddleware from '../middleware/session.middleware.js';

const router = Router();

router.get('/book/:bookId', validate(bookIdParamSchema), getBookReviews);
router.post('/', authMiddleware, validate(createReviewSchema), createReview);
router.delete('/:id', authMiddleware, validate(idParamSchema), deleteReview);

export default router;
