import prisma from '../config/db.js';
import { asyncHandler, errors } from '../utils/handleError.js';

export const getBookReviews = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw errors.notFound('Book');

  const reviews = await prisma.review.findMany({
    where: { bookId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { bookId, rating, comment } = req.body;
  const userId = req.user.id;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw errors.notFound('Book');

  const review = await prisma.review.create({
    data: { userId, bookId, rating, comment },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json({ data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw errors.notFound('Review');

  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw errors.forbidden();
  }

  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ message: 'Review deleted', data: review });
});
