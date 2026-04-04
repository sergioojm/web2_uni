import { Router } from 'express';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/books.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBookSchema, updateBookSchema, idParamSchema } from '../schemas/books.schema.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';

const router = Router();

router.get('/', getBooks);
router.get('/:id', validate(idParamSchema), getBook);
router.post('/', authMiddleware, checkRol('LIBRARIAN', 'ADMIN'), validate(createBookSchema), createBook);
router.put('/:id', authMiddleware, checkRol('LIBRARIAN', 'ADMIN'), validate(idParamSchema), validate(updateBookSchema), updateBook);
router.delete('/:id', authMiddleware, checkRol('ADMIN'), validate(idParamSchema), deleteBook);

export default router;
