import prisma from '../config/db.js';
import { asyncHandler, errors } from '../utils/handleError.js';

export const getBooks = asyncHandler(async (req, res) => {
  const { genre, author, available } = req.query;

  const where = {};
  if (genre) where.genre = genre;
  if (author) where.author = { contains: author, mode: 'insensitive' };
  if (available === 'true') where.available = { gt: 0 };

  const books = await prisma.book.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ data: books });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await prisma.book.findUnique({
    where: { id: req.params.id },
    include: {
      reviews: {
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!book) throw errors.notFound('Book');
  res.json({ data: book });
});

export const createBook = asyncHandler(async (req, res) => {
  const { copies, ...rest } = req.body;
  const book = await prisma.book.create({
    data: { ...rest, copies, available: copies },
  });
  res.status(201).json({ data: book });
});

export const updateBook = asyncHandler(async (req, res) => {
  const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!existing) throw errors.notFound('Book');

  const updateData = { ...req.body };
  if (updateData.copies !== undefined) {
    const diff = updateData.copies - existing.copies;
    updateData.available = existing.available + diff;
    if (updateData.available < 0) throw errors.badRequest('Cannot reduce copies below currently loaned amount');
  }

  const book = await prisma.book.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json({ data: book });
});

export const deleteBook = asyncHandler(async (req, res) => {
  const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!existing) throw errors.notFound('Book');

  await prisma.book.delete({ where: { id: req.params.id } });
  res.json({ message: 'Book deleted', data: existing });
});
