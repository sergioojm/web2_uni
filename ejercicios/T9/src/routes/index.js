import { Router } from 'express';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routeFiles = readdirSync(__dirname).filter(
  (file) => file.endsWith('.routes.js')
);

const loadRoutes = async () => {
  for (const file of routeFiles) {
    const routeName = file.replace('.routes.js', '');
    const fileURL = pathToFileURL(join(__dirname, file)).href;
    const routeModule = await import(fileURL);
    router.use(`/${routeName}`, routeModule.default);
    console.log(`📍 Route loaded: /api/${routeName}`);
  }
};

loadRoutes();

export default router;
