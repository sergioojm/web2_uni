import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const main = async () => {
  console.log('🌱 Seeding database...');

  await prisma.review.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const [admin, librarian, user] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@library.com',
        password: await bcryptjs.hash('Admin1234', 10),
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Librarian User',
        email: 'librarian@library.com',
        password: await bcryptjs.hash('Librarian1234', 10),
        role: 'LIBRARIAN',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@library.com',
        password: await bcryptjs.hash('User1234', 10),
        role: 'USER',
      },
    }),
  ]);

  const books = await Promise.all([
    prisma.book.create({
      data: {
        isbn: '978-0-06-112008-4',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        description: 'A novel about racial injustice and the loss of innocence.',
        publishedYear: 1960,
        copies: 5,
        available: 5,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-7432-7356-5',
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopia',
        description: 'A dystopian novel set in a totalitarian society.',
        publishedYear: 1949,
        copies: 3,
        available: 3,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-14-028329-7',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        description: 'A story about the American dream.',
        publishedYear: 1925,
        copies: 4,
        available: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${[admin, librarian, user].length} users`);
  console.log(`✅ Created ${books.length} books`);
  console.log('🎉 Seed complete');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
