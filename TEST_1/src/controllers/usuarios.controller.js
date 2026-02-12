import { users } from "../data/usuarios.js";
import { ApiError } from "../middleware/errorHandler.js";

const usuarios = users;

export const getAll = (req, res) => {
  let resultado = [...usuarios];
  const { email, name, nivel } = req.query;
  

  if (nivel) {
    resultado = resultado.filter(c => c.nivel === nivel);
  }
  
  res.json(resultado);
};

// GET /api/usuarios/:id
export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const curso = usuarios.find(c => c.id === id);
  
  if (!curso) {
    throw ApiError.notFound(`Usuario con ID ${id} no encontrado`);
  }
  
  res.json(curso);
};


export const create = (req, res) => {
  const { email, name, nivel } = req.body;
  
  const newUser = {
    id: usuarios.length + 1,
    email,
    name,
    nivel,
  };
  
  usuarios.push(newUser);
  
  res.status(201).json(newUser);
};