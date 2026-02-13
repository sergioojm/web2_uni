import { safeParse } from 'zod';
import { myChores } from '../data/tareas.js';
import { ApiError } from '../middleware/errorHandler.js';

const tareas = myChores;

export const getAll = (req, res) => {
  let resultado = [...tareas];
  const { completed, priority } = req.query;

  if (completed !== undefined) {
    const completedBool = completed === "true";
    resultado = resultado.filter(t => t.completed === completedBool);
  }

  if (priority !== undefined) {
    resultado = resultado.filter(t => t.priority === priority);
  }

  res.json(resultado);
};


export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const tarea = tareas.find(t => t.id === id);

  if (!tarea) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }

  res.json(tarea);
};



export const create = (req, res) => {
  const { title, description, priority } = req.body;
  
  const newTarea = {
    id: tareas.length + 1,
    title,
    description: description || null,
    completed: false,
    priority,
    createdAt: new Date().toISOString()
  };
  
  tareas.push(newTarea);
  
  res.status(201).json(newTarea);
};


export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
   const { title, description, completed, priority } = req.body;
  
    tareas[index] = {
        id,
        title,
        description: description || null,
        completed,
        priority,
    };
  
  
  res.json(tareas[index]);
};


export const partialUpdate = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
  tareas[index] = {
    ...tareas[index],
    ...req.body
  };
  
  res.json(tareas[index]);
};


export const remove = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
  tareas.splice(index, 1);
  
  res.status(204).end();
};