import bcryptjs from 'bcryptjs';

export const encrypt = (clearPassword) => bcryptjs.hash(clearPassword, 10);

export const compare = (clearPassword, hashed) =>
  bcryptjs.compare(clearPassword, hashed);

export const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));
