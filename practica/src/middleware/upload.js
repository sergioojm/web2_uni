import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

const imageFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(AppError.badRequest('Solo se aceptan imágenes'));
  }
  cb(null, true);
};

export const uploadLogo = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: config.uploadMaxSize }
}).single('logo');

export const uploadSignature = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: config.uploadMaxSize }
}).single('signature');
