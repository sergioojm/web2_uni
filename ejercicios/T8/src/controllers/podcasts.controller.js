import Podcast from '../models/podcast.model.js';
import { asyncHandler, errors } from '../utils/handleError.js';

// GET /api/podcasts — public, only published
export const getPodcasts = asyncHandler(async (req, res) => {
  const podcasts = await Podcast.find({ published: true }).populate('author', 'name email');
  res.json({ data: podcasts });
});

// GET /api/podcasts/admin/all — admin, all podcasts
export const getAllPodcasts = asyncHandler(async (req, res) => {
  const podcasts = await Podcast.find({}).populate('author', 'name email');
  res.json({ data: podcasts });
});

// GET /api/podcasts/:id — public
export const getPodcast = asyncHandler(async (req, res) => {
  const podcast = await Podcast.findById(req.params.id).populate('author', 'name email');
  if (!podcast) throw errors.notFound('PODCAST_NOT_FOUND');
  res.json({ data: podcast });
});

// POST /api/podcasts — authenticated
export const createPodcast = asyncHandler(async (req, res) => {
  const podcast = await Podcast.create({ ...req.body, author: req.user._id });
  res.status(201).json({ data: podcast });
});

// PUT /api/podcasts/:id — authenticated, author only
export const updatePodcast = asyncHandler(async (req, res) => {
  const podcast = await Podcast.findById(req.params.id);
  if (!podcast) throw errors.notFound('PODCAST_NOT_FOUND');

  if (podcast.author.toString() !== req.user._id.toString()) {
    throw errors.forbidden();
  }

  const updated = await Podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ data: updated });
});

// DELETE /api/podcasts/:id — admin
export const deletePodcast = asyncHandler(async (req, res) => {
  const podcast = await Podcast.findByIdAndDelete(req.params.id);
  if (!podcast) throw errors.notFound('PODCAST_NOT_FOUND');
  res.json({ message: 'Podcast eliminado', data: podcast });
});

// PATCH /api/podcasts/:id/publish — admin, toggle published
export const publishPodcast = asyncHandler(async (req, res) => {
  const podcast = await Podcast.findById(req.params.id);
  if (!podcast) throw errors.notFound('PODCAST_NOT_FOUND');

  podcast.published = !podcast.published;
  await podcast.save();

  res.json({ data: podcast });
});
