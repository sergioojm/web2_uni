import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const optimizeWithSharp = async (buffer) => {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return buffer;
  }
};

export const uploadBuffer = async (buffer, opts = {}) => {
  const data =
    opts.optimizeImage && opts.contentType?.startsWith('image/')
      ? await optimizeWithSharp(buffer)
      : buffer;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        public_id: opts.filename?.replace(/\.[^.]+$/, ''),
        resource_type: opts.contentType?.startsWith('image/') ? 'image' : 'raw'
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url });
      }
    );
    stream.end(data);
  });
};
