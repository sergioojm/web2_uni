import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/pagination.js';
import { emitToCompany } from '../services/socket.service.js';

const scope = (req) => ({ company: req.user.company });

export const create = async (req, res, next) => {
  try {
    const exists = await Client.findOne({
      company: req.user.company,
      cif: req.body.cif
    });
    if (exists) throw AppError.conflict('Ya existe un cliente con ese CIF');

    const client = await Client.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company
    });

    emitToCompany(req.user.company, 'client:new', { client });
    res.status(201).json({ message: 'Cliente creado', data: { client } });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...scope(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ message: 'Cliente actualizado', data: { client } });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const { page, limit, name, sort } = req.query;
    const filter = { ...scope(req) };
    if (name) filter.name = { $regex: name, $options: 'i' };
    const result = await paginate(Client, filter, {
      page,
      limit,
      sort: sort || '-createdAt'
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const listArchived = async (req, res, next) => {
  try {
    const result = await paginate(
      Client,
      { ...scope(req), deleted: true },
      {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort || '-updatedAt',
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
    const client = await Client.findOne({
      _id: req.params.id,
      ...scope(req)
    });
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ data: { client } });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';
    const filter = { _id: req.params.id, ...scope(req) };
    if (soft) {
      const client = await Client.findOneAndUpdate(
        filter,
        { deleted: true },
        { new: true }
      );
      if (!client) throw AppError.notFound('Cliente no encontrado');
      return res.json({ message: 'Cliente archivado', data: { client } });
    }
    const result = await Client.deleteOne(filter);
    if (result.deletedCount === 0) {
      throw AppError.notFound('Cliente no encontrado');
    }
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    next(err);
  }
};

export const restore = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...scope(req) },
      { deleted: false },
      { new: true, withDeleted: true }
    ).setOptions({ withDeleted: true });
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ message: 'Cliente restaurado', data: { client } });
  } catch (err) {
    next(err);
  }
};
