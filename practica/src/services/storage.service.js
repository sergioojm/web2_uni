import path from 'node:path';
import fs from 'node:fs/promises';

const provider = process.env.STORAGE_PROVIDER || 'local';

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

const localUpload = async (buffer, { folder, filename }) => {
  const dir = path.resolve('uploads', folder || '');
  await fs.mkdir(dir, { recursive: true });
  const fp = path.join(dir, filename);
  await fs.writeFile(fp, buffer);
  return { url: `/uploads/${folder ? folder + '/' : ''}${filename}` };
};

const cloudinaryUpload = async (buffer, { folder, filename, contentType }) => {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^.]+$/, ''),
        resource_type: contentType?.startsWith('image/') ? 'image' : 'raw'
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
};

const r2Upload = async (buffer, { folder, filename, contentType }) => {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
  const Key = `${folder ? folder + '/' : ''}${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return { url: `${process.env.R2_PUBLIC_URL}/${Key}` };
};

export const uploadBuffer = async (buffer, opts = {}) => {
  const data =
    opts.optimizeImage && opts.contentType?.startsWith('image/')
      ? await optimizeWithSharp(buffer)
      : buffer;

  switch (provider) {
    case 'cloudinary':
      return cloudinaryUpload(data, opts);
    case 'r2':
    case 's3':
      return r2Upload(data, opts);
    default:
      return localUpload(data, opts);
  }
};
