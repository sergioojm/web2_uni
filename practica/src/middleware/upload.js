import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `logo-${unique}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(AppError.badRequest('Solo se aceptan imágenes'));
  }
  cb(null, true);
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.uploadMaxSize }
}).single('logo');
