// src/routes/index.js
import { Router } from 'express';
import tareasRoutes from './tareas.routes.js';


const router = Router();


router.use('/tareas', tareasRoutes);

router.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Tareas v1.0',
    endpoints: {
      tareas: '/tareas',
      health: '/health'
    }
  });
});


export default router;