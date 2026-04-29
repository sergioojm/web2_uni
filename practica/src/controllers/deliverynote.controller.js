import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/pagination.js';
import { emitToCompany } from '../services/socket.service.js';
import { uploadBuffer } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';

const scope = (req) => ({ company: req.user.company });

export const create = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.body.project,
      company: req.user.company
    });
    if (!project) throw AppError.badRequest('Proyecto no válido');

    const client = await Client.findOne({
      _id: req.body.client,
      company: req.user.company
    });
    if (!client) throw AppError.badRequest('Cliente no válido');

    const note = await DeliveryNote.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company
    });

    emitToCompany(req.user.company, 'deliverynote:new', { deliveryNote: note });
    res.status(201).json({ message: 'Albarán creado', data: { deliveryNote: note } });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const { page, limit, project, client, format, signed, from, to, sort } =
      req.query;
    const filter = { ...scope(req) };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
    }
    const result = await paginate(DeliveryNote, filter, {
      page,
      limit,
      sort: sort || '-workDate',
      populate: [
        { path: 'client', select: 'name cif' },
        { path: 'project', select: 'name projectCode' }
      ]
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      ...scope(req)
    })
      .populate('user', 'email name lastName')
      .populate('client')
      .populate('project');
    if (!note) throw AppError.notFound('Albarán no encontrado');
    res.json({ data: { deliveryNote: note } });
  } catch (err) {
    next(err);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      ...scope(req)
    })
      .populate('user', 'email name lastName')
      .populate('client')
      .populate('project');
    if (!note) throw AppError.notFound('Albarán no encontrado');

    if (note.signed && note.pdfUrl) {
      return res.redirect(note.pdfUrl);
    }

    const buffer = await generateDeliveryNotePdf(note);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="albaran-${note._id}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export const sign = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('Falta la imagen de la firma');

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      ...scope(req)
    })
      .populate('user', 'email name lastName')
      .populate('client')
      .populate('project');
    if (!note) throw AppError.notFound('Albarán no encontrado');
    if (note.signed) throw AppError.conflict('Albarán ya firmado');

    const { url: signatureUrl } = await uploadBuffer(req.file.buffer, {
      folder: 'signatures',
      filename: `signature-${note._id}.webp`,
      contentType: 'image/webp',
      optimizeImage: true
    });
    note.signatureUrl = signatureUrl;
    note.signed = true;
    note.signedAt = new Date();

    const pdfBuffer = await generateDeliveryNotePdf(note);
    const { url: pdfUrl } = await uploadBuffer(pdfBuffer, {
      folder: 'pdfs',
      filename: `albaran-${note._id}.pdf`,
      contentType: 'application/pdf'
    });
    note.pdfUrl = pdfUrl;
    await note.save();

    emitToCompany(req.user.company, 'deliverynote:signed', {
      deliveryNote: note
    });

    res.json({ message: 'Albarán firmado', data: { deliveryNote: note } });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      ...scope(req)
    });
    if (!note) throw AppError.notFound('Albarán no encontrado');
    if (note.signed) {
      throw AppError.conflict('No se puede borrar un albarán firmado');
    }
    await DeliveryNote.deleteOne({ _id: note._id });
    res.json({ message: 'Albarán eliminado' });
  } catch (err) {
    next(err);
  }
};
