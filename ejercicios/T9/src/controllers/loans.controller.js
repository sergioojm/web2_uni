import prisma from '../config/db.js';
import { asyncHandler, errors } from '../utils/handleError.js';

const MAX_ACTIVE_LOANS = 3;
const LOAN_DURATION_DAYS = 14;

export const getMyLoans = asyncHandler(async (req, res) => {
  const loans = await prisma.loan.findMany({
    where: { userId: req.user.id },
    include: { book: true },
    orderBy: { loanDate: 'desc' },
  });
  res.json({ data: loans });
});

export const getAllLoans = asyncHandler(async (req, res) => {
  const loans = await prisma.loan.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      book: true,
    },
    orderBy: { loanDate: 'desc' },
  });
  res.json({ data: loans });
});

export const requestLoan = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.id;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw errors.notFound('Book');
  if (book.available <= 0) throw errors.badRequest('No copies available');

  const activeLoans = await prisma.loan.count({
    where: { userId, status: 'ACTIVE' },
  });
  if (activeLoans >= MAX_ACTIVE_LOANS) {
    throw errors.badRequest(`Maximum ${MAX_ACTIVE_LOANS} active loans allowed`);
  }

  const duplicate = await prisma.loan.findFirst({
    where: { userId, bookId, status: 'ACTIVE' },
  });
  if (duplicate) throw errors.conflict('You already have an active loan for this book');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: { userId, bookId, dueDate },
      include: { book: true },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { available: { decrement: 1 } },
    }),
  ]);

  res.status(201).json({ data: loan });
});

export const returnLoan = asyncHandler(async (req, res) => {
  const loan = await prisma.loan.findUnique({
    where: { id: req.params.id },
    include: { book: true },
  });
  if (!loan) throw errors.notFound('Loan');

  if (loan.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw errors.forbidden();
  }

  if (loan.status === 'RETURNED') {
    throw errors.badRequest('Loan has already been returned');
  }

  const [updated] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED', returnDate: new Date() },
      include: { book: true },
    }),
    prisma.book.update({
      where: { id: loan.bookId },
      data: { available: { increment: 1 } },
    }),
  ]);

  res.json({ data: updated });
});
