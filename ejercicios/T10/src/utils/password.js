import bcryptjs from 'bcryptjs';

export const encrypt = (password) => bcryptjs.hash(password, 10);
export const compare = (plain, hashed) => bcryptjs.compare(plain, hashed);
