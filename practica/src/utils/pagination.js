export const paginate = async (
  Model,
  filter = {},
  { page = 1, limit = 10, sort = '-createdAt', populate = null, withDeleted = false } = {}
) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (p - 1) * l;

  const buildQuery = () => {
    const q = Model.find(filter).sort(sort).skip(skip).limit(l);
    if (withDeleted) q.setOptions({ withDeleted: true });
    if (populate) {
      const arr = Array.isArray(populate) ? populate : [populate];
      arr.forEach((pop) => q.populate(pop));
    }
    return q;
  };

  const buildCount = () => {
    const q = Model.countDocuments(filter);
    if (withDeleted) q.setOptions({ withDeleted: true });
    return q;
  };

  const [items, totalItems] = await Promise.all([buildQuery(), buildCount()]);
  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / l) || 1,
    currentPage: p,
    limit: l
  };
};
