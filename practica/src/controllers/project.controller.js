import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/pagination.js';
import { emitToCompany } from '../services/socket.service.js';

const scope = (req) => ({ company: req.user.company });

export const create = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.body.client,
      company: req.user.company
    });
    if (!client) throw AppError.badRequest('Cliente no válido para tu compañía');

    const exists = await Project.findOne({
      company: req.user.company,
      projectCode: req.body.projectCode
    });
    if (exists) {
      throw AppError.conflict('Ya existe un proyecto con ese código');
    }

    const project = await Project.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company
    });

    emitToCompany(req.user.company, 'project:new', { project });
    res.status(201).json({ message: 'Proyecto creado', data: { project } });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    if (req.body.client) {
      const client = await Client.findOne({
        _id: req.body.client,
        company: req.user.company
      });
      if (!client) {
        throw AppError.badRequest('Cliente no válido para tu compañía');
      }
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ...scope(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ message: 'Proyecto actualizado', data: { project } });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const { page, limit, client, name, active, sort } = req.query;
    const filter = { ...scope(req) };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const result = await paginate(Project, filter, {
      page,
      limit,
      sort: sort || '-createdAt',
      populate: { path: 'client', select: 'name cif' }
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const listArchived = async (req, res, next) => {
  try {
    const result = await paginate(
      Project,
      { ...scope(req), deleted: true },
      {
        page: req.query.page,
        limit: req.query.limit,
        sort: '-updatedAt',
        withDeleted: true
      }
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ...scope(req)
    }).populate('client', 'name cif email');
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ data: { project } });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';
    const filter = { _id: req.params.id, ...scope(req) };
    if (soft) {
      const project = await Project.findOneAndUpdate(
        filter,
        { deleted: true },
        { new: true }
      );
      if (!project) throw AppError.notFound('Proyecto no encontrado');
      return res.json({ message: 'Proyecto archivado', data: { project } });
    }
    const result = await Project.deleteOne(filter);
    if (result.deletedCount === 0) {
      throw AppError.notFound('Proyecto no encontrado');
    }
    res.json({ message: 'Proyecto eliminado' });
  } catch (err) {
    next(err);
  }
};

export const restore = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ...scope(req) },
      { deleted: false },
      { new: true }
    ).setOptions({ withDeleted: true });
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ message: 'Proyecto restaurado', data: { project } });
  } catch (err) {
    next(err);
  }
};
